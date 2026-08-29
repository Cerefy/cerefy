import { ENV } from "./env";

export type Role = "system" | "user" | "assistant" | "tool" | "function";

export type TextContent = { type: "text"; text: string };
export type ImageContent = { type: "image_url"; image_url: { url: string; detail?: "auto" | "low" | "high" } };
export type FileContent = { type: "file_url"; file_url: { url: string; mime_type?: string } };
export type MessageContent = string | TextContent | ImageContent | FileContent;

export type Message = {
  role: Role;
  content: MessageContent | MessageContent[];
  name?: string;
  tool_call_id?: string;
};

export type Tool = {
  type: "function";
  function: { name: string; description?: string; parameters?: Record<string, unknown> };
};

export type ToolChoicePrimitive = "none" | "auto" | "required";
export type ToolChoice = ToolChoicePrimitive | { name: string } | { type: "function"; function: { name: string } };

export type InvokeParams = {
  messages: Message[];
  tools?: Tool[];
  toolChoice?: ToolChoice;
  maxTokens?: number;
  outputSchema?: { name: string; schema: Record<string, unknown>; strict?: boolean };
  responseFormat?: { type: "text" } | { type: "json_object" } | { type: "json_schema"; json_schema: { name: string; schema: Record<string, unknown>; strict?: boolean } };
  model?: string;
  temperature?: number;
  topP?: number;
  stream?: boolean;
  onChunk?: (chunk: string) => void;
};

export type ToolCall = { id: string; type: "function"; function: { name: string; arguments: string } };

export type InvokeResult = {
  id: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: { role: Role; content: string | Array<TextContent | ImageContent | FileContent>; tool_calls?: ToolCall[] };
    finish_reason: string | null;
  }>;
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
};

export type ModelInfo = { id: string; object: string; created: number; owned_by: string };
export type ModelsResponse = { object: string; data: ModelInfo[] };

// ─── Provider Registry ──────────────────────────────────────────────────────
export type LLMProvider = "openai" | "anthropic" | "google" | "openai-compatible";

interface ProviderConfig {
  baseUrl: string;
  apiKey: string;
  defaultModel: string;
  provider: LLMProvider;
}

const providerConfigs: Record<string, ProviderConfig> = {};

export function registerProvider(name: string, config: ProviderConfig) {
  providerConfigs[name] = config;
}

export function getProvider(name?: string): ProviderConfig {
  const providerName = name || ENV.ai.provider || "default";
  if (providerConfigs[providerName]) return providerConfigs[providerName];
  return {
    baseUrl: ENV.ai.baseUrl || "",
    apiKey: ENV.ai.apiKey || "",
    defaultModel: ENV.ai.model || "gpt-4o-mini",
    provider: (ENV.ai.provider as LLMProvider) || "openai-compatible",
  };
}

// ─── Content Normalization ──────────────────────────────────────────────────
const ensureArray = (value: MessageContent | MessageContent[]): MessageContent[] => (Array.isArray(value) ? value : [value]);

const normalizeContentPart = (part: MessageContent): TextContent | ImageContent | FileContent => {
  if (typeof part === "string") return { type: "text", text: part };
  if (part.type === "text" || part.type === "image_url" || part.type === "file_url") return part;
  throw new Error("Unsupported message content part");
};

const normalizeMessage = (message: Message) => {
  const { role, name, tool_call_id } = message;
  if (role === "tool" || role === "function") {
    const content = ensureArray(message.content).map(part => (typeof part === "string" ? part : JSON.stringify(part))).join("\n");
    return { role, name, tool_call_id, content };
  }
  const contentParts = ensureArray(message.content).map(normalizeContentPart);
  if (contentParts.length === 1 && contentParts[0].type === "text") return { role, name, content: contentParts[0].text };
  return { role, name, content: contentParts };
};

