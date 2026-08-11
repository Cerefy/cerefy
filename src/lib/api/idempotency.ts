interface IdempotencyEntry<T> {
  storedAt: number;
  result: T;
}

export interface IdempotencyStore {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlMs: number): Promise<void>;
  delete(key: string): Promise<void>;
}

export interface MemoryIdempotencyStoreEntry {
  storedAt: number;
  value: unknown;
}

export class MemoryIdempotencyStore implements IdempotencyStore {
  private map = new Map<string, MemoryIdempotencyStoreEntry>();

  async get<T>(key: string): Promise<T | null> {
    const entry = this.map.get(key);
    if (!entry) return null;
    return entry.value as T;
  }

  async set<T>(key: string, value: T): Promise<void> {
    this.map.set(key, { storedAt: Date.now(), value });
  }

  async delete(key: string): Promise<void> {
    this.map.delete(key);
  }

  sweep(ttlMs: number): number {
    const now = Date.now();
    let removed = 0;
    for (const [key, entry] of this.map.entries()) {
      if (now - entry.storedAt > ttlMs) {
        this.map.delete(key);
        removed++;
      }
    }
    return removed;
  }

  size(): number {
    return this.map.size;
  }
}

export class IdempotencyService {
  constructor(
    readonly store: IdempotencyStore = new MemoryIdempotencyStore(),
    private readonly ttlMs = 24 * 60 * 60 * 1000,
  ) {}

  async execute<T>(key: string, producer: () => Promise<T> | T): Promise<{ result: T; replay: boolean }> {
    if (!key) throw new Error('An Idempotency-Key is required for this operation');
    const hit = await this.store.get<T>(key);
    if (hit !== null && hit !== undefined) {
      return { result: hit, replay: true };
    }
    const result = await producer();
    await this.store.set(key, result, this.ttlMs);
    return { result, replay: false };
  }
}

export function extractIdempotencyKey(
  req: { headers: Record<string, unknown> | undefined },
): string | null {
  const headers = req.headers || {};
  const raw = headers['idempotency-key'] ?? headers['Idempotency-Key'];
  if (typeof raw === 'string' && raw.trim().length > 0) return raw.trim();
  return null;
}

function isHeadersRecord(value: unknown): value is Record<string, string | string[] | undefined> {
  return typeof value === 'object' && value !== null;
}

export { isHeadersRecord };