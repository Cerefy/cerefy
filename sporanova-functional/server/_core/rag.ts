import { and, eq, isNull, sql, desc } from "drizzle-orm";
import { documents, documentChunks, dataSources, dataRecords } from "../../drizzle/schema";
import { requireDb } from "../db";

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
  const results: RetrievalResult[] = [];

  // 1. Keyword search (BM25-like)
  const keywordResults = await keywordSearch(workspaceId, query, limit * 2);
  results.push(...keywordResults);

  // 2. Semantic search (embedding-based if available)
  const semanticResults = await semanticSearch(workspaceId, query, limit * 2);
  results.push(...semanticResults);

  // 3. Data source search
  const dsResults = await searchDataSourceRecords(workspaceId, query, limit);
  results.push(...dsResults);

  // 4. Deduplicate and rank
  const seen = new Set<number>();
  const unique: RetrievalResult[] = [];
  for (const r of results) {
    if (!seen.has(r.chunkId)) {
      seen.add(r.chunkId);
      unique.push(r);
    }
  }

  // 5. Sort by score and return top results
  unique.sort((a, b) => b.score - a.score);
  return unique.slice(0, limit);
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
  // Placeholder for vector search - would integrate with pgvector or external vector DB
  // For now, fall back to keyword search with boost
  const db = await requireDb();

  const candidates = await db
    .select({
      id: documentChunks.id,
      documentId: documentChunks.documentId,
      content: documentChunks.content,
      metadata: documentChunks.metadata,
    })
    .from(documentChunks)
    .where(eq(documentChunks.workspaceId, workspaceId))
    .limit(200);

  // Simple text matching as placeholder for vector similarity
  const queryLower = query.toLowerCase();
  const matched = candidates
    .filter(c => c.content.toLowerCase().includes(queryLower))
    .map(c => ({
      chunkId: c.id,
      documentId: c.documentId,
      documentName: "",
      content: c.content,
      score: 0.5 + Math.random() * 0.3,
      metadata: c.metadata as Record<string, unknown>,
    }));

  const docIds = Array.from(new Set(matched.map(m => m.documentId)));
  if (docIds.length > 0) {
    const docRows = await db
      .select({ id: documents.id, name: documents.originalName })
      .from(documents)
      .where(sql`${documents.id} = ANY(${docIds})`);
    const docMap = new Map(docRows.map(d => [d.id, d.name]));
    matched.forEach(m => { m.documentName = docMap.get(m.documentId) || "Unknown"; });
  }

  return matched.slice(0, limit);
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
