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
import { mergeProvenance, type AgentProvenance } from './llm';

export interface RunExecutionResult {
  executionId: string;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED';
  output?: Record<string, unknown>;
  confidence?: number;
}

function now() {
  return new Date().toISOString();
}

function emit(io: SocketIOServer | null, tenantId: string, event: string, payload: Record<string, unknown>) {
  // Tenant-scoped broadcast only — never io.emit() globally (audit RLS #10:
  // a cross-tenant io.emit would leak one tenant's execution to every socket).
  io?.to(`tenant:${tenantId}`).emit(event, payload);
  const executionId = typeof payload.executionId === 'string' ? payload.executionId : null;
  if (executionId) {
    io?.to(`execution:${executionId}`).emit(event, payload);
  }
}

function emitAgentLifecycle(io: SocketIOServer | null, tenantId: string, executionId: string, agentName: string, status: string, payload: Record<string, unknown> = {}) {
  emit(io, tenantId, `agent.${status}`, {
    executionId,
    agentId: agentName,
    agentName,
    status,
    timestamp: now(),
    ...payload,
  });
}

function emitToolCall(io: SocketIOServer | null, tenantId: string, executionId: string, agentName: string, tools: string[]) {
  emit(io, tenantId, 'agent.tool.called', {
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

  emit(io, input.tenantId, 'agent.execution.started', {
    ...basePayload,
    status: 'running',
    timestamp: now(),
  });

  emitAgentLifecycle(io, input.tenantId, executionId, 'supervisor', 'started', {
    status: 'running',
    stepIndex: 1,
    totalSteps: 4,
    plan: supervisorPlan,
  });

  await appendAgentExecutionEvent(input.tenantId, executionId, {
    event: 'agent.execution.started',
    payload: basePayload,
    timestamp: now(),
  });

  await updateAgentExecutionRecord(input.tenantId, executionId, {
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

    emitAgentLifecycle(io, input.tenantId, executionId, 'supervisor', 'completed', {
      stepIndex: 1,
      totalSteps: 4,
      output: { plan: supervisorPlan },
    });
await appendAgentExecutionEvent(input.tenantId, executionId, {
    event: 'agent.execution.agentStarted',
    payload: { ...basePayload, agent: 'memory' },
    timestamp: now(),
  });
    await recordAgentExecution('supervisor', {
      executionId,
      status: 'COMPLETED',
      plan: supervisorPlan,
    });

    emitAgentLifecycle(io, input.tenantId, executionId, 'memory', 'started', { stepIndex: 2, totalSteps: 4 });
    emitAgentLifecycle(io, input.tenantId, executionId, 'discovery', 'started', { stepIndex: 2, totalSteps: 4 });
    emitAgentLifecycle(io, input.tenantId, executionId, 'analyst', 'started', { stepIndex: 2, totalSteps: 4 });

    emitToolCall(io, input.tenantId, executionId, 'memory', ['vectorMemory', 'knowledgeGraph']);
    emitToolCall(io, input.tenantId, executionId, 'discovery', ['documentTool', 'vectorMemory', 'knowledgeGraph']);
    emitToolCall(io, input.tenantId, executionId, 'analyst', ['reasoningPrompt', 'recommendationSynthesis']);

    const [memoryResult, discoveryResult, analystResult] = await Promise.all([
      memoryAgent(parallelState),
      discoveryAgent(parallelState),
      analystAgent(parallelState),
    ]);

    const memoryProvenance: AgentProvenance | undefined = (memoryResult.output as any)?._provenance;
    const discoveryProvenance: AgentProvenance | undefined = (discoveryResult.output as any)?._provenance;
    const analystProvenance: AgentProvenance | undefined = (analystResult.output as any)?._provenance;
    const stageProvenance = mergeProvenance(memoryProvenance, discoveryProvenance, analystProvenance);

    emitAgentLifecycle(io, input.tenantId, executionId, 'memory', 'progress', {
      stepIndex: 2,
      totalSteps: 4,
      output: memoryResult.output,
    });
    emitAgentLifecycle(io, input.tenantId, executionId, 'discovery', 'progress', {
      stepIndex: 2,
      totalSteps: 4,
      confidence: discoveryResult.confidence,
      output: discoveryResult.output,
    });
    emitAgentLifecycle(io, input.tenantId, executionId, 'analyst', 'progress', {
      stepIndex: 2,
      totalSteps: 4,
      confidence: analystResult.confidence,
      output: analystResult.output,
    });

    emitAgentLifecycle(io, input.tenantId, executionId, 'memory', 'completed', {
      stepIndex: 2,
      totalSteps: 4,
      output: memoryResult.output,
    });
    emitAgentLifecycle(io, input.tenantId, executionId, 'discovery', 'completed', {
      stepIndex: 2,
      totalSteps: 4,
      confidence: discoveryResult.confidence,
      output: discoveryResult.output,
    });
    emitAgentLifecycle(io, input.tenantId, executionId, 'analyst', 'completed', {
      stepIndex: 2,
      totalSteps: 4,
      confidence: analystResult.confidence,
      output: analystResult.output,
    });

    await recordAgentExecution('memory', {
      executionId,
      status: 'COMPLETED',
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
      sources: Array.isArray((memoryResult.output as any)?._sources) ? (memoryResult.output as any)._sources : [],
      provenance: stageProvenance,
      evidenceConfidence: Number((discoveryResult.output as any)?._evidenceConfidence ?? 0),
    };

    const governanceState = buildParallelState({
      ...parallelState,
      documents: discoveryResult.documents || parallelState.documents,
      requirements: analystResult.requirements || parallelState.requirements,
      decisions: (analystResult as any).decisions || parallelState.decisions,
      confidence: mergedOutput.evidenceConfidence,
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
    } as CerefyGraphState);

    emitAgentLifecycle(io, input.tenantId, executionId, 'governance', 'started', { stepIndex: 3, totalSteps: 4 });
    emitAgentLifecycle(io, input.tenantId, executionId, 'governance', 'progress', {
      stepIndex: 3,
      totalSteps: 4,
      output: mergedOutput,
    });
    emitToolCall(io, input.tenantId, executionId, 'governance', ['enterpriseRules', 'riskScoring', 'approvalPolicy']);

    const finalState = await governanceAgent(governanceState);
    const output = finalState.output || mergedOutput;
    const governanceProvenance: AgentProvenance | undefined = (finalState.output as any)?._provenance;
    const provenance = mergeProvenance(governanceProvenance, stageProvenance);
    const confidence = finalState.confidence || governanceState.confidence || 0;

    await updateAgentExecutionRecord(input.tenantId, executionId, {
      status: finalState.governanceComplete ? 'COMPLETED' : 'RUNNING',
      currentAgent: finalState.nextAgent || 'complete',
      confidence,
      output: { ...output, provenance },
      errors: (finalState as any).errors || [],
      completedAt: finalState.governanceComplete ? new Date() : null,
    });

    await appendAgentExecutionEvent(input.tenantId, executionId, {
      event: 'workflow.completed',
      payload: { output, confidence, status: 'COMPLETED' },
      timestamp: now(),
    });

    emitAgentLifecycle(io, input.tenantId, executionId, 'governance', 'completed', {
      stepIndex: 4,
      totalSteps: 4,
      confidence,
      output: finalState.output,
    });

    emit(io, input.tenantId, 'workflow.completed', {
      ...basePayload,
      status: 'completed',
      confidence,
      output: { ...output, provenance },
      timestamp: now(),
    });

    await recordAgentExecution('governance', {
      executionId,
      status: 'COMPLETED',
      confidence,
      output: { ...output, provenance },
    });

    return {
      executionId,
      status: 'COMPLETED',
      output: { ...output, provenance },
      confidence,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await appendAgentExecutionError(input.tenantId, executionId, message);
    await updateAgentExecutionRecord(input.tenantId, executionId, {
      status: 'FAILED',
      currentAgent: 'supervisor',
      errors: [message],
      completedAt: null,
    });

    emit(io, input.tenantId, 'agent.failed', {
      ...basePayload,
      agentId: 'supervisor',
      agentName: 'Supervisor',
      status: 'failed',
      error: message,
      timestamp: now(),
    });
    emit(io, input.tenantId, 'workflow.completed', {
      ...basePayload,
      status: 'failed',
      error: message,
      timestamp: now(),
    });

    await appendAgentExecutionEvent(input.tenantId, executionId, {
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