const normalizeToolChoice = (toolChoice: ToolChoice | undefined, tools: Tool[] | undefined): "none" | "auto" | { type: "function"; function: { name: string } } | undefined => {
  if (!toolChoice) return undefined;
  if (toolChoice === "none" || toolChoice === "auto") return toolChoice;
  if (toolChoice === "required") {
    if (!tools || tools.length === 0) throw new Error("tool_choice 'required' was provided but no tools were configured");
    if (tools.length > 1) throw new Error("tool_choice 'required' needs a single tool or specify the tool name explicitly");
    return { type: "function", function: { name: tools[0].function.name } };
  }
  if ("name" in toolChoice) return { type: "function", function: { name: toolChoice.name } };
  return toolChoice;
};

// ─── Retry Logic ────────────────────────────────────────────────────────────
const RETRY_MAX_RETRIES = 4;
const RETRY_BASE_DELAY_MS = 500;
const RETRY_MAX_DELAY_MS = 30_000;

const sleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

const parseRetryAfter = (value: string | null): number | undefined => {
  if (!value) return undefined;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);
  const at = Date.parse(value);
  return Number.isNaN(at) ? undefined : Math.max(0, at - Date.now());
};

const computeBackoffDelay = (attempt: number, retryAfterMs?: number): number => {
  const cap = Math.min(RETRY_BASE_DELAY_MS * 2 ** attempt, RETRY_MAX_DELAY_MS);
  const jittered = cap / 2 + Math.random() * (cap / 2);
  return Math.min(Math.max(jittered, retryAfterMs ?? 0), RETRY_MAX_DELAY_MS);
};

const fetchWithBackoff = async (url: string, init: RequestInit): Promise<Response> => {
  let lastError: unknown;
  for (let attempt = 0; attempt <= RETRY_MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url, init);
      if (response.ok || attempt === RETRY_MAX_RETRIES) return response;
      const retryAfterMs = parseRetryAfter(response.headers.get("retry-after"));
      try { await response.body?.cancel(); } catch {}
      await sleep(computeBackoffDelay(attempt, retryAfterMs));
    } catch (error) {
      lastError = error;
      if (attempt === RETRY_MAX_RETRIES) throw error;
      await sleep(computeBackoffDelay(attempt));
    }
  }
  throw lastError instanceof Error ? lastError : new Error("LLM request failed after exhausting retries");
};

