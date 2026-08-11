import { db, withTenantContext } from '../db';
import { decisions } from '../db/schema';
import { eq, desc } from 'drizzle-orm';

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
