import { Injectable } from '@nestjs/common';
import { VectorStoreService, VectorSearchResult } from './vector-store.service';
import { KnowledgeGraphService } from './knowledge-graph.service';

export interface MemoryContext {
  vectorResults: VectorSearchResult[];
  graphNodes: any[];
  combinedPromptContext: string;
}

@Injectable()
export class EnterpriseMemoryService {
  constructor(
    private readonly vectorStore: VectorStoreService,
    private readonly knowledgeGraph: KnowledgeGraphService,
  ) {}

  async buildContext(query: string, projectId?: string): Promise<MemoryContext> {
    const [vectorResults, graphNodes] = await Promise.all([
      this.vectorStore.search(query, 5),
      this.knowledgeGraph.searchGraph(query),
    ]);

    const docContext = vectorResults
      .map((r, i) => `[Doc Chunk #${i + 1}] (Score: ${(r.score * 100).toFixed(1)}%)\n${r.content}`)
      .join('\n\n');

    const graphContext = graphNodes
      .map((g, i) => `[Graph Entity #${i + 1}] Type: ${g.entityType} | ${g.content}`)
      .join('\n');

    const combinedPromptContext = `=== ENTERPRISE RETRIEVED CONTEXT ===\n\nDOCUMENT RELEVANT CHUNKS:\n${docContext || 'No matching document chunks found.'}\n\nKNOWLEDGE GRAPH ENTITIES:\n${graphContext || 'No matching graph nodes found.'}\n====================================`;

    return {
      vectorResults,
      graphNodes,
      combinedPromptContext,
    };
  }
}
