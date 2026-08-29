import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import {
  conversations,
  messages,
  messageSources,
  agents,
  documents,
  documentChunks,
  dataSources,
} from "../../drizzle/schema";
import { requireDb, writeAuditLog } from "../db";
import { invokeLLM, invokeLLMStreaming, routeModel, type Message as LLMMessage, type Tool } from "../_core/llm";
import { retrieveRelevantChunks, type RetrievalResult } from "./rag";

// ─── Context Window Management ──────────────────────────────────────────────
export interface ConversationContext {
  systemPrompt: string;
  history: LLMMessage[];
  retrievedDocs: RetrievalResult[];
  tools: Tool[];
  tokenBudget: number;
}

const DEFAULT_TOKEN_BUDGET = 12000;
const HISTORY_TOKEN_ESTIMATE_PER_MSG = 150;

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export function truncateToBudget(messages: LLMMessage[], budget: number): LLMMessage[] {
  let totalTokens = 0;
  const result: LLMMessage[] = [];
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    const content = typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content);
    const tokens = estimateTokens(content);
    if (totalTokens + tokens > budget) break;
    totalTokens += tokens;
    result.unshift(msg);
  }
  return result;
}

// ─── Conversation Engine ────────────────────────────────────────────────────
export interface ChatRequest {
  workspaceId: number;
  conversationId: number;
  userId: number;
  message: string;
  agentId?: number;
  model?: string;
  temperature?: number;
  tools?: Tool[];
  onChunk?: (chunk: string) => void;
}

export interface ChatResponse {
  id: number;
  content: string;
  role: "assistant";
  toolCalls?: Array<{ name: string; arguments: string; result?: string }>;
  sources?: Array<{ label: string; sourceType: string; sourceReference: string }>;
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  model: string;
  latencyMs: number;
}

export async function getConversationHistory(workspaceId: number, conversationId: number, limit = 20): Promise<LLMMessage[]> {
  const db = await requireDb();
  const rows = await db
    .select()
    .from(messages)
    .where(and(eq(messages.workspaceId, workspaceId), eq(messages.conversationId, conversationId)))
    .orderBy(messages.createdAt)
    .limit(limit);

  return rows.map(row => ({
    role: row.role as "user" | "assistant" | "system",
    content: row.content,
  }));
}

export async function buildSystemPrompt(agentId?: number): Promise<string> {
  const basePrompt = `You are SOPRANOVA, an enterprise AI agent platform. You are intelligent, helpful, and professional.
You can answer questions, perform tasks, and use tools when needed.
Always respond in the language the user writes in. Support Arabic, English, and Italian natively.
When you don't know something, say so honestly. Never fabricate information.`;

  if (!agentId) return basePrompt;

  const db = await requireDb();
  const agent = (
    await db
      .select()
      .from(agents)
      .where(and(eq(agents.id, agentId), isNull(agents.deletedAt)))
      .limit(1)
  )[0];

  if (!agent) return basePrompt;

  return `${basePrompt}\n\nYou are operating as "${agent.name}".\nPurpose: ${agent.purpose}\n${agent.description ? `Description: ${agent.description}` : ""}\nCapabilities: ${(agent.capabilities as string[] || []).join(", ")}`;
}

