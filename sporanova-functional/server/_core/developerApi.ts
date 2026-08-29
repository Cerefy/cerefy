import { createHash, randomBytes } from "node:crypto";
import { requireDb, writeAuditLog } from "../db";
import { and, eq, isNull, sql } from "drizzle-orm";
import { agents, conversations, messages } from "../../drizzle/schema";

// ─── API Key Management ─────────────────────────────────────────────────────
export interface APIKeyRecord {
  id: string;
  name: string;
  keyPrefix: string;
  keyHash: string;
  scopes: string[];
  workspaceId: number;
  userId: number;
  rateLimit: number;
  expiresAt?: Date;
  lastUsedAt?: Date;
  createdAt: Date;
  isActive: boolean;
}

const apiKeys = new Map<string, APIKeyRecord>();

export function createAPIKey(input: {
  name: string;
  workspaceId: number;
  userId: number;
  scopes?: string[];
  rateLimit?: number;
  expiresInDays?: number;
}): { key: string; record: APIKeyRecord } {
  const rawKey = `sk_live_${randomBytes(32).toString("hex")}`;
  const keyHash = createHash("sha256").update(rawKey).digest("hex");
  const keyPrefix = rawKey.slice(0, 12);

  const record: APIKeyRecord = {
    id: `ak_${Date.now()}`,
    name: input.name,
    keyPrefix,
    keyHash,
    scopes: input.scopes || ["*"],
    workspaceId: input.workspaceId,
    userId: input.userId,
    rateLimit: input.rateLimit || 100,
    expiresAt: input.expiresInDays ? new Date(Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000) : undefined,
    createdAt: new Date(),
    isActive: true,
  };

  apiKeys.set(keyHash, record);
  return { key: rawKey, record };
}

export function validateAPIKey(rawKey: string): APIKeyRecord | null {
  const keyHash = createHash("sha256").update(rawKey).digest("hex");
  const record = apiKeys.get(keyHash);
  if (!record || !record.isActive) return null;
  if (record.expiresAt && record.expiresAt < new Date()) return null;
  record.lastUsedAt = new Date();
  return record;
}

export function revokeAPIKey(keyHash: string): boolean {
  const record = apiKeys.get(keyHash);
  if (!record) return false;
  record.isActive = false;
  return true;
}

// ─── Public API Endpoints ───────────────────────────────────────────────────
export interface AgentConfig {
  id: string;
  name: string;
  purpose: string;
  description?: string;
  model?: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  tools?: string[];
  language?: string;
  channel?: string;
  welcomeMessage?: string;
  fallbackMessage?: string;
}

export async function createAgentAPI(workspaceId: number, config: AgentConfig, userId?: number): Promise<{ id: string; name: string; status: string }> {
  const db = await requireDb();
  const [agent] = await db.insert(agents).values({
    workspaceId,
    name: config.name,
    purpose: config.purpose,
    description: config.description,
    configuration: {
      model: config.model,
      systemPrompt: config.systemPrompt,
      temperature: config.temperature,
      maxTokens: config.maxTokens,
      tools: config.tools,
      language: config.language,
      channel: config.channel,
      welcomeMessage: config.welcomeMessage,
      fallbackMessage: config.fallbackMessage,
    },
    capabilities: config.tools || [],
    createdById: userId ?? 1,
  }).returning({ id: agents.id });

  return { id: String(agent.id), name: config.name, status: "active" };
}

export async function updateAgentAPI(workspaceId: number, agentId: string, config: Partial<AgentConfig>): Promise<{ success: boolean }> {
  const db = await requireDb();
  await db.update(agents).set({
    ...(config.name && { name: config.name }),
    ...(config.purpose && { purpose: config.purpose }),
    ...(config.description && { description: config.description }),
  }).where(and(eq(agents.id, parseInt(agentId)), eq(agents.workspaceId, workspaceId)));
  return { success: true };
}

export async function deleteAgentAPI(workspaceId: number, agentId: string): Promise<{ success: boolean }> {
  const db = await requireDb();
  await db.update(agents).set({ deletedAt: new Date() }).where(and(eq(agents.id, parseInt(agentId)), eq(agents.workspaceId, workspaceId)));
  return { success: true };
}

export async function listAgentsAPI(workspaceId: number): Promise<Array<{ id: string; name: string; purpose: string; status: string }>> {
  const db = await requireDb();
  const agentList = await db.select().from(agents).where(and(eq(agents.workspaceId, workspaceId), isNull(agents.deletedAt)));
  return agentList.map(a => ({ id: String(a.id), name: a.name, purpose: a.purpose, status: a.status }));
}

