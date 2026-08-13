import type { LlmCompletionRequest, LlmCompletionResult, LlmEmbedRequest, LlmEmbedResult, LlmProvider } from './types';
import { estimateCompletionCost } from './types';

interface GeminiApiResponse {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
}

export class GeminiProvider implements LlmProvider {
  readonly id = 'gemini';

  constructor(
    private readonly apiKey: string,
    private readonly defaultModelId = 'gemini-3.6-flash',
  ) {}

  private async call(modelId: string, body: Record<string, unknown>): Promise<GeminiApiResponse> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${this.apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'cerefy-enterprise/1.0' },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw new Error(`Gemini API error ${response.status}: ${await response.text()}`);
    }
    return (await response.json()) as GeminiApiResponse;
  }

  async complete(req: LlmCompletionRequest): Promise<LlmCompletionResult> {
    const modelId = req.modelId || this.defaultModelId;
    const systemMessages = req.messages.filter((m) => m.role === 'system');
    const contents = req.messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));
    const payload = {
      ...(systemMessages.length > 0 ? { systemInstruction: { parts: systemMessages.map((m) => ({ text: m.content })) } } : {}),
      contents,
      generationConfig: {
        temperature: req.temperature ?? 0.7,
        maxOutputTokens: req.maxTokens ?? 4096,
      },
    };
    const raw = await this.call(modelId, payload);
    const text = raw.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const tokensInput = raw.usageMetadata?.promptTokenCount ?? 0;
    const tokensOutput = raw.usageMetadata?.candidatesTokenCount ?? 0;
    return {
      text,
      modelId,
      tokensInput,
      tokensOutput,
      costUsd: estimateCompletionCost(modelId, tokensInput, tokensOutput),
    };
  }

  async embed(req: LlmEmbedRequest): Promise<LlmEmbedResult> {
    const modelId = req.modelId || 'text-embedding-004';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:embedContent?key=${this.apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'cerefy-enterprise/1.0' },
      body: JSON.stringify({ model: `models/${modelId}`, content: { parts: [{ text: req.input }] } }),
    });
    if (!response.ok) {
      throw new Error(`Gemini embed error ${response.status}: ${await response.text()}`);
    }
    const raw = (await response.json()) as { embedding?: { values?: number[] }; usageMetadata?: { promptTokenCount?: number } };
    return {
      embedding: raw.embedding?.values ?? [],
      modelId,
      tokensInput: raw.usageMetadata?.promptTokenCount ?? 0,
      costUsd: 0,
    };
  }
}