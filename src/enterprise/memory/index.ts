// src/enterprise/memory/index.ts
// Enterprise Memory Engine — Vector store, semantic search, memory management

export interface MemoryItem {
  id: string;
  tenantId: string;
  userId?: string;
  type: 'conversation' | 'document' | 'fact' | 'decision';
  content: string;
  embedding?: number[];
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface SearchQuery {
  tenantId: string;
  query: string;
  limit?: number;
  filters?: Record<string, unknown>;
}

export interface SearchResult {
  item: MemoryItem;
  score: number;
}

export class EnterpriseMemoryEngine {
  private memories: Map<string, MemoryItem> = new Map();

  async store(item: Omit<MemoryItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<MemoryItem> {
    const memory: MemoryItem = {
      ...item,
      id: `mem_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.memories.set(memory.id, memory);
    return memory;
  }

  async search(query: SearchQuery): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
    const queryLower = query.query.toLowerCase();

    for (const memory of this.memories.values()) {
      if (memory.tenantId !== query.tenantId) continue;

      // Simple text matching (in production, use vector similarity)
      const score = this.calculateRelevance(memory.content, queryLower);
      if (score > 0.1) {
        results.push({ item: memory, score });
      }
    }

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, query.limit || 10);
  }

  private calculateRelevance(content: string, query: string): number {
    const contentLower = content.toLowerCase();
    const queryWords = query.split(' ').filter(w => w.length > 2);

    let matches = 0;
    for (const word of queryWords) {
      if (contentLower.includes(word)) matches++;
    }

    return queryWords.length > 0 ? matches / queryWords.length : 0;
  }

  async get(id: string): Promise<MemoryItem | undefined> {
    return this.memories.get(id);
  }

  async delete(id: string): Promise<boolean> {
    return this.memories.delete(id);
  }

  async list(tenantId: string, limit = 100): Promise<MemoryItem[]> {
    return Array.from(this.memories.values())
      .filter(m => m.tenantId === tenantId)
      .slice(-limit);
  }
}

export const memoryEngine = new EnterpriseMemoryEngine();
