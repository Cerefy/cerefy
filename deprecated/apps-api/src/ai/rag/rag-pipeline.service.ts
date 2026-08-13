import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../../packages/database/src/prisma.service';
import { VectorStoreService } from '../memory/vector-store.service';
import { KnowledgeGraphService } from '../memory/knowledge-graph.service';
import { AIProviderService } from '../provider/ai-provider.service';
import { EntityType } from '@prisma/client';

export interface ProcessDocumentOptions {
  documentId: string;
  rawText: string;
}

@Injectable()
export class RAGPipelineService {
  private readonly logger = new Logger(RAGPipelineService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly vectorStore: VectorStoreService,
    private readonly knowledgeGraph: KnowledgeGraphService,
    private readonly aiProvider: AIProviderService,
  ) {}

  async processDocument(options: ProcessDocumentOptions) {
    this.logger.log(`Starting RAG ingestion pipeline for Document: ${options.documentId}`);

    // 1. Chunking text into ~500 char blocks
    const chunkSize = 500;
    const text = options.rawText;
    const chunks: string[] = [];
    for (let i = 0; i < text.length; i += chunkSize) {
      chunks.push(text.substring(i, i + chunkSize));
    }

    // 2. Save DocumentChunks in Prisma & Index in Vector Store
    let indexedCount = 0;
    for (const chunkContent of chunks) {
      const dbChunk = await this.prisma.documentChunk.create({
        data: {
          documentId: options.documentId,
          content: chunkContent,
        },
      });

      await this.vectorStore.indexChunk(dbChunk.id, chunkContent);
      indexedCount++;
    }

    // 3. Extract Knowledge Graph Entities using AI Provider
    const extractionPrompt = `Extract key enterprise entities (Systems, Stakeholders, Business Rules, Compliance Requirements) from this text:\n\n${text.substring(0, 2000)}`;
    const schemaDescription = `{
      "entities": [
        { "type": "USER | SYSTEM | REQUIREMENT | DOCUMENT", "name": "string", "description": "string" }
      ]
    }`;

    try {
      const { data } = await this.aiProvider.generateStructuredJSON<any>(
        extractionPrompt,
        schemaDescription,
      );

      if (Array.isArray(data?.entities)) {
        for (const ent of data.entities) {
          const entityTypeEnum = (ent.type in EntityType) ? (ent.type as EntityType) : EntityType.REQUIREMENT;
          await this.knowledgeGraph.createNode({
            entityType: entityTypeEnum,
            content: `${ent.name}: ${ent.description}`,
            metadata: { sourceDocumentId: options.documentId },
          });
        }
      }
    } catch (e: any) {
      this.logger.warn(`Entity extraction fallback: ${e.message}`);
    }

    return {
      success: true,
      documentId: options.documentId,
      chunksCreated: indexedCount,
      indexedInVectorStore: true,
    };
  }
}
