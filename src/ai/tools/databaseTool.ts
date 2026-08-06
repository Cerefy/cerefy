import { desc, eq } from 'drizzle-orm';
import { db } from '../../db';
import { agentExecutions } from '../../db/schema';
import type { CerefyExecutionInput } from '../graph/state';

export type AgentExecutionEvent = {
  event: string;
  payload: Record<string, unknown>;
  timestamp: string;
};

export async function createAgentExecutionRecord(input: CerefyExecutionInput) {
  const [execution] = await db
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
}

export async function getAgentExecutionById(executionId: string) {
  const [execution] = await db
    .select()
    .from(agentExecutions)
    .where(eq(agentExecutions.id, executionId as any))
    .limit(1);
  return execution ?? null;
}

export async function listAgentExecutions(tenantId?: string, limit = 25) {
  if (tenantId) {
    return db
      .select()
      .from(agentExecutions)
      .where(eq(agentExecutions.tenantId, tenantId))
      .orderBy(desc(agentExecutions.createdAt))
      .limit(limit);
  }

  return db.select().from(agentExecutions).orderBy(desc(agentExecutions.createdAt)).limit(limit);
}

export async function updateAgentExecutionRecord(
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
  const [execution] = await db
    .update(agentExecutions)
    .set({
      ...patch,
      updatedAt: new Date(),
    })
    .where(eq(agentExecutions.id, executionId as any))
    .returning();

  return execution;
}

export async function appendAgentExecutionEvent(executionId: string, event: AgentExecutionEvent) {
  const [current] = await db
    .select({ eventLog: agentExecutions.eventLog, errors: agentExecutions.errors })
    .from(agentExecutions)
    .where(eq(agentExecutions.id, executionId as any))
    .limit(1);

  const nextEventLog = [
    ...((current?.eventLog as AgentExecutionEvent[] | null | undefined) ?? []),
    event,
  ];

  await db
    .update(agentExecutions)
    .set({
      eventLog: nextEventLog,
      updatedAt: new Date(),
    })
    .where(eq(agentExecutions.id, executionId as any));

  return nextEventLog;
}

export async function appendAgentExecutionError(executionId: string, message: string) {
  const [current] = await db
    .select({ errors: agentExecutions.errors })
    .from(agentExecutions)
    .where(eq(agentExecutions.id, executionId as any))
    .limit(1);

  const nextErrors = [...((current?.errors as string[] | null | undefined) ?? []), message];

  await db
    .update(agentExecutions)
    .set({
      errors: nextErrors,
      updatedAt: new Date(),
    })
    .where(eq(agentExecutions.id, executionId as any));

  return nextErrors;
}
