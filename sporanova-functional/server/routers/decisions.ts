import { z } from "zod";
import { eq, and, desc, sql } from "drizzle-orm";
import { requireDb } from "../db";
import { insights } from "../../drizzle/schema";
import { workspaceProcedure, workspaceManagerProcedure } from "../authz";

const workspaceInput = z.object({ workspaceId: z.number().int().positive() });

export const decisionsRouter = {
  list: workspaceProcedure
    .input(workspaceInput.extend({
      status: z.string().optional(),
      severity: z.string().optional(),
      limit: z.number().optional().default(50),
      offset: z.number().optional().default(0),
    }))
    .query(async ({ input, ctx }: any) => {
      const db = await requireDb();
      const conditions = [eq(insights.workspaceId, ctx.workspaceId)];
      if (input.status) conditions.push(eq(insights.status, input.status as any));
      if (input.severity) conditions.push(eq(insights.severity, input.severity as any));

      const results = await db.select().from(insights)
        .where(and(...conditions))
        .orderBy(desc(insights.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return results;
    }),

  get: workspaceProcedure
    .input(workspaceInput.extend({ insightId: z.number() }))
    .query(async ({ input, ctx }: any) => {
      const db = await requireDb();
      const [result] = await db.select().from(insights)
        .where(and(eq(insights.id, input.insightId), eq(insights.workspaceId, ctx.workspaceId)));
      return result || null;
    }),

  create: workspaceManagerProcedure
    .input(workspaceInput.extend({
      title: z.string(),
      description: z.string(),
      severity: z.string().default("low"),
      category: z.string().default("insight"),
    }))
    .mutation(async ({ input, ctx }: any) => {
      const db = await requireDb();
      const [result] = await db.insert(insights).values({
        workspaceId: ctx.workspaceId,
        createdByAgentId: null,
        title: input.title,
        description: input.description,
        severity: input.severity as any,
        category: input.category,
        status: "open",
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();
      return result;
    }),

  updateStatus: workspaceManagerProcedure
    .input(workspaceInput.extend({ insightId: z.number(), status: z.string() }))
    .mutation(async ({ input, ctx }: any) => {
      const db = await requireDb();
      const [result] = await db.update(insights)
        .set({ status: input.status as any, updatedAt: new Date() })
        .where(and(eq(insights.id, input.insightId), eq(insights.workspaceId, ctx.workspaceId)))
        .returning();
      return result;
    }),

  approve: workspaceManagerProcedure
    .input(workspaceInput.extend({ insightId: z.number() }))
    .mutation(async ({ input, ctx }: any) => {
      const db = await requireDb();
      const [result] = await db.update(insights)
        .set({ status: "resolved" as any, updatedAt: new Date() })
        .where(and(eq(insights.id, input.insightId), eq(insights.workspaceId, ctx.workspaceId)))
        .returning();
      return result;
    }),

  reject: workspaceManagerProcedure
    .input(workspaceInput.extend({ insightId: z.number() }))
    .mutation(async ({ input, ctx }: any) => {
      const db = await requireDb();
      await db.delete(insights)
        .where(and(eq(insights.id, input.insightId), eq(insights.workspaceId, ctx.workspaceId)));
      return { success: true };
    }),

  getStats: workspaceProcedure
    .input(workspaceInput)
    .query(async ({ ctx }: any) => {
      const db = await requireDb();
      const [total] = await db.select({ count: sql<number>`count(*)::int` })
        .from(insights).where(eq(insights.workspaceId, ctx.workspaceId));
      const [open] = await db.select({ count: sql<number>`count(*)::int` })
        .from(insights).where(and(eq(insights.workspaceId, ctx.workspaceId), eq(insights.status, "open")));
      const [resolved] = await db.select({ count: sql<number>`count(*)::int` })
        .from(insights).where(and(eq(insights.workspaceId, ctx.workspaceId), eq(insights.status, "resolved")));
      const [high] = await db.select({ count: sql<number>`count(*)::int` })
        .from(insights).where(and(eq(insights.workspaceId, ctx.workspaceId), eq(insights.severity, "high")));

      return {
        total: total?.count || 0,
        open: open?.count || 0,
        resolved: resolved?.count || 0,
        high: high?.count || 0,
      };
    }),
};
