import type { Server as SocketIOServer } from 'socket.io';
import { and, asc, eq } from 'drizzle-orm';
import { db, withTenantContext } from '../db';
import { decisions, workflowApprovals, workflowEvents, workflowRuns, workflowStepRuns, workflowVersions } from '../db/schema';
import { runCerefyAIPipeline } from '../ai/runtime';
import * as decisionService from './decisionService';
import type { WorkflowDefinition } from './workflowService';

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function recordEvent(tenantId: string, runId: string, eventType: string, payload: Record<string, unknown>) {
  await withTenantContext(tenantId, async (tx) => {
    await tx.insert(workflowEvents).values({ workflowRunId: runId, tenantId, eventType, payload });
  });
}

async function updateRun(tenantId: string, runId: string, values: Record<string, unknown>) {
  return withTenantContext(tenantId, async (tx) => {
    const [run] = await tx.update(workflowRuns).set(values).where(and(eq(workflowRuns.id, runId), eq(workflowRuns.tenantId, tenantId))).returning();
    return run;
  });
}

async function updateStep(tenantId: string, stepId: string, values: Record<string, unknown>) {
  return withTenantContext(tenantId, async (tx) => {
    const [step] = await tx.update(workflowStepRuns).set(values).where(and(eq(workflowStepRuns.id, stepId), eq(workflowStepRuns.tenantId, tenantId))).returning();
    return step;
  });
}

export async function executeWorkflowRun(tenantId: string, runId: string, io: SocketIOServer | null = null) {
  const context = await withTenantContext(tenantId, async (tx) => {
    const [run] = await tx.select().from(workflowRuns).where(and(eq(workflowRuns.id, runId), eq(workflowRuns.tenantId, tenantId))).limit(1);
    if (!run) return null;
    const [version] = await tx.select().from(workflowVersions).where(and(eq(workflowVersions.id, run.workflowVersionId), eq(workflowVersions.tenantId, tenantId))).limit(1);
    const steps = await tx.select().from(workflowStepRuns).where(and(eq(workflowStepRuns.workflowRunId, runId), eq(workflowStepRuns.tenantId, tenantId))).orderBy(asc(workflowStepRuns.createdAt));
    return { run, version, steps };
  });
  if (!context) return null;
  if (context.run.status !== 'QUEUED') return context.run;
  if (!context.version) throw new Error('Workflow version not found');

  await updateRun(tenantId, runId, { status: 'RUNNING', startedAt: new Date(), error: null });
  await recordEvent(tenantId, runId, 'workflow.run.started', { runId });
  const definition = context.version.definition as WorkflowDefinition;
  const input = (context.run.input ?? {}) as Record<string, unknown>;
  const outputs: Record<string, unknown> = {};

  try {
    for (const stepRun of context.steps) {
      if (stepRun.status === 'COMPLETED') {
        if (stepRun.output && typeof stepRun.output === 'object') outputs[stepRun.stepKey] = stepRun.output as Record<string, unknown>;
        continue;
      }
      const stepDefinition = definition.steps.find((step) => step.key === stepRun.stepKey);
      if (!stepDefinition) throw new Error(`Definition is missing step ${stepRun.stepKey}`);
      await updateStep(tenantId, stepRun.id, { status: 'RUNNING', attempt: (stepRun.attempt ?? 0) + 1, startedAt: new Date(), error: null });
      await recordEvent(tenantId, runId, 'workflow.step.started', { stepKey: stepRun.stepKey, stepType: stepRun.stepType });

      if (stepDefinition.type === 'AI_ANALYSIS') {
        const result = await runCerefyAIPipeline({
          type: 'workflow_ai_analysis',
          tenantId,
          userId: context.run.createdBy,
          metadata: { workflowRunId: runId, workflowStep: stepRun.stepKey, input, previousOutputs: outputs },
        }, io);
        if (result.status === 'FAILED') throw new Error('AI analysis failed');
        outputs[stepRun.stepKey] = result.output ?? {};
        await updateStep(tenantId, stepRun.id, { status: 'COMPLETED', output: { executionId: result.executionId, result: result.output ?? {}, confidence: result.confidence ?? null }, completedAt: new Date() });
      } else if (stepDefinition.type === 'CREATE_DECISION') {
        const aiOutput = Object.values(outputs).find((value) => value && typeof value === 'object') as Record<string, unknown> | undefined;
        const title = String(input.title ?? stepDefinition.config?.title ?? '');
        const question = String(input.question ?? stepDefinition.config?.question ?? '');
        if (!title || !question) throw new Error('CREATE_DECISION requires input.title and input.question');
        const decision = await decisionService.createDecision(tenantId, { title, question, status: 'OPEN', aiRecommendation: typeof aiOutput?.answer === 'string' ? aiOutput.answer : null });
        outputs[stepRun.stepKey] = { decisionId: decision.id };
        await updateStep(tenantId, stepRun.id, { status: 'COMPLETED', output: { decisionId: decision.id }, completedAt: new Date() });
      } else if (stepDefinition.type === 'APPROVAL') {
        await withTenantContext(tenantId, async (tx) => {
          await tx.insert(workflowApprovals).values({ workflowRunId: runId, workflowStepRunId: stepRun.id, tenantId, status: 'PENDING', requestedRole: typeof stepDefinition.config?.requestedRole === 'string' ? stepDefinition.config.requestedRole : 'approver' });
        });
        await updateStep(tenantId, stepRun.id, { status: 'WAITING_APPROVAL', completedAt: null });
        await updateRun(tenantId, runId, { status: 'WAITING_APPROVAL', output: outputs });
        await recordEvent(tenantId, runId, 'workflow.approval.requested', { stepKey: stepRun.stepKey });
        return await updateRun(tenantId, runId, { status: 'WAITING_APPROVAL', output: outputs });
      } else if (stepDefinition.type === 'NOTIFY') {
        const result = { status: 'NOT_CONFIGURED', reason: 'No notification connector is configured for this tenant' };
        outputs[stepRun.stepKey] = result;
        await updateStep(tenantId, stepRun.id, { status: 'COMPLETED', output: result, completedAt: new Date() });
      }
      await recordEvent(tenantId, runId, 'workflow.step.completed', { stepKey: stepRun.stepKey, stepType: stepRun.stepType });
    }
    const completed = await updateRun(tenantId, runId, { status: 'SUCCEEDED', output: outputs, completedAt: new Date() });
    await recordEvent(tenantId, runId, 'workflow.run.completed', { runId });
    return completed;
  } catch (error) {
    const message = errorMessage(error);
    await updateRun(tenantId, runId, { status: 'FAILED', error: message, output: outputs, completedAt: new Date() });
    await recordEvent(tenantId, runId, 'workflow.run.failed', { runId, error: message });
    return updateRun(tenantId, runId, { status: 'FAILED', error: message, output: outputs });
  }
}

