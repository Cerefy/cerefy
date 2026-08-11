import { verifyAnswer, type CitationSource } from './citation';
import { isolateRetrievedContent, detectInjection, type RetrievedDocument } from './injection';
import { decideEscalation, DEFAULT_CONFIDENCE_CONFIG, type EscalationDecision } from './confidence';

export interface GuardrailContext {
  answer: string;
  confidence: number | null | undefined;
  sources: CitationSource[];
  retrieved: RetrievedDocument[];
  hasHumanFollowup?: boolean;
}

export interface GuardrailVerification {
  decision: EscalationDecision;
  citationVerified: boolean;
  injectionSafe: boolean;
  reasons: string[];
}

export function runGuardrails(ctx: GuardrailContext): GuardrailVerification {
  const reasons: string[] = [];

  const injectionVerdict = detectInjection(ctx.answer);
  if (!injectionVerdict.safe) reasons.push('answer contains prompt-injection pattern(s)');

  let injectionInRetrieved = false;
  for (const doc of ctx.retrieved) {
    if (!detectInjection(doc.content).safe) { injectionInRetrieved = true; break; }
  }
  if (injectionInRetrieved) reasons.push('retrieved content flagged for prompt-injection quarantine');

  const citation = verifyAnswer(ctx.answer, ctx.sources);
  if (!citation.verified) {
    reasons.push(`citation verification failed (${citation.unverifiedClaims.length} unverified claim(s), ${citation.missingSources.length} missing source(s))`);
  }

  const decision = decideEscalation(
    { confidence: ctx.confidence, verifiedByCitation: citation.verified, detectedInjection: injectionVerdict.safe === false, hasHumanFollowup: ctx.hasHumanFollowup ?? false },
    DEFAULT_CONFIDENCE_CONFIG,
  );

  if (decision !== 'deliver') reasons.push(`confidence gate -> ${decision}`);

  return {
    decision,
    citationVerified: citation.verified,
    injectionSafe: injectionVerdict.safe,
    reasons,
  };
}

export { verifyAnswer, isolateRetrievedContent, detectInjection, decideEscalation };