import type { Server as SocketIOServer } from 'socket.io';
import { buildCerefyWorkflow, createInitialExecutionState } from './graph/workflow';
import type { CerefyExecutionInput } from './graph/state';
import { appendAgentExecutionError, appendAgentExecutionEvent, createAgentExecutionRecord, updateAgentExecutionRecord } from './tools/databaseTool';

export interface RunExecutionResult {
  executionId: string;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED';
  output?: Record<string, unknown>;
  confidence?: number;
}

function now() {
  return new Date().toISOString();
}

function emit(io: SocketIOServer | null, event: string, payload: Record<string, unknown>) {
  io?.emit(event, payload);
}

export async function runCerefyAIPipeline(input: CerefyExecutionInput, io: SocketIOServer | null): Promise<RunExecutionResult> {
  const execution = await createAgentExecutionRecord(input);
  const executionId = String(execution.id);
  const workflow = buildCerefyWorkflow();

  const basePayload = {
    executionId,
    tenantId: input.tenantId,
    projectId: input.projectId || '',
    documentId: input.documentId || '',
    type: input.type,
  };

  emit(io, 'agent.started', {
    ...basePayload,
    agentId: 'supervisor',
    agentName: 'Supervisor',
    status: 'running',
    stepIndex: 1,
    totalSteps: 4,
    timestamp: now(),
  });
  await appendAgentExecutionEvent(executionId, { event: 'agent.started', payload: basePayload, timestamp: now() });

  try {
    emit(io, 'agent.progress', {
      ...basePayload,
      agentId: 'supervisor',
      agentName: 'Supervisor',
      stepIndex: 1,
      totalSteps: 4,
      status: 'running',
      output: 'Starting multi-agent orchestration.',
      timestamp: now(),
    });

    const initialState = createInitialExecutionState({
      ...input,
      metadata: { ...(input.metadata || {}), executionId },
    });

    const finalState = await workflow.invoke(initialState);

    const output = finalState.output || {};
    const confidence = finalState.confidence || 0;
    const finalStatus = finalState.governanceComplete ? 'COMPLETED' : 'RUNNING';

    await updateAgentExecutionRecord(executionId, {
      status: finalStatus,
      currentAgent: finalState.nextAgent || 'complete',
      confidence,
      output,
      errors: finalState.errors || [],
      completedAt: finalStatus === 'COMPLETED' ? new Date() : null,
    });

    emit(io, 'agent.completed', {
      ...basePayload,
      agentId: finalState.nextAgent || 'governance',
      agentName: 'Cerefy Multi-Agent Runtime',
      status: finalStatus.toLowerCase(),
      stepIndex: 4,
      totalSteps: 4,
      confidence,
      output,
      timestamp: now(),
    });

    await appendAgentExecutionEvent(executionId, {
      event: 'agent.completed',
      payload: { status: finalStatus, confidence, output },
      timestamp: now(),
    });

    return {
      executionId,
      status: finalStatus,
      output,
      confidence,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await appendAgentExecutionError(executionId, message);
    await updateAgentExecutionRecord(executionId, {
      status: 'FAILED',
      currentAgent: 'supervisor',
      errors: [message],
      completedAt: null,
    });

    emit(io, 'agent.failed', {
      ...basePayload,
      agentId: 'supervisor',
      agentName: 'Supervisor',
      status: 'failed',
      error: message,
      timestamp: now(),
    });
    emit(io, 'agent.error', {
      ...basePayload,
      agentId: 'supervisor',
      agentName: 'Supervisor',
      status: 'failed',
      error: message,
      timestamp: now(),
    });

    await appendAgentExecutionEvent(executionId, {
      event: 'agent.failed',
      payload: { error: message },
      timestamp: now(),
    });

    return {
      executionId,
      status: 'FAILED',
    };
  }
}
