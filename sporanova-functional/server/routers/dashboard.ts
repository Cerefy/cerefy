import { and, desc, eq, gte, isNull } from "drizzle-orm";
import { z } from "zod";
import { agentRuns, agents, businessMetrics, dataSources, insights, auditLogs } from "../../drizzle/schema";
import { workspaceProcedure } from "../authz";
import { requireDb } from "../db";
import { router } from "../_core/trpc";

const ranges = { "7D": 7, "30D": 30, "90D": 90, "1Y": 365 } as const;
const inputSchema = z.object({ workspaceId: z.number().int().positive(), range: z.enum(["7D", "30D", "90D", "1Y"]).default("1Y") });

function startOfRange(range: keyof typeof ranges) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - ranges[range]);
  return date;
}

export const dashboardRouter = router({
  overview: workspaceProcedure.input(inputSchema).query(async ({ ctx, input }) => {
    const db = await requireDb();
    const since = startOfRange(input.range);
    const [metrics, activeAgents, sourceList, signalList, recentActivity] = await Promise.all([
      db.select().from(businessMetrics).where(and(eq(businessMetrics.workspaceId, ctx.workspaceId), gte(businessMetrics.metricDate, since))),
      db.select().from(agents).where(and(eq(agents.workspaceId, ctx.workspaceId), eq(agents.status, "active"), isNull(agents.deletedAt))),
      db.select().from(dataSources).where(and(eq(dataSources.workspaceId, ctx.workspaceId), isNull(dataSources.deletedAt))),
      db.select().from(insights).where(and(eq(insights.workspaceId, ctx.workspaceId), eq(insights.status, "open"))).orderBy(desc(insights.createdAt)).limit(6),
      db.select().from(auditLogs).where(eq(auditLogs.workspaceId, ctx.workspaceId)).orderBy(desc(auditLogs.createdAt)).limit(12),
    ]);
    const revenue = metrics.filter(metric => metric.metricKey === "revenue").reduce((total, metric) => total + Number(metric.metricValue), 0);
    const insightsToday = signalList.filter(signal => signal.createdAt >= new Date(Date.now() - 24 * 60 * 60 * 1000)).length;
    return {
      range: input.range,
      kpis: {
        revenue,
        activeAgents: activeAgents.length,
        dataSources: sourceList.length,
        insightsToday,
      },
      revenueSeries: metrics.filter(metric => metric.metricKey === "revenue").map(metric => ({ date: metric.metricDate, value: Number(metric.metricValue) })),
      activeAgents,
      signals: signalList,
      activity: recentActivity,
    };
  }),

  runSummary: workspaceProcedure.input(z.object({ workspaceId: z.number().int().positive(), limit: z.number().int().min(1).max(30).default(8) })).query(async ({ ctx, input }) => {
    const db = await requireDb();
    return db.select().from(agentRuns).where(eq(agentRuns.workspaceId, ctx.workspaceId)).orderBy(desc(agentRuns.createdAt)).limit(input.limit);
  }),
});