export async function resolveWorkflowApproval(tenantId: string, approvalId: string, userId: string, status: 'APPROVED' | 'REJECTED', note?: string) {
  return withTenantContext(tenantId, async (tx) => {
    const [approval] = await tx.select().from(workflowApprovals).where(and(eq(workflowApprovals.id, approvalId), eq(workflowApprovals.tenantId, tenantId))).limit(1);
    if (!approval || approval.status !== 'PENDING') return null;
    const [updated] = await tx.update(workflowApprovals).set({ status, decisionNote: note ?? null, resolvedBy: userId, resolvedAt: new Date() }).where(and(eq(workflowApprovals.id, approvalId), eq(workflowApprovals.tenantId, tenantId))).returning();
    await tx.update(workflowStepRuns).set({ status: status === 'APPROVED' ? 'COMPLETED' : 'FAILED', output: status === 'APPROVED' ? { approvalStatus: 'APPROVED', resolvedBy: userId } : null, error: status === 'REJECTED' ? note ?? 'Approval rejected' : null, completedAt: new Date() }).where(and(eq(workflowStepRuns.id, approval.workflowStepRunId), eq(workflowStepRuns.tenantId, tenantId)));
    await tx.update(workflowRuns).set({ status: status === 'APPROVED' ? 'QUEUED' : 'FAILED', error: status === 'REJECTED' ? note ?? 'Approval rejected' : null }).where(and(eq(workflowRuns.id, approval.workflowRunId), eq(workflowRuns.tenantId, tenantId)));
    return updated;
  });
}
