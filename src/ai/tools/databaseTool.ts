import { eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { db, isDatabaseReachable, withTenantContext } from '../../db';
import { agentExecutions } from '../../db/schema';
import type { CerefyExecutionInput } from '../graph/state';

export type AgentExecutionEvent = {
  event: string;
  payload: Record<string, unknown>;
  timestamp: string;
};

// When Postgres is not reachable (local dev fallback, degraded pilot), the
// pipeline still executes the real agent chain and returns real content;
// only the execution-accounting record is ephemeral. This keeps the request
// path honest without an unhandled DB rejection killing the process.
const offlineExecutions = new Map<string, Record<string, unknown>>();

export async function createAgentExecutionRecord(input: CerefyExecutionInput) {
  if (!(await isDatabaseReachable())) {
    const id = `exec_offline_${randomUUID()}`;
    const record = {
      id,
      tenantId: input.tenantId,
      projectId: input.projectId ?? null,
      documentId: input.documentId ?? null,
      type: input.type,
      status: 'RUNNING',
    };
    offlineExecutions.set(id, record);
    return record;
  }
  // Wrapped in withTenantContext so RLS (tenant_isolation_agent_executions WITH
  // CHECK) accepts the insert with this tenant's context.
  return withTenantContext(input.tenantId, async (tx) => {
    const [execution] = await tx
      .insert(agentExecutions)
      .values({
        tenantId: input.tenantId,
        projectId: input.projectId ?? null,
        documentId: input.documentId ?? null,
        type: input.type,
        status: 'RUNNING',
        currentAgent: 'supervisor',
        confidence: 0,
        input,
        output: null,
        eventLog: [],
        errors: [],
      })
      .returning();

    return execution;
  });
}

export async function updateAgentExecutionRecord(
  tenantId: string,
  executionId: string,
  patch: Partial<{
    status: string;
    currentAgent: string;
    confidence: number;
    output: Record<string, unknown> | null;
    errors: string[];
    completedAt: Date | null;
  }>,
) {
  if (!(await isDatabaseReachable())) {
    const current = offlineExecutions.get(executionId);
    if (current) {
      const next = { ...current, ...patch, updatedAt: new Date().toISOString() };
      offlineExecutions.set(executionId, next);
      return next;
    }
    return null;
  }
  return withTenantContext(tenantId, async (tx) => {
    const [execution] = await tx
      .update(agentExecutions)
      .set({
        ...patch,
        updatedAt: new Date(),
      })
      .where(eq(agentExecutions.id, executionId as any))
      .returning();

    return execution ?? null;
  });
}

export async function appendAgentExecutionEvent(tenantId: string, executionId: string, event: AgentExecutionEvent) {
  if (!(await isDatabaseReachable())) return [event];
  return withTenantContext(tenantId, async (tx) => {
    const [current] = await tx
      .select({ eventLog: agentExecutions.eventLog, errors: agentExecutions.errors })
      .from(agentExecutions)
      .where(eq(agentExecutions.id, executionId as any))
      .limit(1);

    const nextEventLog = [
      ...((current?.eventLog as AgentExecutionEvent[] | null | undefined) ?? []),
      event,
    ];

    await tx
      .update(agentExecutions)
      .set({
        eventLog: nextEventLog,
        updatedAt: new Date(),
      })
      .where(eq(agentExecutions.id, executionId as any));

    return nextEventLog;
  });
}

export async function appendAgentExecutionError(tenantId: string, executionId: string, message: string) {
  if (!(await isDatabaseReachable())) {
    return [message];
  }
  return withTenantContext(tenantId, async (tx) => {
    const [current] = await tx
      .select({ errors: agentExecutions.errors })
      .from(agentExecutions)
      .where(eq(agentExecutions.id, executionId as any))
      .limit(1);

    const nextErrors = [...((current?.errors as string[] | null | undefined) ?? []), message];

    await tx
      .update(agentExecutions)
      .set({
        errors: nextErrors,
        updatedAt: new Date(),
      })
      .where(eq(agentExecutions.id, executionId as any));

    return nextErrors;
  });
}