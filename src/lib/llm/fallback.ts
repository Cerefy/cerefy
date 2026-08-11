import type { LlmCompletionRequest, LlmCompletionResult, LlmEmbedRequest, LlmEmbedResult, LlmProvider } from './types';

function estimateTokens(text: string): number {
  return Math.max(1, Math.round(text.length / 4));
}

export class RuleBasedFallbackProvider implements LlmProvider {
  readonly id = 'fallback-rule';

  async complete(req: LlmCompletionRequest): Promise<LlmCompletionResult> {
    const lastUser = [...req.messages].reverse().find((m) => m.role === 'user');
    const input = lastUser?.content ?? '';
    const text = truncate(input, req.maxTokens ?? 200);
    return {
      text: `AI temporarily limited — provider unavailable. Query echoed for review: ${text}`,
      modelId: 'fallback-rule',
      tokensInput: estimateTokens(req.messages.map((m) => m.content).join(' ')),
      tokensOutput: estimateTokens(text),
      costUsd: 0,
    };
  }

  async embed(req: LlmEmbedRequest): Promise<LlmEmbedResult> {
    return { embedding: [], modelId: 'fallback-rule', tokensInput: estimateTokens(req.input), costUsd: 0 };
  }
}

const truncate = (s: string, len: number): string => (s.length > len ? s.slice(0, len) : s);

export class FallbackRouter implements LlmProvider {
  readonly id = 'fallback-router';

  constructor(private readonly primary: LlmProvider, private readonly fallback: LlmProvider) {}

  async complete(req: LlmCompletionRequest): Promise<LlmCompletionResult> {
    try {
      return await this.primary.complete(req);
    } catch {
      return this.fallback.complete(req);
    }
  }

  async embed(req: LlmEmbedRequest): Promise<LlmEmbedResult> {
    try {
      return await this.primary.embed(req);
    } catch {
      return this.fallback.embed(req);
    }
  }
}