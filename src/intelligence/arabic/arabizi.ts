// src/intelligence/arabic/arabizi.ts
// Arabizi (Latinized Arabic) and Arabic/English code-switching analysis.
// Heuristic, deterministic, no ML claims.

import { ARABIZI_PATTERNS, arabicRatio, containsArabic } from './script';

export interface ArabiziDetectionResult {
  isArabizi: boolean;
  /** 0..1 heuristic confidence (coverage of Arabizi-shaped tokens). */
  confidence: number;
  transliteratedTraces: string[];
  transliteratedWords: Array<{ latin: string; arabic: string }>;
}

// Common English words that contain Arabizi-looking digraphs (th, sh, gh) but
// are NOT Arabizi. Guards against false positives from ordinary English.
const ENGLISH_DIGRAPH_STOPWORDS = new Set([
  'the', 'then', 'this', 'that', 'them', 'they', 'their', 'there', 'these',
  'those', 'with', 'she', 'shall', 'much', 'which', 'high', 'though', 'through',
  'thought', 'other', 'mother', 'father', 'three', 'throw', 'thin', 'thing',
  'thank', 'both', 'month', 'math', 'path', 'north', 'south', 'earth', 'worth',
  'though', 'while', 'thing', 'things', 'nothing', 'anything', 'something',
]);

// Arabizi commonly uses digits that resemble Arabic phonemes:
// 2=ء/أ, 3=ع, 7=ح, 9=ق/غ, 5=خ, 8=غ, 6=ط, 4=ذ/ث/ش
function isArabiziWordShape(word: string): boolean {
  if (!/[a-zA-Z]/.test(word)) return false;
  const lower = word.toLowerCase();
  if (ENGLISH_DIGRAPH_STOPWORDS.has(lower)) return false;
  if (/[0-9]/.test(word)) return true;
  // phonetic digraph: sh, kh, gh rendered in Latin by Arabizi writers
  return /(sh|kh|gh|th|3a|7a|9a|5a|2a)/i.test(word);
}

export function detectArabizi(input: string): ArabiziDetectionResult {
  const empty: ArabiziDetectionResult = { isArabizi: false, confidence: 0, transliteratedWords: [], transliteratedTraces: [] };
  if (!input || input.trim().length === 0) return empty;

  const words = input.split(/\s+/).filter(Boolean);
  const transliteratedWords: { latin: string; arabic: string }[] = [];
  const transliteratedTraces: string[] = [];

  for (const word of words) {
    const key = word.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (ARABIZI_PATTERNS[key]) {
      transliteratedWords.push({ latin: word, arabic: ARABIZI_PATTERNS[key] });
      transliteratedTraces.push(key);
    } else if (isArabiziWordShape(word)) {
      transliteratedTraces.push(word.toLowerCase().slice(0, 12));
    }
  }

  const shapeCount = words.filter((w) => isArabiziWordShape(w)).length;
  const confidence = Math.min(1, shapeCount / Math.max(1, Math.min(words.length, 8)));
  const isArabizi = shapeCount > 0 && arabicRatio(input) < 0.35;

  return {
    isArabizi,
    confidence: Number(confidence.toFixed(3)),
    transliteratedWords: transliteratedWords.slice(0, 12),
    transliteratedTraces: [...new Set(transliteratedTraces)].slice(0, 12),
  };
}

export interface CodeAnalysisSummary {
  isCodeSwitched: boolean;
  mixedTokenCount: number;
  arabicWordCount: number;
  latinWordCount: number;
  dominant: 'ar' | 'en' | 'mixed' | 'none';
  hint: string;
}

export function analyzeCodeSwitching(text: string): CodeAnalysisSummary {
  const tokens = text.split(/[\s.,;:!?()'"”„\[\]]+/).filter(Boolean);
  let arabicTokens = 0;
  let latinTokens = 0;
  let mixed = 0;

  for (const token of tokens) {
    const ar = arabicRatio(token) > 0.4;
    const la = /[a-zA-Z]/.test(token);
    if (ar && la) mixed++;
    else if (ar) arabicTokens++;
    else if (la) latinTokens++;
  }

  const total = arabicTokens + latinTokens + mixed;
  const dominant: CodeAnalysisSummary['dominant'] =
    total === 0 ? 'none' : mixed > 0 && (arabicTokens === 0 || latinTokens === 0) ? 'mixed' : arabicTokens >= latinTokens ? 'ar' : 'en';

  return {
    mixedTokenCount: mixed,
    arabicWordCount: arabicTokens,
    latinWordCount: latinTokens,
    dominant,
    isCodeSwitched: mixed > 0 || (arabicTokens > 0 && latinTokens > 1),
    hint:
      mixed > 0
        ? `Detected ${mixed} mixed-script token(s).`
        : dominant === 'ar'
          ? 'Predominantly Arabic-script text with isolated English tokens.'
          : dominant === 'en'
            ? 'Predominantly Latin-script text with isolated Arabic tokens.'
            : 'No script tokens detected.',
  };
}