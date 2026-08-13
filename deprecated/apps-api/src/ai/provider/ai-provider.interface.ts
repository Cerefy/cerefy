export interface LLMRequestOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  jsonMode?: boolean;
}

export interface LLMResponse {
  text: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  provider: string;
  model: string;
  latencyMs: number;
}

export interface IAIProvider {
  name: string;
  generateText(prompt: string, options?: LLMRequestOptions): Promise<LLMResponse>;
  generateStructuredJSON<T>(prompt: string, schemaDescription: string, options?: LLMRequestOptions): Promise<{ data: T; usage: LLMResponse['usage']; latencyMs: number }>;
}
