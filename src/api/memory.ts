// src/api/memory.ts
// Enterprise Memory API service for vector search, knowledge graph, and RAG

import api from './axios';

export interface MemoryQueryRequest {
  query: string;
  type?: 'vector' | 'graph' | 'hybrid';
  limit?: number;
  filters?: Record<string, unknown>;
}

export interface MemoryResult {
  id: string;
  content: string;
  source: string;
  score: number;
  type: 'vector' | 'graph' | 'relational';
  metadata: Record<string, unknown>;
}

export interface IngestRequest {
  title: string;
  content: string;
  mimeType?: string;
  chunkSize?: number;
  chunkOverlap?: number;
}

export interface IngestResponse {
  status: string;
  title: string;
  documentId: string;
  chunkCount: number;
}

export const memoryApi = {
  async query(data: MemoryQueryRequest): Promise<MemoryResult[]> {
    const response = await api.post<{ data: MemoryResult[] }>('/api/v1/ai/memory/query', data);
    return response.data.data;
  },

  async ingest(data: IngestRequest): Promise<IngestResponse> {
    const response = await api.post<IngestResponse>('/api/v1/ingestion/chunk', data);
    return response.data;
  },

  async getDocuments(): Promise<unknown[]> {
    const response = await api.get('/api/v1/memory/documents');
    return response.data.data;
  },

  async getKnowledgeGraph(query?: string) {
    const response = await api.post('/api/v1/graph/cypher', {
      cypher: query || 'MATCH (e:Entity) RETURN e LIMIT 50',
    });
    return response.data;
  },
};