export async function chat(request: ChatRequest): Promise<ChatResponse> {
  const startTime = Date.now();
  const db = await requireDb();

  // 1. Build system prompt
  const systemPrompt = await buildSystemPrompt(request.agentId);

  // 2. Get conversation history
  const history = await getConversationHistory(request.workspaceId, request.conversationId);

  // 3. Retrieve relevant documents (RAG)
  const retrievalResults = await retrieveRelevantChunks(request.workspaceId, request.message, 5);

  // 4. Build context
  const contextMessages: LLMMessage[] = [
    { role: "system", content: systemPrompt },
  ];

  // Add retrieved context if available
  if (retrievalResults.length > 0) {
    const contextBlock = retrievalResults
      .map((r, i) => `[Source ${i + 1}: ${r.documentName}] ${r.content}`)
      .join("\n\n");
    contextMessages.push({
      role: "system",
      content: `Relevant knowledge:\n${contextBlock}`,
    });
  }

  // Add history
  contextMessages.push(...truncateToBudget(history, DEFAULT_TOKEN_BUDGET));

  // Add current message
  contextMessages.push({ role: "user", content: request.message });

  // 5. Select model
  const model = request.model || routeModel({
    capabilities: request.tools && request.tools.length > 0 ? ["function_calling"] : ["chat"],
    language: detectLanguage(request.message),
  });

  // 6. Invoke LLM
  const result = await invokeLLM({
    messages: contextMessages,
    tools: request.tools,
    model,
    temperature: request.temperature ?? 0.7,
    maxTokens: 2000,
    onChunk: request.onChunk,
  });

  const responseContent = extractTextContent(result.choices[0]?.message?.content) || "I could not produce a response.";
  const toolCalls = result.choices[0]?.message?.tool_calls;

  // 7. Save user message
  const [userMsg] = await db
    .insert(messages)
    .values({
      workspaceId: request.workspaceId,
      conversationId: request.conversationId,
      authorUserId: request.userId,
      role: "user",
      kind: "question",
      content: request.message,
    })
    .returning({ id: messages.id });

  // 8. Save assistant message
  const [assistantMsg] = await db
    .insert(messages)
    .values({
      workspaceId: request.workspaceId,
      conversationId: request.conversationId,
      role: "assistant",
      kind: "insight",
      content: responseContent,
      metadata: {
        model,
        usage: result.usage,
        toolCalls: toolCalls?.map(tc => ({ name: tc.function.name, arguments: tc.function.arguments })),
      },
    })
    .returning({ id: messages.id });

  // 9. Save source references
  if (retrievalResults.length > 0) {
    await db.insert(messageSources).values(
      retrievalResults.map(r => ({
        messageId: assistantMsg.id,
        workspaceId: request.workspaceId,
        label: r.documentName,
        sourceType: "document" as const,
        sourceReference: String(r.documentId),
      }))
    );
  }

  // 10. Update conversation timestamp
  await db.update(conversations).set({ lastMessageAt: new Date() }).where(eq(conversations.id, request.conversationId));

  // 11. Audit log
  await writeAuditLog({
    workspaceId: request.workspaceId,
    actorUserId: request.userId,
    action: "chat.completed",
    resourceType: "conversation",
    resourceId: request.conversationId,
    metadata: { model, latencyMs: Date.now() - startTime, tokens: result.usage },
  });

  return {
    id: assistantMsg.id,
    content: responseContent,
    role: "assistant",
    toolCalls: toolCalls?.map(tc => ({ name: tc.function.name, arguments: tc.function.arguments })),
    sources: retrievalResults.map(r => ({ label: r.documentName, sourceType: "document", sourceReference: String(r.documentId) })),
    usage: result.usage,
    model,
    latencyMs: Date.now() - startTime,
  };
}

// ─── Streaming Chat ─────────────────────────────────────────────────────────
export async function chatStreaming(request: ChatRequest): Promise<ChatResponse> {
  return chat(request);
}

// ─── Helpers ────────────────────────────────────────────────────────────────
function extractTextContent(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .filter((item): item is { type: "text"; text: string } => typeof item === "object" && item !== null && "type" in item && (item as { type?: unknown }).type === "text" && "text" in item)
      .map(item => (item as { text: string }).text)
      .join("\n");
  }
  return "";
}

function detectLanguage(text: string): string {
  const arabicRegex = /[\u0600-\u06FF]/;
  const italianRegex = /\b(il|lo|la|le|gli|un|una|di|del|della|dei|degli|che|è|sono|ho|hai|ha|come|cosa|quando|dove|perché|questo|quello)\b/i;

  if (arabicRegex.test(text)) return "ar";
  if (italianRegex.test(text)) return "it";
  return "en";
}
