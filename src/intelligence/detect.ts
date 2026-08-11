// src/intelligence/detect.ts
// Top-level language detection + Arabic Intelligence classification.
// Deterministic heuristics: script coverage, Arabizi shape analysis and
// dialect markers. Deliberately no LLM and no network calls.

import { arabicRatio, containsArabic } from './arabic/script';
import { detectArabizi, analyzeCodeSwitching } from './arabic/arabizi';
import { detectArabicDialect } from './arabic/dialect';

export type CerefyLanguage = 'ar' | 'en' | 'unknown';

export interface CerefyLanguageDetection {
  language: CerefyLanguage;
  script: 'arabic' | 'latin' | 'arabic-ind';
  /** Heuristic confidence 0..1 reflecting *script/marker coverage*, never an accuracy claim. */
  confidence: number;
  arabicRatio: number;
  isArabizi: boolean;
  isCodeSwitched: boolean;
  dialect?: ReturnType<typeof detectArabicDialect>;
  note: string;
}

export function detectLanguage(input: string): CerefyLanguageDetection {
  const text = input?.trim() ?? '';
  if (text.length === 0) {
    return {
      language: 'unknown',
      script: 'latin',
      confidence: 0,
      arabicRatio: 0,
      isArabizi: false,
      isCodeSwitched: false,
      note: 'Empty or whitespace-only input.',
    };
  }

  const arabicR = Number(arabicRatio(text).toFixed(3));
  const hasArabic = containsArabic(text);
  const arabizi = detectArabizi(text);
  const code = analyzeCodeSwitching(text);

  const script: CerefyLanguageDetection['script'] = hasArabic
    ? 'arabic'
    : /[\u0660-\u0669\u06F0-\u06F9]/.test(text)
      ? 'arabic-ind'
      : 'latin';

  if (arabizi.isArabizi) {
    return {
      language: 'ar',
      script,
      confidence: Math.min(1, arabizi.confidence + 0.15),
      arabicRatio: arabicR,
      isArabizi: true,
      isCodeSwitched: code.isCodeSwitched,
      dialect: detectArabicDialect(text),
      note: 'Arabizi (Latinized Arabic) detected — routed to Arabic normalization.',
    };
  }

  if (hasArabic) {
    const dialect = detectArabicDialect(text);
    return {
      language: 'ar',
      script,
      confidence: Math.max(0.5, arabicR),
      arabicRatio: arabicR,
      isArabizi: false,
      isCodeSwitched: code.isCodeSwitched,
      dialect,
      note: code.isCodeSwitched
        ? `Arabic-dominant text mixed with English (${code.mixedTokenCount} token(s)).`
        : 'Arabic-script text identified.',
    };
  }

  return {
    language: 'en',
    script,
    confidence: 0.99,
    arabicRatio: arabicR,
    isArabizi: false,
    isCodeSwitched: code.isCodeSwitched,
    note: 'Latin-script text identified (no Arabic detected).',
  };
}

export const detectCerefyLanguage = detectLanguage;