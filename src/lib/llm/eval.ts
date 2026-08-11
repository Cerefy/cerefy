import { verifyAnswer } from '../guardrails/citation';

export interface EvalCase {
  id: string;
  query: string;
  domain: string;
  goldenAnswer: string;
  goldenSources: string[];
  expectRefusal: boolean;
  sourceContents?: string[];
}

export interface EvalResult {
  caseId: string;
  factualAccuracy: boolean;
  citationCorrect: boolean;
  confidence: number;
  refusedWhenExpected: boolean;
  checked: boolean;
  citationScore?: number;
}

export interface EvalSummary {
  total: number;
  factual: number;
  citation: number;
  refusal: number;
  avgConfidence: number;
  checked: number;
}

export const GOLDEN_SET: EvalCase[] = [
  {
    id: 'gc-1',
    query: 'What ERP does Acme Industries run?',
    domain: 'market',
    goldenAnswer: 'Acme Industries runs SAP S/4HANA. [doc-acme-2024]',
    goldenSources: ['doc-acme-2024'],
    expectRefusal: false,
    sourceContents: ['Acme Industries runs SAP S/4HANA as its enterprise resource planning system since 2022.'],
  },
  {
    id: 'gc-2',
    query: 'What was Nibras Q3 revenue?',
    domain: 'finance',
    goldenAnswer: 'Nibras Group reported revenue of SAR 142 million for Q3 2024. [doc-nibras-q3]',
    goldenSources: ['doc-nibras-q3'],
    expectRefusal: false,
    sourceContents: ['Nibras Group reported revenue of SAR 142 million for the third quarter of 2024.'],
  },
];

export function scoreAnswer(caseDef: EvalCase, candidate: { answer: string; sources: string[]; confidence: number | null }): EvalResult {
  const refused = /cannot|unable|insufficient|decline/i.test(candidate.answer);
  const refusedWhenExpected = caseDef.expectRefusal ? refused : !refused;
  const factualAccuracy =
    candidate.answer.trim().length > 0 && candidate.answer === caseDef.goldenAnswer;
  const citationCorrect = caseDef.goldenSources.every((s) => candidate.sources.includes(s));
  let citationScore: number | undefined;
  if (caseDef.sourceContents?.length) {
    const sources = caseDef.goldenSources.map((id, i) => ({ id, content: caseDef.sourceContents![i] ?? '' }));
    const verdict = verifyAnswer(candidate.answer, sources, { threshold: 0.5 });
    citationScore = verdict.score;
  }
  return {
    caseId: caseDef.id,
    factualAccuracy,
    citationCorrect,
    confidence: candidate.confidence ?? 0,
    refusedWhenExpected,
    checked: true,
    ...(citationScore !== undefined ? { citationScore } : {}),
  };
}

export function summarize(results: EvalResult[]): EvalSummary {
  const total = results.length;
  const factual = results.filter((r) => r.factualAccuracy).length;
  const citation = results.filter((r) => r.citationCorrect).length;
  const refusal = results.filter((r) => r.refusedWhenExpected).length;
  const avgConfidence = total === 0 ? 0 : results.reduce((acc, r) => acc + r.confidence, 0) / total;
  return { total, factual, citation, refusal, avgConfidence, checked: results.filter((r) => r.checked).length };
}