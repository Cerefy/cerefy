import { and, avg, count, desc, eq, gte } from 'drizzle-orm';
import { db, isDatabaseReachable, withTenantContext } from '../db';
import {
  agentExecutions,
  agentRegistry,
  aiAnswers,
  aiQueries,
  decisions,
  documents,
  projects,
} from '../db/schema';

export interface ExecutiveKPIs {
  totalProjects: number;
  activeAgents: number;
  decisionsThisMonth: number;
  avgConfidenceScore: number;
  totalBudgetManaged: string;
  projectCompletionRate: number;
  agentUtilization: number;
  riskScore: number;
  automationRate: number;
  costSavings: string;
  roiMultiple: number;
  processingTime: string;
}

export interface AgentPerformance {
  agentId: string;
  agentName: string;
  tasksCompleted: number;
  avgLatencyMs: number;
  successRate: number;
  tokensUsed: number;
  costIncurred: string;
  lastActive: string;
}

export interface ProjectAnalytics {
  projectId: string;
  openTasks: number;
  completedTasks: number;
  riskLevel: string;
  burnRate: string;
  stakeholderSentiment: string;
  timelineHealth: string;
  forecastedRevenue: string;
  remainingBudget: string;
}

function monthStart(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

export async function getExecutiveKPIs(tenantId: string): Promise<ExecutiveKPIs> {
  if (!(await isDatabaseReachable())) {
    throw new Error('Analytics unavailable — database not reachable');
  }
  return withTenantContext(tenantId, async (tx) => {
    // A transaction uses a single pg client, so queries must run sequentially —
    // Promise.all against the same client triggers pg's "already executing a
    // query" deprecation and can interleave mid-flight. Sequential reads are
    // still a single round-trip set and fine at pilot scale.
    const projectRows = await tx.select().from(projects);
    const agentRows = await tx.select().from(agentRegistry);
    const decisionRows = await tx.select().from(decisions);
    const answerRows = await tx.select().from(aiAnswers);
    const queryRows = await tx.select().from(aiQueries);
    const documentRows = await tx.select().from(documents);

    const activeAgents = agentRows.filter((a) => a.status === 'ACTIVE').length;
    const decisionsThisMonth = decisionRows.filter((d) => d.createdAt >= monthStart()).length;
    const withConfidence = answerRows.filter((a) => a.confidence > 0);
    const avgConfidence =
      withConfidence.length > 0
        ? Math.round((withConfidence.reduce((sum, a) => sum + a.confidence, 0) / withConfidence.length) * 100) / 100
        : 0;
    const completedProjects = projectRows.filter((p) => p.status === 'Completed').length;
    const projectCompletionRate = projectRows.length > 0 ? Math.round((completedProjects / projectRows.length) * 100) : 0;
    const tasksRunning = queryRows.filter((q) => q.status === 'RUNNING').length;
    const agentUtilization = queryRows.length > 0 ? Math.round((1 - tasksRunning / queryRows.length) * 100) : 0;
    const highRisk = decisionRows.filter((d) => (d.riskScore ?? 0) >= 7).length;
    const riskScore = decisionRows.length > 0 ? Math.round((highRisk / decisionRows.length) * 100) : 0;
    const automationRate = documentRows.length > 0 ? Math.round((documentRows.filter((d) => d.status === 'processed').length / documentRows.length) * 100) : 0;
    const totalTokens = queryRows.reduce((sum, q) => sum + (q.tokensInput ?? 0), 0);
    const tokensSpentUsd = totalTokens * 0.0000025;
    const totalCostUsd = queryRows.reduce((sum, q) => sum + (q.costUsd ?? 0), 0);
    const costSavings = `$${Math.round((tokensSpentUsd - totalCostUsd) / 1000)}K`;

    return {
      totalProjects: projectRows.length,
      activeAgents,
      decisionsThisMonth,
      avgConfidenceScore: avgConfidence,
      totalBudgetManaged: `$${Math.round((projectRows.length * 120) / 1000)}K`,
      projectCompletionRate,
      agentUtilization,
      riskScore,
      automationRate,
      costSavings,
      roiMultiple: answerRows.length > 0 ? Math.round((answerRows.length / (withConfidence.length || 1)) * 10) / 10 : 0,
      processingTime: '—',
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
      const agentRuns = executions.filter((e) => e.currentAgent === agent.name);
      const successful = agentRuns.filter((e) => e.status === 'COMPLETED' || e.status === 'SUCCESS');
      const tokensUsed = agentRuns.reduce((sum, e) => {
        const output = (e.output ?? {}) as { usage?: { totalTokens?: number } };
        return sum + (output.usage?.totalTokens ?? 0);
      }, 0);
      const lastRun = agentRuns.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0];
      const perf: AgentPerformance = {
        agentId: agent.id,
        agentName: agent.name,
        tasksCompleted: agentRuns.length,
        avgLatencyMs: 0,
        successRate: agentRuns.length > 0 ? Math.round((successful.length / agentRuns.length) * 100) : 0,
        tokensUsed,
        costIncurred: `$${(tokensUsed * 0.0000025).toFixed(1)}K`,
        lastActive: lastRun ? lastRun.updatedAt.toISOString() : new Date().toISOString(),
      };
      return perf;
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
      const err = new Error('Project not found') as Error & { status?: number };
      err.status = 404;
      throw err;
    }
    const runs = await tx
      .select()
      .from(agentExecutions)
      .where(and(eq(agentExecutions.tenantId, tenantId), eq(agentExecutions.projectId, projectId)));

    const completed = runs.filter((r) => r.status === 'COMPLETED' || r.status === 'SUCCESS').length;
    const running = runs.filter((r) => r.status === 'RUNNING').length;
    const timelineHealth = runs.length === 0 ? 'No executions yet' : running > 0 ? 'In Progress' : completed >= running ? 'On Track' : 'At Risk';

    return {
      projectId,
      openTasks: running,
      completedTasks: completed,
      riskLevel: project.status === 'Completed' ? 'Low' : 'Moderate',
      burnRate: runs.length > 0 ? (completed / runs.length).toFixed(2) : '0.00',
      stakeholderSentiment: 'Positive',
      timelineHealth,
      forecastedRevenue: project.status === 'Completed' ? 'Completed' : 'In Progress',
      remainingBudget: project.budget ?? '—',
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
