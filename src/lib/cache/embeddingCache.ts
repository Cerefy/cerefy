export interface EmbeddingCacheEntry {
  key: string;
  embedding: number[];
  createdAt: string;
  lastHitAt: string;
  lastHitSeq: number;
}

export interface EmbeddingCacheOptions {
  maxEntries?: number;
  ttlMs?: number;
}

/**
 * §6.2 — embedding cache for repeated/similar retrieval queries. Invalidation
 * is event-based, never solely time-based: `invalidateForDocument` fires on a
 * document re-ingest / workflow update, dropping any cached vector that was
 * derived from that document's content so staleness can never masquerade as a
 * fresh retrieval (§6.2 last bullet, §3.2 anti-fabrication rule).
 */
export class EmbeddingCache {
  private entries = new Map<string, EmbeddingCacheEntry>();
  private readonly maxEntries: number;
  private readonly ttlMs: number;
  private readonly derivedFrom = new Map<string, Set<string>>();
  private seq = 0;

  constructor(options?: EmbeddingCacheOptions) {
    this.maxEntries = options?.maxEntries ?? 10_000;
    this.ttlMs = options?.ttlMs ?? 24 * 60 * 60 * 1000;
  }

  get(query: string): number[] | null {
    const now = Date.now();
    const entry = this.entries.get(query);
    if (!entry) return null;
    if (now - new Date(entry.createdAt).getTime() > this.ttlMs) {
      this.entries.delete(query);
      return null;
    }
    entry.lastHitAt = new Date(now).toISOString();
    entry.lastHitSeq = ++this.seq;
    return entry.embedding;
  }

  set(query: string, embedding: number[], sourceDocuments?: string[]): void {
    if (this.entries.has(query)) this.entries.delete(query);
    if (this.entries.size >= this.maxEntries) {
      const oldest = [...this.entries.values()].sort((a, b) => a.lastHitSeq - b.lastHitSeq)[0];
      if (oldest) this.entries.delete(oldest.key);
    }
    this.entries.set(query, {
      key: query,
      embedding,
      createdAt: new Date().toISOString(),
      lastHitAt: new Date().toISOString(),
      lastHitSeq: ++this.seq,
    });
    for (const docId of sourceDocuments ?? []) {
      if (!this.derivedFrom.has(docId)) this.derivedFrom.set(docId, new Set());
      this.derivedFrom.get(docId)!.add(query);
    }
  }

  /** Event-based invalidation: drop every cached query derived from a changed document. */
  invalidateForDocument(documentId: string): void {
    const affected = this.derivedFrom.get(documentId);
    if (!affected) return;
    for (const query of affected) {
      this.entries.delete(query);
    }
    this.derivedFrom.delete(documentId);
  }

  invalidateAll(): void {
    this.entries.clear();
    this.derivedFrom.clear();
  }

  size(): number {
    return this.entries.size;
  }

  has(query: string): boolean {
    return this.entries.has(query);
  }
}