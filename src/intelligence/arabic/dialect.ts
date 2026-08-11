// src/intelligence/arabic/dialect.ts
// Dialect detection for Arabic text — deterministic, heuristic-based, no claims
// of neural accuracy. Scores are relative confidence normalized to a trusted
// lexicon overlap; they are NOT benchmarked ML scores.
//
// IMPORTANT: Dialect identification from short text is inherently uncertain.
// This module deliberately returns a confidence that reflects *marker coverage*
// and a `note` explaining the basis. It never fabricates a % accuracy claim.

import { normalizeArabic, stripTashkeel, containsArabic } from './script';
import {
  EGYPTIAN_MARKERS,
  GULF_MARKERS,
  LEVANTINE_MARKERS,
  IRAQI_MARKERS,
  MAGHREBI_MARKERS,
  MSA_MARKERS,
} from './script';

export type DialectId =
  | 'msa'
  | 'egyptian'
  | 'saudi'
  | 'gulf'
  | 'emirati'
  | 'levantine'
  | 'iraqi'
  | 'maghrebi'
  | 'yemeni'
  | 'unknown';

export interface DialectDetection {
  dialect: DialectId;
  /** Heuristic confidence 0..1 reflecting marker coverage (not accuracy). */
  confidence: number;
  markers: string[];
  markersText: string;
  /** true when Arabic script was detected but no dialect markers matched. */
  resolvedByMsaFallback: boolean;
}

const MARKER_GROUPS: Record<Exclude<DialectId, 'msa' | 'saudi' | 'gulf' | 'emirati' | 'unknown' | 'yemeni'>, string[]> = {
  egyptian: EGYPTIAN_MARKERS,
  levantine: LEVANTINE_MARKERS,
  iraqi: IRAQI_MARKERS,
  maghrebi: MAGHREBI_MARKERS,
};

// Gulf includes Saudi & Emirati specifics; Saudi & Emirati share a large core.
const GULF_CORE = GULF_MARKERS;
const SAUDI_EXTRA = ['يا اخوي', 'السلام', 'وش', 'الحين', 'أنت', 'مب', 'تو'];
const EMIRATI_EXTRA = ['جي', 'ياخي', 'الأمبراطور', 'توي', 'مافيه', 'حدث', 'فزاعة'];

interface Scored {
  dialect: DialectId;
  hits: number;
  confidence: number;
}

function scoreMarkers(text: string, markers: string[], weight = 1): number {
  let hits = 0;
  for (const m of markers) {
    if (text.includes(m)) hits++;
  }
  return hits * weight;
}

export function detectArabicDialect(input: string): DialectDetection {
  if (!input || input.trim().length === 0) {
    return { dialect: 'unknown', confidence: 0, markers: [], markersText: '', resolvedByMsaFallback: false };
  }
  const stripped = stripTashkeel(input);
  const normalized = normalizeArabic(stripped);
  const markersText = normalized; // keep readable for marker matching

  if (!containsArabic(normalized) && !normalized.match(/[a-zA-Z\u0660-\u0669]/)) {
    return { dialect: 'unknown', confidence: 0, markers: [], markersText, resolvedByMsaFallback: false };
  }

  const scores: Scored[] = [];
  const matchedMarkers: string[] = [];

  for (const group of Object.entries(MARKER_GROUPS)) {
    const [dialect, markerList] = group as [DialectId, string[]];
    const hits = scoreMarkers(markersText, markerList.map((m) => normalizeArabic(m)));
    const confidence = Math.min(1, hits / 2);
    if (hits > 0) {
      scores.push({ dialect, hits, confidence });
      matchedMarkers.push(...markerList.filter((m) => markersText.includes(m)).slice(0, 6));
    }
  }

  // Each of the gulf-family dialects tested separately for fine classification
  const gulfHits = scoreMarkers(markersText, GULF_CORE.map((m) => normalizeArabic(m)));
  const saudiHits = scoreMarkers(markersText, SAUDI_EXTRA.map((m) => normalizeArabic(m)));
  const emiratiHits = scoreMarkers(markersText, EMIRATI_EXTRA.map((m) => normalizeArabic(m)));

  if (gulfHits > 0) {
    const gulfFamily = saudiHits > emiratiHits ? 'saudi' : 'gulf';
    scores.push({ dialect: gulfFamily, hits: gulfHits + (saudiHits + emiratiHits), confidence: Math.min(1, gulfHits / 2.5) });
    if (saudiHits > 0) matchedMarkers.push(...SAUDI_EXTRA.filter((m) => markersText.includes(m)).slice(0, 4));
    if (emiratiHits > 0) matchedMarkers.push(...EMIRATI_EXTRA.filter((m) => markersText.includes(m)).slice(0, 4));
  } else if (saudiHits > 0) {
    scores.push({ dialect: 'saudi', hits: saudiHits, confidence: Math.min(1, saudiHits / 2) });
    matchedMarkers.push(...SAUDI_EXTRA.filter((m) => markersText.includes(m)).slice(0, 4));
  } else if (emiratiHits > 0) {
    scores.push({ dialect: 'emirati', hits: emiratiHits, confidence: Math.min(1, emiratiHits / 2) });
    matchedMarkers.push(...EMIRATI_EXTRA.filter((m) => markersText.includes(m)).slice(0, 4));
  }

  const msaHits = scoreMarkers(markersText, MSA_MARKERS.map((m) => normalizeArabic(m)));

  let best: Scored;
  if (scores.length === 0) {
    // No dialect markers found — MSA is the linguistically neutral default for
    // non-transliterated script, but we flag that we cannot confirm it.
    best = { dialect: containsArabic(markersText) ? 'msa' : 'unknown', hits: 0, confidence: 0 };
  } else {
    scores.sort((a, b) => b.hits - a.hits);
    best = scores[0];
    // MSA should never outrank detected dialect; keep MSA as tie-break only for formal markers
    if (msaHits > best.hits * 1.5) {
      best = { dialect: 'msa', hits: msaHits, confidence: Math.min(1, msaHits / 3) };
    }
  }

  return {
    dialect: best.dialect,
    confidence: Number(best.confidence.toFixed(3)),
    markers: [...new Set(matchedMarkers)].slice(0, 8),
    markersText,
    resolvedByMsaFallback: scores.length === 0 && best.dialect === 'msa',
  };
}