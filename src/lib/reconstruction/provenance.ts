export interface AnswerRecord {
  id: string;
  tenantId: string;
  queryId?: string | null;
  modelVersion: string;
  promptVersion: string;
  confidence: number;
  output: Record<string, unknown>;
  sources: Array<{ id: string; [k: string]: unknown }>;
  humanReviewStatus: string;
  humanEdited: boolean;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
}

export interface QueryRecord {
  id: string;
  tenantId: string;
  userId?: string | null;
  type: string;
  tokensInput: number;
  tokensOutput: number;
  costUsd: number;
  createdAt: string;
}

export interface FollowUpRecord {
  answerId: string;
  actorId: string;
  action: 'approved' | 'edited' | 'rejected';
  revisedOutput?: Record<string, unknown>;
  reviewedAt: string;
  outcome?: { achieved: boolean | null; confirmedAt: string; note?: string };
}

export interface ModelInventoryEntry {
  version: string;
  promptVersion: string;
  purpose: string;
  status: 'active' | 'retired';
}

export interface ReconstructedAnswer {
  answer: AnswerRecord;
  query: QueryRecord | null;
  retrievedData: AnswerRecord['sources'];
  model: { modelVersion: string; promptVersion: string };
  confidence: { reported: number };
  humanFollowUp: {
    status: string;
    edited: boolean;
    latestReview?: { action: FollowUpRecord['action']; actorId: string; reviewedAt: string; outcome?: FollowUpRecord['outcome'] };
  };
  cost: { tokensInput: number; tokensOutput: number; costUsd: number };
  reconstructable: boolean;
  gaps: string[];
}

/**
 * §12 — reconstruct, for any single AI answer, the exact retrieved data,
 * model/prompt version, reported confidence, cost, and what a human did with
 * it afterward. Returns `reconstructable: false` with the specific gaps when
 * a field that audit-level provenance requires is missing — an answer that
 * cannot be reconstructed is a production incident by this standard.
 */
export function reconstructAnswer(input: {
  answer: AnswerRecord;
  query?: QueryRecord | null;
  followUps?: FollowUpRecord[];
  inventory?: ModelInventoryEntry[];
}): ReconstructedAnswer {
  const { answer, query = null, followUps = [], inventory = [] } = input;
  const gaps: string[] = [];

  if (!answer.modelVersion) gaps.push('answer.modelVersion missing');
  if (!answer.promptVersion) gaps.push('answer.promptVersion missing');
  if (answer.sources.length === 0) gaps.push('answer.sources empty — retrieved data not recorded');
  if (!query && answer.queryId) gaps.push('query record not found');

  if (answer.modelVersion && answer.promptVersion) {
    const inInventory = inventory.some(
      (e) => e.version === answer.modelVersion && e.promptVersion === answer.promptVersion,
    );
    if (inventory.length > 0 && !inInventory) {
      gaps.push(`model/prompt ${answer.modelVersion}@${answer.promptVersion} absent from model inventory`);
    }
  }

  const sorted = [...followUps]
    .filter((f) => f.answerId === answer.id)
    .sort((a, b) => a.reviewedAt.localeCompare(b.reviewedAt));
  const latest = sorted[sorted.length - 1];

  const humanEdited = answer.humanEdited || latest?.action === 'edited' || false;

  return {
    answer,
    query,
    retrievedData: answer.sources,
    model: { modelVersion: answer.modelVersion, promptVersion: answer.promptVersion },
    confidence: { reported: answer.confidence },
    humanFollowUp: {
      status: answer.humanReviewStatus,
      edited: humanEdited,
      ...(latest ? { latestReview: { action: latest.action, actorId: latest.actorId, reviewedAt: latest.reviewedAt, ...(latest.outcome ? { outcome: latest.outcome } : {}) } } : {}),
    },
    cost: { tokensInput: query?.tokensInput ?? 0, tokensOutput: query?.tokensOutput ?? 0, costUsd: query?.costUsd ?? 0 },
    reconstructable: gaps.length === 0,
    gaps,
  };
}