import { aiAnswers, agentExecutions, decisions, projects } from '../db/schema';

/**
 * Serializers that map real DB rows onto the exact shapes the frontend's typed
 * API contracts (src/api/*.ts) and views (src/components, src/features) consume.
 *
 * Honesty rules (AGENTS.md §0):
 *  - A value is only included when it is a real column or a deterministic
 *    derivation of real data. Nothing is invented, averaged "for the demo", or
 *    filled with Math.random().
 *  - Fields the UI types mark required but that have no real source are emitted
 *    as the emptiest honest value ('' / [] / 0 / null) so the view's own
 *    fallback logic decides, and EmptyState renders when the list is empty.
 */

export type ProjectRow = typeof projects.$inferSelect;
export type DecisionRow = typeof decisions.$inferSelect;
export type AgentRegistryRow = typeof import('../db/schema').agentRegistry.$inferSelect;
export type ExecutionRow = typeof agentExecutions.$inferSelect;
export type AnswerRow = typeof aiAnswers.$inferSelect;

export function serializeProject(row: ProjectRow) {
  return {
    id: row.id,
    tenantId: row.tenantId,
    title: row.title,
    name: row.title,
    code: row.code,
    department: row.department ?? '',
    status: row.status ?? 'Planning',
    progress: row.progress ?? 0,
    progressPercent: row.progress ?? 0,
    budget: row.budget ?? '',
    budgetUsed: '',
    dueDate: row.dueDate ?? '',
    assignees: [] as string[],
    agentLead: '',
    milestonesCount: undefined,
    completedMilestones: undefined,
  };
}

export function serializeDecision(row: DecisionRow) {
  return {
    id: row.id,
    tenantId: row.tenantId,
    title: row.title,
    question: row.question,
    category: row.businessImpact ?? 'Strategy',
    riskScore: row.riskScore ?? 0,
    businessImpact: (row.businessImpact ?? 'MEDIUM') as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
    expectedROI: row.expectedROI ?? '—',
    confidenceScore: row.confidenceScore ?? 0,
    confidence: row.confidenceScore != null ? row.confidenceScore / 100 : 0,
    status: (row.status ?? 'OPEN') as 'OPEN' | 'IN_SIMULATION' | 'APPROVED' | 'REJECTED',
    aiRecommendation: row.aiRecommendation ?? '',
    alternatives: [] as { name: string; score: number; cost: string }[],
    createdAt: row.createdAt.toISOString(),
  };
}

const AGENT_COLORS = [
  'bg-indigo-signal/20 text-indigo-signal-soft',
  'bg-cyan-signal/20 text-cyan-signal-strong',
  'bg-emerald-signal/20 text-emerald-signal-soft',
  'bg-amber-signal/20 text-amber-signal-soft',
  'bg-teal-signal/20 text-teal-signal-soft',
];

function colorFor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return AGENT_COLORS[h % AGENT_COLORS.length];
}

export type SerializedAgent = {
  id: string;
  name: string;
  role: string;
  department: string;
  avatarColor: string;
  status: 'idle' | 'busy' | 'reflecting' | 'offline';
  skills: string[];
  currentTask?: string;
  performanceScore: number;
  monthlyCost: string;
  tools: string[];
  permissions: string[];
};

/** Derives the agent roster shape. `performanceScore` is the real success rate
 *  (successful executions / total executions) across the tenant's persisted
 *  `agent_executions`; 0 with no runs is honest — the UI shows an EmptyState for
 *  an empty roster and a real 0% for a fleet with zero recorded successes. */
export function serializeAgent(row: any, executions: ExecutionRow[]): SerializedAgent {
  const runs = executions.filter((e) => e.currentAgent === row.name);
  const successful = runs.filter((e) => e.status === 'COMPLETED' || e.status === 'SUCCESS').length;
  const performanceScore = runs.length > 0 ? Math.round((successful / runs.length) * 100) : 0;
  const latest = [...runs].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0];
  const busy = latest && latest.status === 'RUNNING';
  const status: SerializedAgent['status'] =
    row.status === 'DISABLED' ? 'offline' : busy ? 'busy' : row.status === 'DEGRADED' ? 'reflecting' : 'idle';

  return {
    id: row.id,
    name: row.name,
    role: row.role ?? 'AI Agent',
    department: row.department ?? 'Operations',
    avatarColor: colorFor(row.name),
    status,
    skills: Array.isArray(row.capabilities) ? row.capabilities : [],
    currentTask: latest ? `${latest.type} · ${latest.status.toLowerCase()}` : undefined,
    performanceScore,
    monthlyCost: row.monthlyCost ?? '—',
    tools: Array.isArray(row.tools) ? row.tools : [],
    permissions: Array.isArray(row.permissions) ? row.permissions : [],
  };
}
