import type { LlmProvider } from '../llm/types';

export type ChaosEffect = 'retrieve_degraded' | 'llm_latency' | 'llm_error' | 'provider_outage' | 'none';

export interface ChaosConfig {
  enabled: boolean;
  effect: ChaosEffect;
  /** Failure rate for probabilistic effects (0-1). */
  faultRate?: number;
  /** Extra latency (ms) applied to every stage call. */
  latencyMs?: number;
  verbose?: boolean;
}

export const DEFAULT_CHAOS_CONFIG: ChaosConfig = {
  enabled: false,
  effect: 'none',
  faultRate: 1,
  latencyMs: 0,
  verbose: false,
};

export interface StageResult {
  stage: string;
  degraded: boolean;
  degradedReason?: string;
  latencyMs: number;
}

export interface ChaosReport {
  injected: ChaosEffect;
  degradedStages: StageResult[];
  honest: boolean;
  /** true when the pipeline surfaced the degradation clearly instead of a fake success. */
  surfaced: boolean;
}

export function applyChaos<T>(effect: ChaosEffect, value: T): T | undefined {
  switch (effect) {
    case 'llm_error':
    case 'provider_outage':
      return undefined;
    case 'retrieve_degraded':
      return value; // dealt with by caller via degraded flag
    default:
      return value;
  }
}

/**
 * §11.6 — chaos engineering targeted at the AI pipeline. Injecting a degraded
 * Retrieve stage or an LLM latency/error spike must produce an HONEST result:
 * the pipeline reports a partial/degraded answer with a clear marker, never a
 * silently stale or fabricated-looking one. Returns a report the harness can
 * assert against to keep the anti-fabrication rule (§0 of AGENTS.md) verifiable
 * under failure.
 */
export class AiPipelineChaos {
  private config: ChaosConfig;

  constructor(config?: Partial<ChaosConfig>) {
    this.config = { ...DEFAULT_CHAOS_CONFIG, ...config };
  }

  inEffect(): boolean {
    return this.config.enabled && this.config.effect !== 'none';
  }

  /** Wrap a provider call with the configured latency/error chaos. */
  async withProviderChaos<T>(provider: LlmProvider, op: () => Promise<T>): Promise<T> {
    if (!this.inEffect()) return op();
    const { effect, latencyMs, faultRate } = this.config;
    const shouldFault = faultRate == null || Math.random() < faultRate;
    if ((effect === 'llm_latency' || effect === 'llm_error' || effect === 'provider_outage') && latencyMs) {
      await new Promise((r) => setTimeout(r, latencyMs));
    }
    if ((effect === 'llm_error' || effect === 'provider_outage') && shouldFault) {
      const message =
        effect === 'provider_outage'
          ? `chaos: ${provider.id} unavailable (provider outage injected)`
          : `chaos: ${provider.id} returned error (latency/error injected)`;
      const err = new Error(message) as Error & { code?: string };
      err.code = 'AI_TEMPORARILY_LIMITED';
      throw err;
    }
    return op();
  }

  /** Mark a retrieve stage as degraded (partial retrieval, clearly flagged). */
  degradeRetrieve(records: unknown[]): { records: unknown[]; degraded: boolean; reason: string } {
    if (!this.inEffect() || this.config.effect !== 'retrieve_degraded') {
      return { records, degraded: false, reason: '' };
    }
    const { faultRate = 1 } = this.config;
    return Math.random() < faultRate
      ? {
          records: records.slice(0, Math.max(0, Math.floor(records.length / 2))),
          degraded: true,
          reason: 'retrieve stage degraded by chaos harness: partial retrieval, subset of sources returned',
        }
      : { records, degraded: false, reason: '' };
  }
}

export const aiPipelineChaos = new AiPipelineChaos();