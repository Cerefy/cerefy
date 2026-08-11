import type { LlmProvider } from './types';
import { GeminiProvider } from './gemini';
import { FallbackRouter, RuleBasedFallbackProvider } from './fallback';

export class ProviderRegistry {
  private providers = new Map<string, LlmProvider>();
  private primaryId = 'gemini';

  register(provider: LlmProvider): void {
    this.providers.set(provider.id, provider);
    if (!this.primaryId && this.providers.size === 1) this.primaryId = provider.id;
  }

  setPrimary(id: string): void {
    if (!this.providers.has(id)) throw new Error(`Provider '${id}' is not registered`);
    this.primaryId = id;
  }

  get(id?: string): LlmProvider | null {
    return this.providers.get(id || this.primaryId) ?? null;
  }

  primary(): LlmProvider {
    this.ensureDefaultConfigured();
    return new FallbackRouter(
      this.providers.get(this.primaryId)!,
      this.providers.get('fallback-rule') ?? new RuleBasedFallbackProvider(),
    );
  }

  private ensureDefaultConfigured(): void {
    if (!this.providers.has(this.primaryId) && process.env.GEMINI_API_KEY) {
      this.register(new GeminiProvider(process.env.GEMINI_API_KEY));
    }
    if (!this.providers.has('fallback-rule')) {
      this.register(new RuleBasedFallbackProvider());
    }
  }
}

export const providerRegistry = new ProviderRegistry();