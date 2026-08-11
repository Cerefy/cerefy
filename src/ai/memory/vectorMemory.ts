import { desc, eq } from 'drizzle-orm';
import { isDatabaseReachable, withTenantContext } from '../../db';
import { decisions, documentChunks, documents } from '../../db/schema';

export interface VectorMemoryContext {
  documentSummary: string;
  chunkSnippets: string[];
  decisionHistory: Array<Record<string, unknown>>;
}

export async function loadVectorMemoryContext(params: {
  tenantId: string;
  documentId?: string;
  limit?: number;
}) : Promise<VectorMemoryContext> {
  const limit = params.limit ?? 5;

  if (!(await isDatabaseReachable())) {
    return { documentSummary: '', chunkSnippets: [], decisionHistory: [] };
  }

  return withTenantContext(params.tenantId, async (tx) => {
    const [documentRow] = params.documentId
      ? await tx.select().from(documents).where(eq(documents.id, params.documentId as any)).limit(1)
      : [];

    const chunks = params.documentId
      ? await tx
          .select()
          .from(documentChunks)
          .where(eq(documentChunks.documentId, params.documentId as any))
          .orderBy(desc(documentChunks.chunkIndex))
          .limit(limit)
      : await tx
          .select()
          .from(documentChunks)
          .where(eq(documentChunks.tenantId, params.tenantId))
          .orderBy(desc(documentChunks.createdAt))
          .limit(limit);

    const history = await tx
      .select()
      .from(decisions)
      .where(eq(decisions.tenantId, params.tenantId))
      .orderBy(desc(decisions.createdAt))
      .limit(limit);

    return {
      documentSummary: documentRow?.title
        ? `${documentRow.title}${documentRow.rawContent ? `: ${String(documentRow.rawContent).slice(0, 800)}` : ''}`
        : '',
      chunkSnippets: chunks.map((chunk) => chunk.content),
      decisionHistory: history.map((decision) => decision as unknown as Record<string, unknown>),
    };
  });
}
