export interface CitationSource {
  id: string;
  content: string;
}

export interface CitationCheckResult {
  verified: boolean;
  score: number;
  unverifiedClaims: string[];
  missingSources: string[];
}

const STOPWORDS = new Set([
  'a','an','the','of','to','in','on','for','and','or','is','are','was','were','be','been',
  'as','at','by','from','with','it','its','this','that','these','those','which','who','we','our',
]);

function tokens(text: string): Set<string> {
  const out = new Set<string>();
  for (const t of text.toLowerCase().split(/[^\p{L}\p{N}]+/u)) {
    if (t && !STOPWORDS.has(t)) out.add(t);
  }
  return out;
}

function ngrams(text: string, n: number): string[] {
  const toks = text.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter((t) => t && !STOPWORDS.has(t));
  const out: string[] = [];
  for (let i = 0; i + n <= toks.length; i++) out.push(toks.slice(i, i + n).join(' '));
  return out;
}

const MIN_VERIFIED_CLAIMS = 1;
const DEFAULT_THRESHOLD = 0.6;

export function verifyClaimAgainstSources(claim: string, sources: CitationSource[]): number {
  if (!claim.trim()) return 0;
  const terms = tokens(claim);
  if (terms.size === 0) return 0;
  const bigrams = ngrams(claim, 2);
  let bestOverlap = 0;
  for (const src of sources) {
    const srcTokens = tokens(src.content);
    let matched = 0;
    for (const t of terms) if (srcTokens.has(t)) matched++;
    let bigramMatched = 0;
    const srcBigrams = new Set(ngrams(src.content, 2));
    for (const b of bigrams) if (srcBigrams.has(b)) bigramMatched++;
    const score = (0.6 * matched) / terms.size + (0.4 * bigramMatched) / Math.max(bigrams.length, 1);
    bestOverlap = Math.max(bestOverlap, score);
  }
  return bestOverlap;
}

export function splitClaims(answer: string): string[] {
  const sentences = answer.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 0);
  // Merge very short fragments so each claim carries enough signal to verify.
  const merged: string[] = [];
  for (const s of sentences) {
    const last = merged[merged.length - 1];
    if (last && (last.split(' ').length < 8 || s.split(' ').length < 8)) {
      merged[merged.length - 1] = `${last} ${s}`;
    } else {
      merged.push(s);
    }
  }
  return merged;
}

export function verifyAnswer(answer: string, sources: CitationSource[], options?: { threshold?: number; minVerifiedClaims?: number }): CitationCheckResult {
  const threshold = options?.threshold ?? DEFAULT_THRESHOLD;
  const minVerified = options?.minVerifiedClaims ?? MIN_VERIFIED_CLAIMS;
  const claims = splitClaims(answer);
  const citedIds = [...answer.matchAll(/\[([0-9a-zA-Z_-]+)\]/g)].map((m) => m[1]);
  const providedIds = new Set(sources.map((s) => s.id));
  const missingSources = [...new Set(citedIds)].filter((c) => !providedIds.has(c));
  const unverifiedClaims: string[] = [];
  let verifiedCount = 0;
  for (const claim of claims) {
    const score = verifyClaimAgainstSources(claim, sources);
    if (score >= threshold) verifiedCount++;
    else unverifiedClaims.push(claim);
  }
  const verified = claims.length > 0 && verifiedCount >= minVerified && unverifiedClaims.length === 0 && missingSources.length === 0;
  return { verified, score: claims.length === 0 ? 0 : verifiedCount / claims.length, unverifiedClaims, missingSources };
}