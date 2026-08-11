export interface Span {
  name: string;
  startAt: number;
  endAt: number | null;
  labels?: Record<string, unknown>;
  parent?: Span;
}

export class Tracer {
  private spans: Span[] = [];
  private stack: Span[] = [];

  start(name: string, labels?: Record<string, unknown>): Span {
    const parent = this.stack[this.stack.length - 1];
    const span: Span = { name, startAt: Date.now(), endAt: null, labels, parent };
    this.stack.push(span);
    this.spans.push(span);
    return span;
  }

  end(span: Span): void {
    span.endAt = Date.now();
    const idx = this.stack.lastIndexOf(span);
    if (idx !== -1) this.stack.splice(idx, 1);
  }

  durationMs(span: Span): number {
    return (span.endAt ?? span.startAt) - span.startAt;
  }

  async withSpan<T>(name: string, fn: () => Promise<T>, labels?: Record<string, unknown>): Promise<T> {
    const span = this.start(name, labels);
    try {
      return await fn();
    } finally {
      this.end(span);
    }
  }

  snapshot(): Span[] {
    return this.spans;
  }

  reset(): void {
    this.spans = [];
    this.stack = [];
  }
}

export const tracer = new Tracer();

const isDisabled = process.env.OTEL_DISABLED === 'true';

export function trace<P extends unknown[], R>(name: string, fn: (...args: P) => R): (...args: P) => R {
  return (...args: P) => {
    if (isDisabled) return fn(...args);
    const span = tracer.start(name);
    try {
      const out = fn(...args);
      if (out instanceof Promise) {
        return out.finally(() => tracer.end(span)) as R;
      }
      tracer.end(span);
      return out;
    } catch (err) {
      tracer.end(span);
      throw err;
    }
  };
}

export function resetTracer(): void {
  tracer.reset();
}