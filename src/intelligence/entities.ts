// src/intelligence/entities.ts
// Arabic-aware entity extraction. Heuristic (regex + lexicon) extraction of
// currencies, Arabic numerals, and recurring MENA business terminology.
// Returns confidence based on pattern strength — never fabricated benchmark accuracy.

import { normalizeArabic, ARABIC_INDIC_DIGITS } from './arabic/script';

export type EntityType = 'currency' | 'number' | 'date' | 'term';

export interface ExtractedEntity {
  type: EntityType;
  value: string;
  label: string;
  confidence: number;
}

// Currency code -> localized Arabic label mapping (subset used in MENA docs)
export const CURRENCY_LABELS: Record<string, string> = {
  SAR: 'ريال سعودي',
  AED: 'درهم إماراتي',
  EGP: 'جنيه مصري',
  QAR: 'ريال قطري',
  KWD: 'دينار كويتي',
  BHD: 'دينار بحريني',
  OMR: 'ريال عماني',
  JOD: 'دينار أردني',
  LBP: 'ليرة لبنانية',
  IQD: 'دينار عراقي',
  MAD: 'درهم مغربي',
  DZD: 'دينار جزائري',
  TND: 'دينار تونسي',
  USD: 'دولار أمريكي',
  EUR: 'يورو',
  GBP: 'جنيه إسترليني',
};

const CURRENCY_REGEX = /(SAR|AED|EGP|QAR|KWD|BHD|OMR|JOD|LBP|IQD|MAD|DZD|TND|USD|EUR|GBP)/gi;
const ARABIC_CURRENCY_WORDS = ['ريال', 'درهم', 'جنيه', 'دينار', 'ليرة', 'دولار', 'يورو'];
const NUMBER_REGEX = /(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?/g;

export const BUSINESS_TERMS_AR = [
  'استثمار', 'ميزانية', 'مشروع', 'عقد', 'اتفاقية', 'شراكة', 'حوكمة', 'امتثال',
  'توريد', 'سوق', 'إيرادات', 'تكلفة', 'أرباح', 'خسائر', 'مخزون', 'عملاء',
  'تقرير', 'توقعات', 'تنظيم', 'رقابة', 'موردين', 'أصول', 'التزامات',
];

export interface EntityResult {
  entities: ExtractedEntity[];
  normalized: string;
  terms: string[];
}

export function extractArabicEntities(raw: string): EntityResult {
  const text = raw?.trim() ?? '';
  if (!text) return { entities: [], normalized: '', terms: [] };

  const entities: ExtractedEntity[] = [];

  // ISO currency codes
  for (const m of text.matchAll(CURRENCY_REGEX)) {
    const code = m[0].toUpperCase();
    entities.push({
      type: 'currency',
      value: m[0],
      label: CURRENCY_LABELS[code] || code,
      confidence: 0.95,
    });
  }

  // Arabic currency words
  for (const word of ARABIC_CURRENCY_WORDS) {
    const occurrences = text.match(new RegExp(word, 'g'));
    if (occurrences) {
      entities.push({ type: 'currency', value: word, label: word, confidence: 0.9 });
    }
  }

  // Arabic-Indic digit normalization then number extraction
  const digits = text.replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660));
  for (const m of digits.matchAll(NUMBER_REGEX)) {
    if (!m[0] || !/[0-9]/.test(m[0])) continue;
    entities.push({ type: 'number', value: m[0], label: m[0], confidence: 0.8 });
  }

  // Business terminology
  const terms = BUSINESS_TERMS_AR.filter((t) => text.includes(t));
  for (const t of terms) {
    entities.push({ type: 'term', value: t, label: t, confidence: 0.7 });
  }

  return {
    entities: dedupeEntities(entities),
    normalized: normalizeArabic(text),
    terms,
  };
}

function dedupeEntities(entities: ExtractedEntity[]): ExtractedEntity[] {
  const seen = new Set<string>();
  return entities.filter((e) => {
    const key = `${e.type}:${e.value}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// Preserve typing source used by tests/tools
export const ARABIC_INDIC_DIGITS_SOURCE = ARABIC_INDIC_DIGITS.toString();