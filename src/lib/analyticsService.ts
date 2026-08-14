import { and, desc, eq } from 'drizzle-orm';
import { isDatabaseReachable, withTenantContext } from '../db';
import {
  agentExecutions,
  agentRegistry,
  aiAnswers,
  decisions,
  documents,
  projects,
} from '../db/schema';

export interface ExecutiveKPIs {
  totalProjects: number;
  activeAgents: number;
  decisionsThisMonth: number;
  avgConfidenceScore: number | null;
  totalBudgetManaged: null;
  projectCompletionRate: number | null;
  agentUtilization: null;
  riskScore: number | null;
  automationRate: null;
  costSavings: null;
  roiMultiple: null;
  processingTime: null;
}

export interface AgentPerformance {
  agentId: string;
  agentName: string;
  tasksCompleted: number;
  avgLatencyMs: number | null;
  successRate: number | null;
  tokensUsed: number | null;
  costIncurred: string | null;
  lastActive: string | null;
}

export interface ProjectAnalytics {
  projectId: string;
  openTasks: number;
  completedTasks: number;
  riskLevel: null;
  burnRate: null;
  stakeholderSentiment: null;
  timelineHealth: null;
  forecastedRevenue: null;
  remainingBudget: string | null;
}

function monthStart(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

function roundedPercent(value: number): number {
  return Math.round(value * 100) / 100;
}

function numeric(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export async function getExecutiveKPIs(tenantId: string): Promise<ExecutiveKPIs> {
  if (!(await isDatabaseReachable())) {
    throw new Error('Analytics unavailable — database not reachable');
  }

  return withTenantContext(tenantId, async (tx) => {
    const projectRows = await tx.select().from(projects);
    const agentRows = await tx.select().from(agentRegistry);
    const decisionRows = await tx.select().from(decisions);
    const answerRows = await tx.select().from(aiAnswers);

    const confidenceValues = answerRows
      .map((answer) => numeric(answer.confidence))
      .filter((value): value is number => value !== null);
    const completedProjects = projectRows.filter((project) => String(project.status).toLowerCase() === 'completed').length;
    const riskValues = decisionRows
      .map((decision) => numeric(decision.riskScore))
      .filter((value): value is number => value !== null);
    const highRisk = riskValues.filter((score) => score >= 7).length;

    return {
      totalProjects: projectRows.length,
      activeAgents: agentRows.filter((agent) => agent.status === 'ACTIVE').length,
      decisionsThisMonth: decisionRows.filter((decision) => decision.createdAt >= monthStart()).length,
      avgConfidenceScore: confidenceValues.length > 0
        ? roundedPercent(confidenceValues.reduce((sum, score) => sum + score, 0) / confidenceValues.length)
        : null,
      totalBudgetManaged: null,
      projectCompletionRate: projectRows.length > 0 ? Math.round((completedProjects / projectRows.length) * 100) : null,
      agentUtilization: null,
      riskScore: riskValues.length > 0 ? Math.round((highRisk / riskValues.length) * 100) : null,
      automationRate: null,
      costSavings: null,
      roiMultiple: null,
      processingTime: null,
    };
  });
}

export async function getAgentPerformance(tenantId: string): Promise<AgentPerformance[]> {
  if (!(await isDatabaseReachable())) {
    throw new Error('Analytics unavailable — database not reachable');
  }

  return withTenantContext(tenantId, async (tx) => {
    const agents = await tx.select().from(agentRegistry);
    const executions = await tx.select().from(agentExecutions);

    return agents.map((agent) => {
      const agentRuns = executions.filter((execution) => execution.currentAgent === agent.name);
      const successful = agentRuns.filter((execution) => execution.status === 'COMPLETED' || execution.status === 'SUCCESS');
      const latencyValues = agentRuns
        .filter((execution) => execution.completedAt)
        .map((execution) => execution.completedAt!.getTime() - execution.createdAt.getTime())
        .filter((value) => value >= 0);
      let tokenTotal = 0;
      let costTotal = 0;
      let hasUsage = false;
      for (const execution of agentRuns) {
        const provenance = (execution.output as { provenance?: { tokensInput?: unknown; tokensOutput?: unknown; costUsd?: unknown } } | null)?.provenance;
        const tokensInput = numeric(provenance?.tokensInput);
        const tokensOutput = numeric(provenance?.tokensOutput);
        const costUsd = numeric(provenance?.costUsd);
        if (tokensInput !== null || tokensOutput !== null || costUsd !== null) hasUsage = true;
        tokenTotal += (tokensInput ?? 0) + (tokensOutput ?? 0);
        costTotal += costUsd ?? 0;
      }
      const lastRun = [...agentRuns].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0];

      return {
        agentId: agent.id,
        agentName: agent.name,
        tasksCompleted: successful.length,
        avgLatencyMs: latencyValues.length > 0
          ? Math.round(latencyValues.reduce((sum, latency) => sum + latency, 0) / latencyValues.length)
          : null,
        successRate: agentRuns.length > 0 ? Math.round((successful.length / agentRuns.length) * 100) : null,
        tokensUsed: hasUsage ? tokenTotal : null,
        costIncurred: hasUsage ? `$${costTotal.toFixed(4)}` : null,
        lastActive: lastRun ? lastRun.updatedAt.toISOString() : null,
      };
    });
  });
}

export async function getProjectAnalytics(tenantId: string, projectId: string): Promise<ProjectAnalytics> {
  if (!(await isDatabaseReachable())) {
    throw new Error('Analytics unavailable — database not reachable');
  }

  return withTenantContext(tenantId, async (tx) => {
    const [project] = await tx.select().from(projects).where(eq(projects.id, projectId as any)).limit(1);
    if (!project) {
      const error = new Error('Project not found') as Error & { status?: number };
      error.status = 404;
      throw error;
    }
    const runs = await tx
      .select()
      .from(agentExecutions)
      .where(and(eq(agentExecutions.tenantId, tenantId), eq(agentExecutions.projectId, projectId)));

    return {
      projectId,
      openTasks: runs.filter((run) => run.status === 'RUNNING').length,
      completedTasks: runs.filter((run) => run.status === 'COMPLETED' || run.status === 'SUCCESS').length,
      riskLevel: null,
      burnRate: null,
      stakeholderSentiment: null,
      timelineHealth: null,
      forecastedRevenue: null,
      remainingBudget: project.budget ?? null,
    };
  });
}

export async function getTenantExecutions(tenantId: string) {
  if (!(await isDatabaseReachable())) return [];
  return withTenantContext(tenantId, async (tx) => tx.select().from(agentExecutions));
}

export async function getMemoryDocuments(tenantId: string): Promise<Array<{ id: string; title: string; updatedAt: string; summary: string; source: string }>> {
  if (!(await isDatabaseReachable())) return [];
  return withTenantContext(tenantId, async (tx) => {
    const rows = await tx.select().from(documents).orderBy(desc(documents.createdAt)).limit(50);
    return rows.map((doc) => ({
      id: doc.id,
      title: doc.title,
      updatedAt: doc.createdAt.toISOString(),
      summary: String(doc.rawContent ?? '').slice(0, 160) || 'Document ingested',
      source: 'Postgres',
    }));
  });
}
