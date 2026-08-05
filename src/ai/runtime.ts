import type { Server as SocketIOServer } from 'socket.io';
import { createInitialExecutionState } from './graph/workflow';
import type { CerefyExecutionInput, CerefyGraphState } from './graph/state';
import { analystAgent } from './agents/analyst.agent';
import { discoveryAgent } from './agents/discovery.agent';
import { governanceAgent } from './agents/governance.agent';
import { memoryAgent } from './agents/memory.agent';
import { supervisorAgent } from './graph/supervisor';
import { appendAgentExecutionError, appendAgentExecutionEvent, createAgentExecutionRecord, updateAgentExecutionRecord } from './tools/databaseTool';
import { ensureCoreAgentsRegistered, recordAgentExecution } from './registry';

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
  const executionId = typeof payload.executionId === 'string' ? payload.executionId : null;
  if (executionId) {
    io?.to(`execution:${executionId}`).emit(event, payload);
  }
}

function emitAgentLifecycle(io: SocketIOServer | null, executionId: string, agentName: string, status: string, payload: Record<string, unknown> = {}) {
  emit(io, `agent.${status}`, {
    executionId,
    agentId: agentName,
    agentName,
    status,
    timestamp: now(),
    ...payload,
  });
}

function emitToolCall(io: SocketIOServer | null, executionId: string, agentName: string, tools: string[]) {
  emit(io, 'agent.tool.called', {
    executionId,
    agentId: agentName,
    agentName,
    tools,
    timestamp: now(),
  });
}

function buildParallelState(base: CerefyGraphState): CerefyGraphState {
  return {
    ...base,
    history: [...base.history],
    output: { ...base.output },
    errors: [...base.errors],
  };
}

