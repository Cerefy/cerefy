import { and, eq, isNull, sql, desc } from "drizzle-orm";
import { documents, documentChunks, dataSources, dataRecords } from "../../drizzle/schema";
import { requireDb } from "../db";
import { ENV } from "./env";

// ─── Embedding Configuration ────────────────────────────────────────────────
const AI_BASE_URL = ENV.ai.baseUrl ?? "https://api.openai.com/v1";
const AI_API_KEY = ENV.ai.apiKey ?? "";
const EMBEDDING_MODEL = "text-embedding-3-small"; // 1536 dims
const EMBEDDING_DIMENSIONS = 1536;

// ─── Types ──────────────────────────────────────────────────────────────────
export interface RetrievalResult {
  chunkId: number;
  documentId: number;
  documentName: string;
  content: string;
  score: number;
  metadata?: Record<string, unknown>;
}

export interface SearchOptions {
  limit?: number;
  minScore?: number;
  includeMetadata?: boolean;
  language?: string;
  documentIds?: number[];
  data_source_ids?: number[];
}

// ─── Embedding Generation & Storage ─────────────────────────────────────────
export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch(`${AI_BASE_URL}/embeddings`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${AI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: EMBEDDING_MODEL, input: text.slice(0, 8000) }),
  });
  if (!response.ok) throw new Error(`Embedding API error: ${response.status}`);
  const data = await response.json();
  if (!data?.data?.[0]?.embedding || !Array.isArray(data.data[0].embedding)) {
    throw new Error("Embedding API returned invalid payload");
  }
  if (data.data[0].embedding.length !== EMBEDDING_DIMENSIONS) {
    throw new Error(`Embedding dimension mismatch: expected ${EMBEDDING_DIMENSIONS}, got ${data.data[0].embedding.length}`);
  }
  return data.data[0].embedding as number[];
}

export async function storeEmbedding(
  workspaceId: number,
  sourceType: "document_chunk" | "data_record" | "faq",
  sourceId: number,
  content: string,
  knowledgeBaseId?: number
): Promise<void> {
  if (!AI_API_KEY) return; // graceful no-op when embeddings are disabled
  if (!content || !content.trim()) return;
  try {
    const db = await requireDb();
    const embedding = await generateEmbedding(content);
    // Format embedding as PostgreSQL array string for vector type
    const embeddingStr = `[${embedding.join(",")}]`;
    await db.execute(sql`
      INSERT INTO embeddings (workspace_id, knowledge_base_id, source_type, source_id, content, embedding, metadata, created_at)
      VALUES (${workspaceId}, ${knowledgeBaseId ?? null}, ${sourceType}, ${sourceId}, ${content}, ${embeddingStr}::vector, '{}'::jsonb, NOW())
      ON CONFLICT DO NOTHING
    `);
  } catch (error) {
    console.error("[storeEmbedding] failed:", error);
    // graceful fallback - never crash ingestion pipeline
  }
}

// ─── Arabic Intelligence Layer ──────────────────────────────────────────────
const ARABIC_DIALECT_PATTERNS: Record<string, RegExp[]> = {
  msa: [/.fillRect/, /التي/, /الذي/, /يجب/, /يمكن/],
  egyptian: [/عايز/, /ايه/, /ازاي/, /هن/, /يلا/, /تمام/],
  gulf: [/وش/, /كيف/, /وين/, /ليش/, /هلا/, /زين/],
  levantine: [/هيك/, /ليش/, /ktir/, /cad/, /honi/],
  arabizi: [/3an/, /7aga/, /kifaya/, /mumkin/, /yalla/],
};

export function detectArabicDialect(text: string): string {
  for (const [dialect, patterns] of Object.entries(ARABIC_DIALECT_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(text)) return dialect;
    }
  }
  return "msa";
}

export function normalizeArabicText(text: string): string {
  return text
    .replace(/[\u0610-\u061A]/g, "") // diacritics
    .replace(/[\u0640]/g, "") // tatweel
    .replace(/[\u0622]/g, "\u0627") // alef mad -> alef
    .replace(/[\u0623]/g, "\u0627") // alef hamza -> alef
    .replace(/[\u0625]/g, "\u0627") // alef hamza below -> alef
    .replace(/[\u0649]/g, "\u064A") // alef maqsura -> ya
    .replace(/\s+/g, " ")
    .trim();
}