// ─── Streaming Support ──────────────────────────────────────────────────────
export async function invokeLLMStreaming(params: InvokeParams): Promise<InvokeResult> {
  const config = getProvider();
  if (!config.apiKey) throw new Error("AI_API_KEY is not configured");
  if (!config.baseUrl) throw new Error("AI_BASE_URL is not configured");

  const { messages, tools, toolChoice, maxTokens, responseFormat, model, temperature, topP, onChunk } = params;
  const payload: Record<string, unknown> = {
    messages: messages.map(normalizeMessage),
    stream: true,
  };

  const resolvedModel = model || config.defaultModel;
  payload.model = resolvedModel;
  if (tools && tools.length > 0) payload.tools = tools;
  const normalizedToolChoice = normalizeToolChoice(toolChoice, tools);
  if (normalizedToolChoice) payload.tool_choice = normalizedToolChoice;
  if (typeof maxTokens === "number") payload.max_tokens = maxTokens;
  if (typeof temperature === "number") payload.temperature = temperature;
  if (typeof topP === "number") payload.top_p = topP;
  if (responseFormat) payload.response_format = responseFormat;

  const baseUrl = config.baseUrl.replace(/\/$/, "");
  const url = baseUrl.endsWith("/v1") ? `${baseUrl}/chat/completions` : `${baseUrl}/v1/chat/completions`;

  const response = await fetchWithBackoff(url, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${config.apiKey}` },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LLM streaming failed: ${response.status} ${response.statusText} – ${errorText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body for streaming");

  const decoder = new TextDecoder();
  let fullContent = "";
  let toolCalls: ToolCall[] = [];
  let id = "";
  let created = 0;
  let modelUsed = resolvedModel;
  let finishReason: string | null = null;
  let usage = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const text = decoder.decode(value, { stream: true });
    const lines = text.split("\n").filter(line => line.startsWith("data: "));

    for (const line of lines) {
      const data = line.slice(6).trim();
      if (data === "[DONE]") continue;
      try {
        const parsed = JSON.parse(data);
        if (parsed.id) id = parsed.id;
        if (parsed.created) created = parsed.created;
        if (parsed.model) modelUsed = parsed.model;
        if (parsed.choices?.[0]) {
          const choice = parsed.choices[0];
          if (choice.finish_reason) finishReason = choice.finish_reason;
          if (choice.delta?.content) {
            fullContent += choice.delta.content;
            onChunk?.(choice.delta.content);
          }
          if (choice.delta?.tool_calls) {
            for (const tc of choice.delta.tool_calls) {
              if (tc.index !== undefined) {
                if (!toolCalls[tc.index]) toolCalls[tc.index] = { id: tc.id || "", type: "function", function: { name: "", arguments: "" } };
                if (tc.id) toolCalls[tc.index].id = tc.id;
                if (tc.function?.name) toolCalls[tc.index].function.name += tc.function.name;
                if (tc.function?.arguments) toolCalls[tc.index].function.arguments += tc.function.arguments;
              }
            }
          }
        }
        if (parsed.usage) usage = parsed.usage;
      } catch {}
    }
  }

  return {
    id: id || `stream_${Date.now()}`,
    created: created || Math.floor(Date.now() / 1000),
    model: modelUsed,
    choices: [{
      index: 0,
      message: {
        role: "assistant",
        content: fullContent,
        ...(toolCalls.length > 0 ? { tool_calls: toolCalls.filter(Boolean) } : {}),
      },
      finish_reason: finishReason,
    }],
    usage,
  };
}

// ─── Non-Streaming Invoke (with optional streaming callback) ─────────────────
export async function invokeLLM(params: InvokeParams): Promise<InvokeResult> {
  if (params.stream || params.onChunk) return invokeLLMStreaming(params);

  const config = getProvider();
  if (!config.apiKey) throw new Error("AI_API_KEY is not configured");
  if (!config.baseUrl) throw new Error("AI_BASE_URL is not configured");

  const { messages, tools, toolChoice, maxTokens, responseFormat, model, temperature, topP } = params;
  const payload: Record<string, unknown> = { messages: messages.map(normalizeMessage) };

  const resolvedModel = model || config.defaultModel;
  payload.model = resolvedModel;
  if (tools && tools.length > 0) payload.tools = tools;
  const normalizedToolChoice = normalizeToolChoice(toolChoice, tools);
  if (normalizedToolChoice) payload.tool_choice = normalizedToolChoice;
  if (typeof maxTokens === "number") payload.max_tokens = maxTokens;
  if (typeof temperature === "number") payload.temperature = temperature;
  if (typeof topP === "number") payload.top_p = topP;
  if (responseFormat) payload.response_format = responseFormat;

  const baseUrl = config.baseUrl.replace(/\/$/, "");
  const url = baseUrl.endsWith("/v1") ? `${baseUrl}/chat/completions` : `${baseUrl}/v1/chat/completions`;

  const response = await fetchWithBackoff(url, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${config.apiKey}` },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LLM invoke failed: ${response.status} ${response.statusText} – ${errorText}`);
  }

  return (await response.json()) as InvokeResult;
}

// ─── Model Listing ──────────────────────────────────────────────────────────
export async function listLLMModels(): Promise<ModelsResponse> {
  const config = getProvider();
  if (!config.apiKey) throw new Error("AI_API_KEY is not configured");
  if (!config.baseUrl) throw new Error("AI_BASE_URL is not configured");

  const baseUrl = config.baseUrl.replace(/\/$/, "");
  const url = baseUrl.endsWith("/v1") ? `${baseUrl}/models` : `${baseUrl}/v1/models`;

  const response = await fetchWithBackoff(url, {
    headers: { authorization: `Bearer ${config.apiKey}` },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`List LLM models failed: ${response.status} ${response.statusText} – ${errorText}`);
  }

  return (await response.json()) as ModelsResponse;
}

// ─── Model Router (intelligent model selection) ─────────────────────────────
export type ModelCapability = "chat" | "vision" | "function_calling" | "embedding" | "code" | "reasoning";

interface ModelMetadata {
  id: string;
  provider: LLMProvider;
  capabilities: ModelCapability[];
  maxTokens: number;
  costPer1kInput: number;
  costPer1kOutput: number;
  latencyMs: number;
  languageSupport: string[];
}

const MODEL_REGISTRY: ModelMetadata[] = [
  { id: "gpt-4o", provider: "openai", capabilities: ["chat", "vision", "function_calling", "reasoning"], maxTokens: 128000, costPer1kInput: 0.005, costPer1kOutput: 0.015, latencyMs: 2000, languageSupport: ["en", "ar", "it", "fr", "de", "es"] },
  { id: "gpt-4o-mini", provider: "openai", capabilities: ["chat", "function_calling"], maxTokens: 128000, costPer1kInput: 0.00015, costPer1kOutput: 0.0006, latencyMs: 800, languageSupport: ["en", "ar", "it"] },
  { id: "claude-3-5-sonnet-20241022", provider: "anthropic", capabilities: ["chat", "vision", "function_calling", "reasoning", "code"], maxTokens: 200000, costPer1kInput: 0.003, costPer1kOutput: 0.015, latencyMs: 2500, languageSupport: ["en", "ar", "it"] },
  { id: "claude-3-haiku-20240307", provider: "anthropic", capabilities: ["chat", "function_calling"], maxTokens: 200000, costPer1kInput: 0.00025, costPer1kOutput: 0.00125, latencyMs: 600, languageSupport: ["en", "ar", "it"] },
  { id: "gemini-2.0-flash", provider: "google", capabilities: ["chat", "vision", "function_calling", "code"], maxTokens: 1000000, costPer1kInput: 0.000075, costPer1kOutput: 0.0003, latencyMs: 500, languageSupport: ["en", "ar", "it", "fr", "de", "es"] },
  { id: "gemini-1.5-pro", provider: "google", capabilities: ["chat", "vision", "function_calling", "reasoning"], maxTokens: 2000000, costPer1kInput: 0.00125, costPer1kOutput: 0.005, latencyMs: 3000, languageSupport: ["en", "ar", "it"] },
];

export function routeModel(requirements: { capabilities?: ModelCapability[]; language?: string; maxTokens?: number; preferCost?: "low" | "medium" | "high" }): string {
  let candidates = [...MODEL_REGISTRY];

  if (requirements.capabilities) {
    for (const cap of requirements.capabilities) {
      candidates = candidates.filter(m => m.capabilities.includes(cap));
    }
  }

  if (requirements.language) {
    candidates = candidates.filter(m => m.languageSupport.includes(requirements.language!));
  }

  if (requirements.maxTokens) {
    candidates = candidates.filter(m => m.maxTokens >= requirements.maxTokens!);
  }

  if (candidates.length === 0) return ENV.ai.model || "gpt-4o-mini";

  if (requirements.preferCost === "low") candidates.sort((a, b) => a.costPer1kInput - b.costPer1kInput);
  else if (requirements.preferCost === "high") candidates.sort((a, b) => b.costPer1kInput - a.costPer1kInput);
  else candidates.sort((a, b) => a.latencyMs - b.latencyMs);

  return candidates[0].id;
}

export function getModelMetadata(modelId: string): ModelMetadata | undefined {
  return MODEL_REGISTRY.find(m => m.id === modelId);
}