export async function runCerefyAIPipeline(input: CerefyExecutionInput, io: SocketIOServer | null): Promise<RunExecutionResult> {
  await ensureCoreAgentsRegistered();

  const execution = await createAgentExecutionRecord(input);
  const executionId = String(execution.id);
  const supervisorState = createInitialExecutionState({
    ...input,
    metadata: { ...(input.metadata || {}), executionId },
  });
  const supervisorPlan = supervisorAgent(supervisorState);

  const basePayload = {
    executionId,
    tenantId: input.tenantId,
    projectId: input.projectId || '',
    documentId: input.documentId || '',
    type: input.type,
  };

  emit(io, 'agent.execution.started', {
    ...basePayload,
    status: 'running',
    timestamp: now(),
  });

  emitAgentLifecycle(io, executionId, 'supervisor', 'started', {
    status: 'running',
    stepIndex: 1,
    totalSteps: 4,
    plan: supervisorPlan,
  });

  await appendAgentExecutionEvent(executionId, {
    event: 'agent.execution.started',
    payload: basePayload,
    timestamp: now(),
  });

  await updateAgentExecutionRecord(executionId, {
    currentAgent: 'supervisor',
    status: 'RUNNING',
    confidence: 0,
  });

  await recordAgentExecution('supervisor', {
    executionId,
    status: 'STARTED',
    plan: supervisorPlan,
  });

  try {
    const initialState = createInitialExecutionState({
      ...input,
      metadata: { ...(input.metadata || {}), executionId },
    });

    const parallelState = buildParallelState({
      ...initialState,
      nextAgent: 'parallel',
      summary: `Parallel execution planned by supervisor: ${supervisorPlan}`,
      output: {
        plan: supervisorPlan,
      },
      history: [
        ...initialState.history,
        { agent: 'supervisor', nextAgent: supervisorPlan, plan: supervisorPlan },
      ],
    });

    emitAgentLifecycle(io, executionId, 'supervisor', 'completed', {
      stepIndex: 1,
      totalSteps: 4,
      output: { plan: supervisorPlan },
    });
    await appendAgentExecutionEvent(executionId, {
      event: 'agent.completed',
      payload: { agent: 'supervisor', plan: supervisorPlan },
      timestamp: now(),
    });
    await recordAgentExecution('supervisor', {
      executionId,
      status: 'COMPLETED',
      plan: supervisorPlan,
    });

    emitAgentLifecycle(io, executionId, 'memory', 'started', { stepIndex: 2, totalSteps: 4 });
    emitAgentLifecycle(io, executionId, 'discovery', 'started', { stepIndex: 2, totalSteps: 4 });
    emitAgentLifecycle(io, executionId, 'analyst', 'started', { stepIndex: 2, totalSteps: 4 });

    emitToolCall(io, executionId, 'memory', ['vectorMemory', 'knowledgeGraph']);
    emitToolCall(io, executionId, 'discovery', ['documentTool', 'vectorMemory', 'knowledgeGraph']);
    emitToolCall(io, executionId, 'analyst', ['reasoningPrompt', 'recommendationSynthesis']);

    const [memoryResult, discoveryResult, analystResult] = await Promise.all([
      memoryAgent(parallelState),
      discoveryAgent(parallelState),
      analystAgent(parallelState),
    ]);

    emitAgentLifecycle(io, executionId, 'memory', 'progress', {
      stepIndex: 2,
      totalSteps: 4,
      output: memoryResult.output,
    });
    emitAgentLifecycle(io, executionId, 'discovery', 'progress', {
      stepIndex: 2,
      totalSteps: 4,
      confidence: discoveryResult.confidence,
      output: discoveryResult.output,
    });
    emitAgentLifecycle(io, executionId, 'analyst', 'progress', {
      stepIndex: 2,
      totalSteps: 4,
      confidence: analystResult.confidence,
      output: analystResult.output,
    });

    emitAgentLifecycle(io, executionId, 'memory', 'completed', {
      stepIndex: 2,
      totalSteps: 4,
      output: memoryResult.output,
    });
    emitAgentLifecycle(io, executionId, 'discovery', 'completed', {
      stepIndex: 2,
      totalSteps: 4,
      confidence: discoveryResult.confidence,
      output: discoveryResult.output,
    });
    emitAgentLifecycle(io, executionId, 'analyst', 'completed', {
      stepIndex: 2,
      totalSteps: 4,
      confidence: analystResult.confidence,
      output: analystResult.output,
    });

    await recordAgentExecution('memory', {
      executionId,
      status: 'COMPLETED',
      confidence: 55,
      output: memoryResult.output,
    });
    await recordAgentExecution('discovery', {
      executionId,
      status: 'COMPLETED',
      confidence: discoveryResult.confidence,
      output: discoveryResult.output,
    });
    await recordAgentExecution('analyst', {
      executionId,
      status: 'COMPLETED',
      confidence: analystResult.confidence,
      output: analystResult.output,
    });

    const mergedOutput = {
      plan: supervisorPlan,
      memory: memoryResult.output?.memory ?? memoryResult.output,
      discovery: discoveryResult.output?.discovery ?? discoveryResult.output,
      analysis: analystResult.output?.analysis ?? analystResult.output,
    };

    const governanceState = buildParallelState({
      ...parallelState,
      documents: discoveryResult.documents || parallelState.documents,
      requirements: analystResult.requirements || parallelState.requirements,
      decisions: analystResult.decisions || parallelState.decisions,
      confidence: Math.max(memoryResult.output ? 55 : 0, discoveryResult.confidence || 0, analystResult.confidence || 0),
      nextAgent: 'governance',
      discoveryComplete: true,
      analystComplete: true,
      output: mergedOutput,
      history: [
        ...parallelState.history,
        ...memoryResult.history.slice(-1),
        ...discoveryResult.history.slice(-1),
        ...analystResult.history.slice(-1),
      ],
    });

    emitAgentLifecycle(io, executionId, 'governance', 'started', { stepIndex: 3, totalSteps: 4 });
    emitAgentLifecycle(io, executionId, 'governance', 'progress', {
      stepIndex: 3,
      totalSteps: 4,
      output: mergedOutput,
    });
    emitToolCall(io, executionId, 'governance', ['enterpriseRules', 'riskScoring', 'approvalPolicy']);

    const finalState = await governanceAgent(governanceState);
    const output = finalState.output || mergedOutput;
    const confidence = finalState.confidence || governanceState.confidence || 0;

    await updateAgentExecutionRecord(executionId, {
      status: finalState.governanceComplete ? 'COMPLETED' : 'RUNNING',
      currentAgent: finalState.nextAgent || 'complete',
      confidence,
      output,
      errors: finalState.errors || [],
      completedAt: finalState.governanceComplete ? new Date() : null,
    });

    await appendAgentExecutionEvent(executionId, {
      event: 'workflow.completed',
      payload: { output, confidence, status: 'COMPLETED' },
      timestamp: now(),
    });

    emitAgentLifecycle(io, executionId, 'governance', 'completed', {
      stepIndex: 4,
      totalSteps: 4,
      confidence,
      output: finalState.output,
    });

    emit(io, 'workflow.completed', {
      ...basePayload,
      status: 'completed',
      confidence,
      output,
      timestamp: now(),
    });

    await recordAgentExecution('governance', {
      executionId,
      status: 'COMPLETED',
      confidence,
      output,
    });

    return {
      executionId,
      status: 'COMPLETED',
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
    emit(io, 'workflow.completed', {
      ...basePayload,
      status: 'failed',
      error: message,
      timestamp: now(),
    });

    await appendAgentExecutionEvent(executionId, {
      event: 'agent.failed',
      payload: { error: message },
      timestamp: now(),
    });

    await recordAgentExecution('supervisor', {
      executionId,
      status: 'FAILED',
      error: message,
    });

    return {
      executionId,
      status: 'FAILED',
    };
  }
}
