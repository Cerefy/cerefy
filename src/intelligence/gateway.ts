// src/intelligence/gateway.ts
// Model-agnostic AI gateway for Arabic Intelligence.
//
// This layer sits ABOVE the model provider and is provider-agnostic. It
// composes Arabic-aware context into prompts and routes requests to whichever
// provider is registered (Gemini, OpenAI, Anthropic, OpenRouter, local, future
// Arabic-native). No provider is hard-coded here. Adapters are registered by
// the app shell so Cerefy remains vendor-independent.

import { ComposedContext } from './context';

export type ProviderId =
  | 'gemini'
  | 'openai'
  | 'anthropic'
  | 'openrouter'
  | 'local'
  | 'custom'
  | 'none';

export interface ProviderAdapter {
  id: ProviderId;
  available(): boolean;
  complete(payload: AIPayload): Promise<AIResult>;
}

export interface AIPayload {
  context: ComposedContext;
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

export interface AIResult {
  success: boolean;
  content?: string;
  error?: string;
  provider: ProviderId;
  model: string;
}

const adapters = new Map<ProviderId, ProviderAdapter>();

export function registerProvider(adapter: ProviderAdapter): void {
  adapters.set(adapter.id, adapter);
}

export function getProvider(id: ProviderId): ProviderAdapter | undefined {
  return adapters.get(id);
}

export function listProviders(): ProviderId[] {
  return Array.from(adapters.keys());
}

export function pickDefaultProvider(): ProviderAdapter | undefined {
  for (const adapter of adapters.values()) {
    try {
      if (adapter.available()) return adapter;
    } catch {
      // ignore unavailable adapter
    }
  }
  return undefined;
}

// Build the Arabic-aware system prompt from a composed context.
export function buildArabicSystemPrompt(context: ComposedContext): string {
  const lines: string[] = [];
  lines.push('You are the Arabic Intelligence assistant within the Cerefy enterprise platform.');
  lines.push(
    `Language: ${context.detectedLanguage?.language || 'unknown'} | Dialect target: ${
      context.dialect || 'msa'
    } | Code-switching: ${context.detectedLanguage?.isCodeSwitched ? 'yes' : 'no'}`,
  );
  lines.push('Model-agnostic instruction: answer in the user language; Arabic answers in Modern Standard Arabic unless a dialect is requested.');

  if (context.organization && context.organization.tenantId) {
    lines.push(
      `Organization: ${context.organization.tenantId} | industry: ${context.organization.industryId || 'unset'} | market: ${
        context.organization.marketId || 'unset'
      } | language: ${context.organization.language || 'en'} | dialect: ${context.organization.dialect || 'msa'}`,
    );
  }
  if (context.market) {
    lines.push(
      `Market: ${context.market.country} (${context.market.id}) currency ${context.market.currency.code} | residency ${context.market.dataResidency} | regulators ${context.market.regulatorySources.join(', ') || 'unlisted'}`,
    );
  }
  if (context.industry) {
    lines.push(`Industry terminology: ${context.industry.terminology.join(', ') || 'general business'}`);
  }
  lines.push(
    'Safety: do not invent regulatory/legal claims. If the answer depends on law/regulation, state that authoritative sources are required and give reasoning only.',
  );
  return lines.join('\n');
}

// High-level completion helper: builds the Arabic prompt and calls the
// registered/default provider. Returns a structured result, never fabricated.
export async function generateArabicResponse(input: {
  context: ComposedContext;
  userMessage: string;
  provider?: ProviderId;
  model?: string;
  temperature?: number;
}): Promise<AIResult> {
  const adapter = input.provider ? getProvider(input.provider) : pickDefaultProvider();
  if (!adapter) {
    return {
      success: false,
      error: 'No AI provider registered. Configure ENABLE_AI_PROVIDER / adapters in the app shell.',
      provider: 'none',
      latencyMs: 0,
    } as AIResult & { latencyMs: number };
  }
  const system = buildArabicSystemPrompt(input.context);
  const payload: AIPayload = {
    context: input.context,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: input.userMessage },
    ],
    temperature: input.temperature ?? 0.4,
    model: input.model,
  };
  return adapter.complete(payload);
}