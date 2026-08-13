export interface LlmMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LlmCompletionRequest {
  modelId: string;
  messages: LlmMessage[];
  temperature?: number;
  maxTokens?: number;
}

export interface LlmCompletionResult {
  text: string;
  modelId: string;
  promptVersion?: string;
  tokensInput: number;
  tokensOutput: number;
  costUsd: number;
}

export interface LlmEmbedRequest {
  modelId: string;
  input: string;
}

export interface LlmEmbedResult {
  embedding: number[];
  modelId: string;
  tokensInput: number;
  costUsd: number;
}

export interface LlmProvider {
  readonly id: string;
  complete(req: LlmCompletionRequest): Promise<LlmCompletionResult>;
  embed(req: LlmEmbedRequest): Promise<LlmEmbedResult>;
}

export const PRICING = {
  'gemini-3.6-flash': { inputPerM: 0.3, outputPerM: 1.5 },
  'fallback-rule': { inputPerM: 0, outputPerM: 0 },
} as const;

export function estimateCompletionCost(modelId: string, input: number, output: number): number {
  const price = PRICING[modelId as keyof typeof PRICING] ?? PRICING['gemini-3.6-flash'];
  return (input / 1_000_000) * price.inputPerM + (output / 1_000_000) * price.outputPerM;
}