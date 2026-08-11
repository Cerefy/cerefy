export interface MetricCounter {
  name: string;
  tags: Record<string, string>;
  value: number;
}

export interface MetricHistogram {
  name: string;
  tags: Record<string, string>;
  values: number[];
}

export class MetricsRegistry {
  private counters = new Map<string, MetricCounter>();
  private histograms = new Map<string, MetricHistogram>();

  private key(name: string, tags?: Record<string, string>): string {
    return tags && Object.keys(tags).length > 0 ? `${name}\u0000${JSON.stringify(tags)}` : name;
  }

  incr(name: string, tags?: Record<string, string>, by = 1): void {
    const key = this.key(name, tags);
    const existing = this.counters.get(key);
    if (existing) {
      existing.value += by;
    } else {
      this.counters.set(key, { name, tags: tags ?? {}, value: by });
    }
  }

  observe(name: string, value: number, tags?: Record<string, string>): void {
    const key = this.key(name, tags);
    const existing = this.histograms.get(key);
    if (existing) {
      existing.values.push(value);
    } else {
      this.histograms.set(key, { name, tags: tags ?? {}, values: [value] });
    }
  }

  counter(name: string, tags?: Record<string, string>): number {
    return this.counters.get(this.key(name, tags))?.value ?? 0;
  }

  histogram(name: string, tags?: Record<string, string>): number[] {
    return [...(this.histograms.get(this.key(name, tags))?.values ?? [])];
  }

  snapshot(): { counters: MetricCounter[]; histograms: MetricHistogram[] } {
    const counters = Array.from(this.counters.values()).map((c) => ({ ...c, tags: { ...c.tags } }));
    const histograms = Array.from(this.histograms.values()).map((h) => ({ ...h, tags: { ...h.tags }, values: [...h.values] }));
    return { counters, histograms };
  }

  reset(): void {
    this.counters.clear();
    this.histograms.clear();
  }
}

export const registry = new MetricsRegistry();

export const Metrics = {
  httpRequestsTotal: 'http_requests_total',
  httpErrorsTotal: 'http_errors_total',
  httpDurationSeconds: 'http_request_duration_seconds',
  aiTokensPerQuery: 'ai_tokens_per_query',
  aiConfidence: 'ai_confidence',
  aiHumanOverrideRate: 'ai_human_override_rate',
  aiOutcomeLinkedConfirmed: 'ai_outcome_linked_confirmed',
  aiOutcomeLinkedUnconfirmed: 'ai_outcome_linked_unconfirmed',
} as const;

export function resetRegistry(): void {
  registry.reset();
}