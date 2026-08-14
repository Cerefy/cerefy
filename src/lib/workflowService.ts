import { and, desc, eq } from 'drizzle-orm';
import { db, withTenantContext } from '../db';
import {
  workflowApprovals,
  workflowRuns,
  workflowStepRuns,
  workflowVersions,
  workflows,
} from '../db/schema';

export type WorkflowStepDefinition = {
  key: string;
  type: 'AI_ANALYSIS' | 'APPROVAL' | 'CREATE_DECISION' | 'NOTIFY';
  config?: Record<string, unknown>;
};

export type WorkflowDefinition = {
  steps: WorkflowStepDefinition[];
};

export type CreateWorkflowInput = {
  name: string;
  description?: string;
  triggerType: string;
  triggerConfig?: Record<string, unknown>;
  definition: WorkflowDefinition;
};

function validateDefinition(definition: WorkflowDefinition): void {
  if (!definition || !Array.isArray(definition.steps) || definition.steps.length === 0) {
    throw Object.assign(new Error('Workflow definition must contain at least one step'), { status: 400 });
  }
  const keys = new Set<string>();
  for (const step of definition.steps) {
    if (!step || typeof step.key !== 'string' || step.key.trim().length === 0) {
      throw Object.assign(new Error('Every workflow step requires a non-empty key'), { status: 400 });
    }
    if (keys.has(step.key)) {
      throw Object.assign(new Error(`Duplicate workflow step key: ${step.key}`), { status: 400 });
    }
    keys.add(step.key);
    if (!['AI_ANALYSIS', 'APPROVAL', 'CREATE_DECISION', 'NOTIFY'].includes(step.type)) {
      throw Object.assign(new Error(`Unsupported workflow step type: ${String(step.type)}`), { status: 400 });
    }
  }
}

export async function createWorkflow(tenantId: string, userId: string, input: CreateWorkflowInput) {
  validateDefinition(input.definition);
  return withTenantContext(tenantId, async (tx) => {
    const [workflow] = await tx.insert(workflows).values({
      tenantId,
      name: input.name,
      description: input.description ?? null,
      triggerType: input.triggerType,
      triggerConfig: input.triggerConfig ?? {},
      createdBy: userId,
    }).returning();
    const [version] = await tx.insert(workflowVersions).values({
      workflowId: workflow.id,
      tenantId,
      version: 1,
      status: 'DRAFT',
      definition: input.definition,
      createdBy: userId,
    }).returning();
    return { workflow, version };
  });
}

export async function listWorkflows(tenantId: string) {
  return withTenantContext(tenantId, async (tx) => tx.select().from(workflows).where(eq(workflows.tenantId, tenantId)).orderBy(desc(workflows.updatedAt)));
}

export async function getWorkflow(tenantId: string, workflowId: string) {
  return withTenantContext(tenantId, async (tx) => {
    const [workflow] = await tx.select().from(workflows).where(and(eq(workflows.id, workflowId), eq(workflows.tenantId, tenantId))).limit(1);
    if (!workflow) return null;
    const versions = await tx.select().from(workflowVersions)
      .where(and(eq(workflowVersions.workflowId, workflowId), eq(workflowVersions.tenantId, tenantId)))
      .orderBy(desc(workflowVersions.version));
    return { workflow, versions };
  });
}

export async function publishWorkflow(tenantId: string, workflowId: string, versionId: string) {
  return withTenantContext(tenantId, async (tx) => {
    const [version] = await tx.select().from(workflowVersions)
      .where(and(eq(workflowVersions.id, versionId), eq(workflowVersions.workflowId, workflowId), eq(workflowVersions.tenantId, tenantId)))
      .limit(1);
    if (!version) return null;
    await tx.update(workflowVersions).set({ status: 'PUBLISHED', publishedAt: new Date() })
      .where(and(eq(workflowVersions.workflowId, workflowId), eq(workflowVersions.tenantId, tenantId)));
    const [workflow] = await tx.update(workflows).set({ status: 'PUBLISHED', updatedAt: new Date() })
      .where(and(eq(workflows.id, workflowId), eq(workflows.tenantId, tenantId))).returning();
    return { workflow, version: { ...version, status: 'PUBLISHED', publishedAt: new Date() } };
  });
}

export async function createWorkflowRun(
  tenantId: string,
  workflowId: string,
  userId: string,
  input: Record<string, unknown>,
  idempotencyKey?: string,
) {
  return withTenantContext(tenantId, async (tx) => {
    if (idempotencyKey) {
      const [existing] = await tx.select().from(workflowRuns)
        .where(and(eq(workflowRuns.tenantId, tenantId), eq(workflowRuns.idempotencyKey, idempotencyKey)))
        .limit(1);
      if (existing) return { run: existing, replayed: true };
    }
    const [version] = await tx.select().from(workflowVersions)
      .where(and(eq(workflowVersions.workflowId, workflowId), eq(workflowVersions.tenantId, tenantId), eq(workflowVersions.status, 'PUBLISHED')))
      .orderBy(desc(workflowVersions.version)).limit(1);
    if (!version) throw Object.assign(new Error('Workflow has no published version'), { status: 409 });
    const [run] = await tx.insert(workflowRuns).values({
      workflowId,
      workflowVersionId: version.id,
      tenantId,
      status: 'QUEUED',
      input,
      createdBy: userId,
      idempotencyKey: idempotencyKey ?? null,
    }).returning();
    const definition = version.definition as WorkflowDefinition;
    await tx.insert(workflowStepRuns).values(definition.steps.map((step) => ({
      workflowRunId: run.id,
      tenantId,
      stepKey: step.key,
      stepType: step.type,
      status: 'QUEUED',
      input: {},
    })));
    return { run, replayed: false };
  });
}

export async function getWorkflowRun(tenantId: string, runId: string) {
  return withTenantContext(tenantId, async (tx) => {
    const [run] = await tx.select().from(workflowRuns).where(and(eq(workflowRuns.id, runId), eq(workflowRuns.tenantId, tenantId))).limit(1);
    if (!run) return null;
    const steps = await tx.select().from(workflowStepRuns).where(and(eq(workflowStepRuns.workflowRunId, runId), eq(workflowStepRuns.tenantId, tenantId))).orderBy(workflowStepRuns.createdAt);
    const approvals = await tx.select().from(workflowApprovals).where(and(eq(workflowApprovals.workflowRunId, runId), eq(workflowApprovals.tenantId, tenantId))).orderBy(desc(workflowApprovals.requestedAt));
    return { run, steps, approvals };
  });
}