export function transliterateArabizi(text: string): string {
  const map: Record<string, string> = {
    "3": "\u0639", "7": "\u062D", "5": "\u062E", "8": "\u063A",
    "2": "\u0621", "6": "\u0637", "9": "\u0642", "4": "\u0630",
    "kh": "\u062E", "sh": "\u0634", "th": "\u062B", "dh": "\u0630",
  };
  let result = text;
  for (const [key, value] of Object.entries(map)) {
    result = result.replace(new RegExp(key, "g"), value);
  }
  return result;
}

// ─── Text Similarity (BM25-like) ───────────────────────────────────────────
function tokenize(text: string): string[] {
  const normalized = normalizeArabicText(text.toLowerCase());
  return normalized.split(/\s+/).filter(t => t.length > 1);
}

function computeTF(tokens: string[], term: string): number {
  return tokens.filter(t => t === term).length / tokens.length;
}

function bm25Score(queryTokens: string[], docTokens: string[], avgDocLength: number): number {
  const k1 = 1.5;
  const b = 0.75;
  let score = 0;

  for (const term of queryTokens) {
    const tf = computeTF(docTokens, term);
    const docLen = docTokens.length;
    const numerator = tf * (k1 + 1);
    const denominator = tf + k1 * (1 - b + b * (docLen / avgDocLength));
    score += numerator / denominator;
  }

  return score;
}

// ─── Hybrid Retrieval ──────────────────────────────────────────────────────
export async function retrieveRelevantChunks(
  workspaceId: number,
  query: string,
  limit = 5,
  options: SearchOptions = {}
): Promise<RetrievalResult[]> {
  const db = await requireDb();

  // 1. Keyword search (BM25-like)
  const keywordResults = await keywordSearch(workspaceId, query, limit * 2);

  // 2. Semantic search (embedding-based if available)
  const semanticResults = await semanticSearch(workspaceId, query, limit * 2);

  // 3. Data source search
  const dsResults = await searchDataSourceRecords(workspaceId, query, limit);

  // 4. Hybrid weighting: 60% semantic + 40% keyword.
  //    Normalize each channel into [0,1] so they combine fairly, then merge by chunkId.
  const normalize = (arr: RetrievalResult[]): RetrievalResult[] => {
    if (arr.length === 0) return arr;
    const max = arr.reduce((m, r) => Math.max(m, r.score), 0);
    if (max <= 0) return arr;
    return arr.map(r => ({ ...r, score: r.score / max }));
  };

  const keywordWeighted = normalize(keywordResults).map(r => ({ ...r, score: r.score * 0.4 }));
  const semanticWeighted = normalize(semanticResults).map(r => ({ ...r, score: r.score * 0.6 }));

  // Data source results are kept as-is with their fixed score (they don't participate in the hybrid blend).
  const merged = new Map<number, RetrievalResult>();
  for (const r of [...keywordWeighted, ...semanticWeighted, ...dsResults]) {
    const existing = merged.get(r.chunkId);
    if (!existing || r.score > existing.score) {
      merged.set(r.chunkId, r);
    }
  }

  // 5. Sort by score and return top results
  return Array.from(merged.values()).sort((a, b) => b.score - a.score).slice(0, limit);
}

async function keywordSearch(workspaceId: number, query: string, limit: number): Promise<RetrievalResult[]> {
  const db = await requireDb();
  const queryTokens = tokenize(query);

  // Fetch candidate chunks
  const candidates = await db
    .select({
      id: documentChunks.id,
      documentId: documentChunks.documentId,
      content: documentChunks.content,
      metadata: documentChunks.metadata,
    })
    .from(documentChunks)
    .where(eq(documentChunks.workspaceId, workspaceId))
    .limit(500);

  if (candidates.length === 0) return [];

  const avgDocLength = candidates.reduce((sum, c) => sum + tokenize(c.content).length, 0) / candidates.length;

  const scored = candidates.map(c => {
    const docTokens = tokenize(c.content);
    const score = bm25Score(queryTokens, docTokens, avgDocLength);
    return { chunkId: c.id, documentId: c.documentId, content: c.content, score, metadata: c.metadata as Record<string, unknown> };
  });

  // Get document names
  const docIds = Array.from(new Set(scored.map(s => s.documentId)));
  const docRows = await db
    .select({ id: documents.id, name: documents.originalName })
    .from(documents)
    .where(sql`${documents.id} = ANY(${docIds})`);
  const docMap = new Map(docRows.map(d => [d.id, d.name]));

  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(s => ({
      chunkId: s.chunkId,
      documentId: s.documentId,
      documentName: docMap.get(s.documentId) || "Unknown",
      content: s.content,
      score: s.score,
      metadata: s.metadata,
    }));
}

