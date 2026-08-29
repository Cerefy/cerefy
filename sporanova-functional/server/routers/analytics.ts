import { and, eq, gte, lt, sql } from "drizzle-orm";
import { z } from "zod";
import { businessMetrics } from "../../drizzle/schema";
import { workspaceProcedure } from "../authz";
import { requireDb } from "../db";
import { router } from "../_core/trpc";

const workspaceInput = z.object({ workspaceId: z.number().int().positive() });
const rangeDays = { "7D": 7, "30D": 30, "90D": 90, "1Y": 365 } as const;
const analyticsInput = workspaceInput.extend({ range: z.enum(["7D", "30D", "90D", "1Y"]).default("1Y"), segment: z.string().trim().max(80).optional() });

function dates(range: keyof typeof rangeDays) {
  const end = new Date();
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - rangeDays[range]);
  const previous = new Date(start);
  previous.setUTCDate(previous.getUTCDate() - rangeDays[range]);
  return { start, end, previous };
}

export const analyticsRouter = router({
  overview: workspaceProcedure.input(analyticsInput).query(async ({ ctx, input }) => {
    const db = await requireDb();
    const { start, previous } = dates(input.range);
    const currentRows = await db.select().from(businessMetrics).where(and(eq(businessMetrics.workspaceId, ctx.workspaceId), gte(businessMetrics.metricDate, start), input.segment ? eq(businessMetrics.segment, input.segment) : undefined));
    const previousRows = await db.select().from(businessMetrics).where(and(eq(businessMetrics.workspaceId, ctx.workspaceId), gte(businessMetrics.metricDate, previous), lt(businessMetrics.metricDate, start), input.segment ? eq(businessMetrics.segment, input.segment) : undefined));
    const summarize = (rows: typeof currentRows, key: string) => rows.filter(row => row.metricKey === key).reduce((sum, row) => sum + Number(row.metricValue), 0);
    const keys = ["mrr", "nrr", "cac", "acv", "revenue"];
    const kpis = Object.fromEntries(keys.map(key => {
      const value = summarize(currentRows, key);
      const prior = summarize(previousRows, key);
      return [key, { value, priorValue: prior, changePercent: prior === 0 ? null : ((value - prior) / Math.abs(prior)) * 100 }];
    }));
    return { range: input.range, kpis, series: currentRows.filter(row => row.metricKey === "revenue").map(row => ({ date: row.metricDate, value: Number(row.metricValue), segment: row.segment })) };
  }),

  segments: workspaceProcedure.input(analyticsInput.extend({ page: z.number().int().min(1).default(1), pageSize: z.number().int().min(1).max(100).default(25), sortBy: z.enum(["segment", "mrr", "nrr", "cac", "acv"]).default("segment"), sortDirection: z.enum(["asc", "desc"]).default("asc") })).query(async ({ ctx, input }) => {
    const db = await requireDb();
    const { start } = dates(input.range);
    const rows = await db.select({ segment: businessMetrics.segment, metricKey: businessMetrics.metricKey, total: sql<string>`sum(${businessMetrics.metricValue})` }).from(businessMetrics).where(and(eq(businessMetrics.workspaceId, ctx.workspaceId), gte(businessMetrics.metricDate, start))).groupBy(businessMetrics.segment, businessMetrics.metricKey);
    const grouped = new Map<string, Record<string, number>>();
    for (const row of rows) grouped.set(row.segment, { ...(grouped.get(row.segment) ?? {}), [row.metricKey]: Number(row.total) });
    const items = Array.from(grouped.entries()).map(([segment, values]) => ({ segment, ...values })) as Array<{ segment: string; mrr?: number; nrr?: number; cac?: number; acv?: number }>;
    items.sort((left, right) => {
      const leftValue = input.sortBy === "segment" ? left.segment : (left[input.sortBy] ?? 0);
      const rightValue = input.sortBy === "segment" ? right.segment : (right[input.sortBy] ?? 0);
      const comparison = typeof leftValue === "string" && typeof rightValue === "string" ? leftValue.localeCompare(rightValue) : Number(leftValue) - Number(rightValue);
      return input.sortDirection === "asc" ? comparison : -comparison;
    });
    const startIndex = (input.page - 1) * input.pageSize;
    return { items: items.slice(startIndex, startIndex + input.pageSize), total: items.length, page: input.page, pageSize: input.pageSize };
  }),
});
