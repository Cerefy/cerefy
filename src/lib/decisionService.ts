import { db, withTenantContext } from '../db';
import { decisions } from '../db/schema';
import { and, eq, desc } from 'drizzle-orm';

export const getAllDecisions = async (tenantId: string) => {
  return await withTenantContext(tenantId, async (tx) => {
    return await tx.select().from(decisions).orderBy(desc(decisions.createdAt));
  });
};

export const createDecision = async (tenantId: string, decisionData: any) => {
  return await withTenantContext(tenantId, async (tx) => {
    const [newDecision] = await tx.insert(decisions).values({
      ...decisionData,
      tenantId,
    }).returning();
    return newDecision;
  });
};

/**
 * Workflow recovery can re-enter CREATE_DECISION after a process crash. The
 * unique workflow step reference makes the effect idempotent per tenant.
 */
export const createWorkflowDecision = async (tenantId: string, workflowStepRunId: string, decisionData: any) => {
  return await withTenantContext(tenantId, async (tx) => {
    const [existing] = await tx.select().from(decisions).where(and(
      eq(decisions.tenantId, tenantId),
      eq(decisions.workflowStepRunId, workflowStepRunId),
    )).limit(1);
    if (existing) return existing;
    const [created] = await tx.insert(decisions).values({
      ...decisionData,
      tenantId,
      workflowStepRunId,
    }).returning();
    return created;
  });
};

export const updateDecision = async (tenantId: string, decisionId: string, updateData: any) => {
  return await withTenantContext(tenantId, async (tx) => {
    const [updated] = await tx.update(decisions)
      .set(updateData)
      .where(eq(decisions.id, decisionId))
      .returning();
    return updated;
  });
};

export const approveDecision = async (tenantId: string, decisionId: string) => {
  return await updateDecision(tenantId, decisionId, { status: 'APPROVED' });
};

export const rejectDecision = async (tenantId: string, decisionId: string, reason: string) => {
  return await updateDecision(tenantId, decisionId, { status: 'REJECTED', aiRecommendation: `Rejected: ${reason}` });
};