async function semanticSearch(workspaceId: number, query: string, limit: number): Promise<RetrievalResult[]> {
  if (!AI_API_KEY) {
    // graceful fallback when no embedding API is configured
    return [];
  }
  try {
    const queryEmbedding = await generateEmbedding(query);
    const embeddingStr = `[${queryEmbedding.join(",")}]`;
    const db = await requireDb();
    const rows = await db.execute(sql`
      SELECT
        e.id,
        e.content,
        e.source_type,
        e.source_id,
        e.metadata,
        1 - (e.embedding <=> ${embeddingStr}::vector) AS similarity
      FROM embeddings e
      WHERE e.workspace_id = ${workspaceId}
      ORDER BY e.embedding <=> ${embeddingStr}::vector
      LIMIT ${limit}
    `);

    const rawRows = (rows as unknown as { rows?: unknown[] }).rows ?? (rows as unknown as unknown[]);
    return (rawRows as any[]).map((row: any) => ({
      chunkId: Number(row.id),
      documentId: Number(row.source_id),
      documentName: String(row.source_type ?? ""),
      content: String(row.content ?? ""),
      score: Number(row.similarity) || 0,
      metadata: (row.metadata as Record<string, unknown>) || {},
    }));
  } catch (error) {
    console.error("[semanticSearch] failed:", error);
    return []; // graceful fallback
  }
}

async function searchDataSourceRecords(workspaceId: number, query: string, limit: number): Promise<RetrievalResult[]> {
  const db = await requireDb();
  const phrase = `%${query}%`;

  const records = await db
    .select({
      id: dataRecords.id,
      dataSourceId: dataRecords.dataSourceId,
      payload: dataRecords.payload,
      searchableText: dataRecords.searchableText,
    })
    .from(dataRecords)
    .where(and(eq(dataRecords.workspaceId, workspaceId), sql`${dataRecords.searchableText} ILIKE ${phrase}`))
    .limit(limit);

  const dsIds = Array.from(new Set(records.map(r => r.dataSourceId)));
  const dsRows = dsIds.length > 0
    ? await db.select({ id: dataSources.id, name: dataSources.name }).from(dataSources).where(sql`${dataSources.id} = ANY(${dsIds})`)
    : [];
  const dsMap = new Map(dsRows.map(d => [d.id, d.name]));

  return records.map(r => ({
    chunkId: r.id,
    documentId: r.dataSourceId,
    documentName: dsMap.get(r.dataSourceId) || "Data Source",
    content: r.searchableText || JSON.stringify(r.payload),
    score: 0.4,
    metadata: { type: "data_source", payload: r.payload },
  }));
}

// ─── Reranking ──────────────────────────────────────────────────────────────
export function rerankResults(results: RetrievalResult[], query: string): RetrievalResult[] {
  const queryTokens = tokenize(query);

  return results.map(r => {
    const contentTokens = tokenize(r.content);
    const overlap = queryTokens.filter(t => contentTokens.includes(t)).length;
    const boost = overlap / Math.max(queryTokens.length, 1);
    return { ...r, score: r.score + boost * 0.2 };
  }).sort((a, b) => b.score - a.score);
}

// ─── Knowledge Graph Integration ────────────────────────────────────────────
export interface KnowledgeEntity {
  id: string;
  label: string;
  type: string;
  properties: Record<string, unknown>;
}

export interface KnowledgeLink {
  source: string;
  target: string;
  relation: string;
  weight: number;
}

export async function buildKnowledgeContext(workspaceId: number, query: string): Promise<{ entities: KnowledgeEntity[]; links: KnowledgeLink[] }> {
  // Placeholder for Neo4j knowledge graph integration
  return { entities: [], links: [] };
}