export async function chatAPI(workspaceId: number, agentId: string, message: string, userId?: number): Promise<{ response: string; model: string; tokens: number }> {
  const db = await requireDb();
  const agent = (await db.select().from(agents).where(and(eq(agents.id, parseInt(agentId)), eq(agents.workspaceId, workspaceId), isNull(agents.deletedAt))).limit(1))[0];
  if (!agent) throw new Error("Agent not found");

  const config = (agent.configuration || {}) as Record<string, unknown>;

  // Create conversation
  const [conv] = await db.insert(conversations).values({
    workspaceId,
    title: `API Chat - ${new Date().toISOString()}`,
    createdById: userId ?? 1,
  }).returning({ id: conversations.id });

  // Save user message
  await db.insert(messages).values({
    conversationId: conv.id,
    workspaceId,
    role: "user",
    kind: "question",
    content: message,
  });

  // Import and call LLM
  const { invokeLLM } = await import("./llm");
  const systemPrompt = (config.systemPrompt as string) || `You are ${agent.name}. ${agent.purpose}`;

  const result = await invokeLLM({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: message },
    ],
    model: config.model as string,
    temperature: config.temperature as number,
    maxTokens: (config.maxTokens as number) || 1000,
  });

  const content = typeof result.choices[0]?.message?.content === "string"
    ? result.choices[0].message.content
    : "";

  // Save assistant message
  await db.insert(messages).values({
    conversationId: conv.id,
    workspaceId,
    role: "assistant",
    kind: "insight",
    content,
    metadata: { model: result.model, usage: result.usage },
  });

  return {
    response: content,
    model: result.model,
    tokens: result.usage?.total_tokens || 0,
  };
}

// ─── SDK Code Generation ────────────────────────────────────────────────────
export function generateSDKCode(apiKey: string, baseUrl: string): string {
  return `
// SOPRANOVA SDK
const SOPRANOVA_API = "${baseUrl}/api/v1";

export class SopranovaClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl?: string) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl || SOPRANOVA_API;
  }

  private async request(path: string, options: RequestInit = {}) {
    const response = await fetch(\`\${this.baseUrl}\${path}\`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "Authorization": \`Bearer \${this.apiKey}\`,
        ...options.headers,
      },
    });
    if (!response.ok) throw new Error(\`API Error: \${response.status}\`);
    return response.json();
  }

  async listAgents() {
    return this.request("/agents");
  }

  async createAgent(config: { name: string; purpose: string; model?: string }) {
    return this.request("/agents", { method: "POST", body: JSON.stringify(config) });
  }

  async chat(agentId: string, message: string) {
    return this.request(\`/agents/\${agentId}/chat\`, { method: "POST", body: JSON.stringify({ message }) });
  }

  async getAnalytics(workspaceId: number) {
    return this.request(\`/analytics?workspaceId=\${workspaceId}\`);
  }

  async getTraces(workspaceId: number) {
    return this.request(\`/traces?workspaceId=\${workspaceId}\`);
  }
}

export default SopranovaClient;
`;
}

// ─── MCP Marketplace ────────────────────────────────────────────────────────
export interface MCPToolDefinition {
  name: string;
  description: string;
  serverName: string;
  inputSchema: Record<string, unknown>;
  category: string;
  author: string;
  version: string;
  downloads: number;
}

const mcpMarketplace: MCPToolDefinition[] = [
  { name: "salesforce_query", description: "Query Salesforce objects", serverName: "salesforce-mcp", inputSchema: { type: "object", properties: { object: { type: "string" }, query: { type: "string" } } }, category: "CRM", author: "SOPRANOVA", version: "1.0.0", downloads: 1250 },
  { name: "hubspot_contacts", description: "Manage HubSpot contacts", serverName: "hubspot-mcp", inputSchema: { type: "object", properties: { action: { type: "string" }, email: { type: "string" } } }, category: "CRM", author: "SOPRANOVA", version: "1.0.0", downloads: 980 },
  { name: "shopify_products", description: "Manage Shopify products", serverName: "shopify-mcp", inputSchema: { type: "object", properties: { action: { type: "string" }, productId: { type: "string" } } }, category: "E-Commerce", author: "SOPRANOVA", version: "1.0.0", downloads: 750 },
  { name: "google_calendar", description: "Manage Google Calendar events", serverName: "gcal-mcp", inputSchema: { type: "object", properties: { action: { type: "string" }, date: { type: "string" } } }, category: "Productivity", author: "SOPRANOVA", version: "1.0.0", downloads: 1100 },
  { name: "web_scraper", description: "Scrape web pages for content", serverName: "scraper-mcp", inputSchema: { type: "object", properties: { url: { type: "string" } } }, category: "Data", author: "Community", version: "1.2.0", downloads: 2200 },
];

export function searchMCPMarketplace(query: string, category?: string): MCPToolDefinition[] {
  return mcpMarketplace.filter(t => {
    if (category && t.category !== category) return false;
    if (query && !t.name.includes(query.toLowerCase()) && !t.description.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });
}

export function getMCPToolDetails(name: string): MCPToolDefinition | undefined {
  return mcpMarketplace.find(t => t.name === name);
}
