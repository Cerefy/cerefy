export type EscalationDecision = 'deliver' | 'escalate' | 'refuse';

export interface ConfidenceConfig {
  /** Below this, escalate to human review instead of delivering directly. */
  escalationThreshold: number;
  /** Below this, refuse to answer at all (no fabricated confidence). */
  refuseThreshold: number;
}

export const DEFAULT_CONFIDENCE_CONFIG: ConfidenceConfig = {
  escalationThreshold: 0.7,
  refuseThreshold: 0.4,
};

export interface EscalationInput {
  confidence: number | null | undefined;
  verifiedByCitation: boolean;
  detectedInjection: boolean;
  hasHumanFollowup: boolean;
}

export function decideEscalation(input: EscalationInput, config?: ConfidenceConfig): EscalationDecision {
  const cfg = config ?? DEFAULT_CONFIDENCE_CONFIG;
  if (input.detectedInjection) return 'refuse';
  if (input.confidence == null) return 'escalate';
  if (input.confidence < cfg.refuseThreshold) return 'refuse';
  if (input.confidence < cfg.escalationThreshold) return 'escalate';
  if (!input.verifiedByCitation && !input.hasHumanFollowup) return 'escalate';
  return 'deliver';
}