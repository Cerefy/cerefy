// src/enterprise/rag/index.ts
// RAG Pipeline — Document ingestion, embedding, retrieval

export interface Document {
  id: string;
  tenantId: string;
  title: string;
  content: string;
  mimeType: string;
  metadata: Record<string, unknown>;
  status: 'pending' | 'processing' | 'indexed' | 'failed';
  createdAt: Date;
}

export interface Chunk {
  id: string;
  documentId: string;
  content: string;
  embedding?: number[];
  metadata: Record<string, unknown>;
}

export interface RetrievalQuery {
  tenantId: string;
  query: string;
  limit?: number;
}

export interface RetrievalResult {
  chunk: Chunk;
  score: number;
  document: Document;
}

export class RAGPipeline {
  private documents: Map<string, Document> = new Map();
  private chunks: Map<string, Chunk> = new Map();

  async ingest(doc: Omit<Document, 'id' | 'status' | 'createdAt'>): Promise<Document> {
    const document: Document = {
      ...doc,
      id: `doc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      status: 'processing',
      createdAt: new Date(),
    };

    this.documents.set(document.id, document);

    // Chunk the document
    const docChunks = this.chunkDocument(document);
    for (const chunk of docChunks) {
      this.chunks.set(chunk.id, chunk);
    }

    document.status = 'indexed';
    return document;
  }

  private chunkDocument(doc: Document, chunkSize = 500, overlap = 50): Chunk[] {
    const chunks: Chunk[] = [];
    let start = 0;
    let index = 0;

    while (start < doc.content.length) {
      const end = Math.min(start + chunkSize, doc.content.length);
      chunks.push({
        id: `chunk_${doc.id}_${index}`,
        documentId: doc.id,
        content: doc.content.slice(start, end),
        metadata: { ...doc.metadata, chunkIndex: index },
      });
      start = end - overlap;
      index++;
    }

    return chunks;
  }

  async retrieve(query: RetrievalQuery): Promise<RetrievalResult[]> {
    const results: RetrievalResult[] = [];
    const queryLower = query.query.toLowerCase();

    for (const chunk of this.chunks.values()) {
      const doc = this.documents.get(chunk.documentId);
      if (!doc || doc.tenantId !== query.tenantId) continue;

      const score = this.calculateSimilarity(chunk.content, queryLower);
      if (score > 0.1) {
        results.push({ chunk, score, document: doc });
      }
    }

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, query.limit || 5);
  }

  private calculateSimilarity(content: string, query: string): number {
    const contentLower = content.toLowerCase();
    const queryWords = query.split(' ').filter(w => w.length > 2);
    let matches = 0;
    for (const word of queryWords) {
      if (contentLower.includes(word)) matches++;
    }
    return queryWords.length > 0 ? matches / queryWords.length : 0;
  }

  async listDocuments(tenantId: string): Promise<Document[]> {
    return Array.from(this.documents.values()).filter(d => d.tenantId === tenantId);
  }
}

export const ragPipeline = new RAGPipeline();
