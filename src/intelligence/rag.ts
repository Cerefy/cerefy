// src/intelligence/rag.ts
// Arabic-aware RAG metadata enrichment. Extends the existing Enterprise RAG
// pipeline by attaching first-class Arabic metadata to chunks at ingestion
// time and keeping everything tenant-scoped. Retrieval remains multilingual:
// English chunks are untouched, Arabic chunks carry extra metadata.

import { detectLanguage, CerefyLanguageDetection } from './detect';
import { detectArabicDialect } from './arabic/dialect';
import { extractArabicEntities, ExtractedEntity } from './entities';
import { normalizeArabic, stripTashkeel } from './arabic/script';

export interface ArabicChunkMetadata {
  language: 'ar' | 'en' | 'unknown';
  dialect?: string;
  country?: string; // ISO 3166 alpha-2
  industryId?: string;
  organizationId: string;
  confidence: number; // heuristic coverage, not accuracy
  arabicRatio: number;
  isArabizi: boolean;
  isCodeSwitched: boolean;
  terms?: string[];
  entities?: ExtractedEntity[];
  normalizedSnippet?: string;
}

export interface ArabicMetadataInput {
  tenantId: string;
  organizationId?: string;
  country?: string;
  industryId?: string;
  text: string;
}

export function enrichChunkMetadata(input: ArabicMetadataInput): ArabicChunkMetadata {
  const detection: CerefyLanguageDetection = detectLanguage(input.text);
  const dialect = detection.language === 'ar' ? detectArabicDialect(input.text) : undefined;
  const entities = extractArabicEntities(input.text);

  return {
    language: detection.language,
    dialect: dialect?.dialect ?? 'msa',
    country: input.country,
    industryId: input.industryId,
    organizationId: input.organizationId || input.tenantId,
    confidence: Number(detection.confidence.toFixed(3)),
    arabicRatio: Number(detection.arabicRatio.toFixed(3)),
    isArabizi: detection.isArabizi,
    isCodeSwitched: detection.isCodeSwitched,
    terms: entities.terms,
    entities: entities.entities.slice(0, 20),
    normalizedSnippet: stripTashkeel(normalizeArabic(input.text)).slice(0, 200),
  };
}

/** Combine the Arabic metadata into a JSON-safe flat map for DB/vector columns. */
export function toMetadataRecord(m: ArabicChunkMetadata): Record<string, unknown> {
  return {
    language: m.language,
    dialect: m.dialect,
    country: m.country,
    industryId: m.industryId,
    organizationId: m.organizationId,
    confidence: m.confidence,
    arabicRatio: m.arabicRatio,
    isArabizi: m.isArabizi,
    isCodeSwitched: m.isCodeSwitched,
    terms: m.terms ?? [],
    normalizedSnippet: m.normalizedSnippet ?? '',
  };
}