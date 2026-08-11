export interface ModelInventoryEntry {
  version: string;
  promptVersion: string;
  purpose: string;
  status: 'active' | 'retired';
  knownLimitations: string[];
  deployedAt: string;
  lastIndependentValidationAt?: string;
  usageBoundaries: string[];
}

/**
 * §11.4 — formal model inventory. Every model/prompt version in production
 * (what it does, known limitations, usage boundaries, independent-validation
 * cadence). This is the single artifact procurement at banking/government
 * customers often hinges on — kept as data in code so it diff-reviews like a
 * dependency bump and ships through the same PR gate.
 */
export const MODEL_INVENTORY: ModelInventoryEntry[] = [
  {
    version: 'gemini-2.5-flash',
    promptVersion: 'analysis_v1',
    purpose: 'AI Workspace analysis (Understand→Retrieve→Plan→Analyze→Answer)',
    status: 'active',
    knownLimitations: [
      'Numeric claims must be computed against sources; this model is not a calculator.',
      'Arabic dialect fidelity strongest for MSA; Gulf/Egyptian dialects may drift.',
    ],
    deployedAt: '2025-01-15',
    usageBoundaries: [
      'Only answer from retrieved/cited sources ($11.1).',
      'Never return raw PII or full document contents at info level.',
    ],
  },
  {
    version: 'gemini-2.5-flash',
    promptVersion: 'decision_v1',
    purpose: 'Decision recommendation + simulation reasoning',
    status: 'active',
    knownLimitations: [
      'Confidence reflects retrieval support, not business outcome certainty.',
    ],
    deployedAt: '2025-01-15',
    usageBoundaries: [
      'Confidence-gated escalation below threshold ($11.3).',
      'Not for autonomous approval — human approve step required.',
    ],
  },
  {
    version: 'fallback-rule',
    promptVersion: 'degenerate_v1',
    purpose: 'Degraded-mode responder when primary provider unavailable',
    status: 'active',
    knownLimitations: [
      'Deliberately non-generative — returns honest "AI temporarily limited".',
    ],
    deployedAt: '2025-01-15',
    usageBoundaries: [
      'Only enabled while provider outage persists ($3.3).',
    ],
  },
];

export function lookupInventory(version: string, promptVersion: string): ModelInventoryEntry | null {
  return (
    MODEL_INVENTORY.find((e) => e.version === version && e.promptVersion === promptVersion) ?? null
  );
}

export function activeInventory(): ModelInventoryEntry[] {
  return MODEL_INVENTORY.filter((e) => e.status === 'active');
}

export function markValidated(version: string, promptVersion: string, when: string): ModelInventoryEntry | null {
  const entry = lookupInventory(version, promptVersion);
  if (!entry) return null;
  entry.lastIndependentValidationAt = when;
  return entry;
}