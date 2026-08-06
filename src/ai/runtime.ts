import type { Server as SocketIOServer } from 'socket.io';
import { createInitialExecutionState } from './graph/workflow';
import type { CerefyExecutionInput, CerefyGraphState } from './graph/state';
import { analystAgent } from './agents/analyst.agent';
import { codeAgent } from './agents/code.agent';
import { dataAgent } from './agents/data.agent';
import { discoveryAgent } from './agents/discovery.agent';
import { governanceAgent } from './agents/governance.agent';
import { memoryAgent } from './agents/memory.agent';
import { processAgent } from './agents/process.agent';
import { requirementAgent } from './agents/requirement.agent';
import { validationAgent } from './agents/validation.agent';
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

function buildTraceRecord(params: {
  executionId: string;
  agentName: string;
  task: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  startedAt: number;
  errors?: string[];
  qualityScore?: number;
}) {
  const latencyMs = Math.max(0, Date.now() - params.startedAt);
  return {
    trace_id: `trace_${params.executionId}_${params.agentName}_${params.task}_${Date.now()}`,
    agent_name: params.agentName,
    task: params.task,
    input: params.input,
    output: params.output,
    latency_ms: latencyMs,
    errors: params.errors ?? [],
    quality_score: params.qualityScore ?? 0,
    timestamp: now(),
  };
}

async function persistTrace(
  io: SocketIOServer | null,
  executionId: string,
  agentName: string,
  task: string,
  input: Record<string, unknown>,
  output: Record<string, unknown>,
  startedAt: number,
  qualityScore = 0,
  errors: string[] = [],
) {
  const trace = buildTraceRecord({
    executionId,
    agentName,
    task,
    input,
    output,
    startedAt,
    errors,
    qualityScore,
  });

  emit(io, 'agent.trace', { executionId, ...trace });

  await appendAgentExecutionEvent(executionId, {
    event: 'agent.trace',
    payload: trace,
    timestamp: now(),
  });

  await recordAgentExecution(agentName, trace);
  return trace;
}

function buildParallelState(base: CerefyGraphState): CerefyGraphState {
  return {
    ...base,
    history: [...base.history],
    output: { ...base.output },
    errors: [...base.errors],
  };
}

function isRequirementType(type: string) {
  return type === 'requirements_analysis' || type === 'requirement_analysis';
}

function isProcessType(type: string) {
  return type === 'process_analysis' || type === 'workflow_analysis';
}

function isDataType(type: string) {
  return type === 'data_analysis' || type === 'analytics';
}

function isCodeType(type: string) {
  return type === 'code_generation' || type === 'implementation';
}

function isValidationType(type: string) {
  return type === 'validation' || type === 'validation_review';
}

function shouldUseMemory(input: CerefyExecutionInput, state: CerefyGraphState) {
  return state.documents.length > 0
    || state.requirements.length > 0
    || state.decisions.length > 0
    || input.type === 'document_analysis'
    || input.type === 'discovery'
    || isRequirementType(input.type)
    || isProcessType(input.type)
    || isDataType(input.type)
    || isCodeType(input.type)
    || isValidationType(input.type);
}

async function runStage(params: {
  io: SocketIOServer | null;
  executionId: string;
  agentName: string;
  stepIndex: number;
  totalSteps: number;
  task: string;
  inputState: CerefyGraphState;
  inputPayload: Record<string, unknown>;
  stageFn: (state: CerefyGraphState) => Promise<CerefyGraphState>;
  tools?: string[];
}) {
  const startedAt = Date.now();
  emitAgentLifecycle(params.io, params.executionId, params.agentName, 'started', {
    stepIndex: params.stepIndex,
    totalSteps: params.totalSteps,
  });
  if (params.tools?.length) {
    emitToolCall(params.io, params.executionId, params.agentName, params.tools);
  }

  try {
    const result = await params.stageFn(params.inputState);
    emitAgentLifecycle(params.io, params.executionId, params.agentName, 'progress', {
      stepIndex: params.stepIndex,
      totalSteps: params.totalSteps,
      output: result.output,
      confidence: result.confidence,
    });
    emitAgentLifecycle(params.io, params.executionId, params.agentName, 'completed', {
      stepIndex: params.stepIndex,
      totalSteps: params.totalSteps,
      output: result.output,
      confidence: result.confidence,
    });

    await persistTrace(
      params.io,
      params.executionId,
      params.agentName,
      params.task,
      params.inputPayload,
      (result.output || {}) as Record<string, unknown>,
      startedAt,
      result.confidence || 0,
    );

    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    emitAgentLifecycle(params.io, params.executionId, params.agentName, 'failed', {
      stepIndex: params.stepIndex,
      totalSteps: params.totalSteps,
      error: message,
    });
    await appendAgentExecutionError(params.executionId, message);
    await appendAgentExecutionEvent(params.executionId, {
      event: 'agent.failed',
      payload: { agent: params.agentName, error: message },
      timestamp: now(),
    });
    await updateAgentExecutionRecord(params.executionId, {
      status: 'FAILED',
      currentAgent: params.agentName,
      errors: [message],
      completedAt: null,
    });
    await persistTrace(
      params.io,
      params.executionId,
      params.agentName,
      `${params.task}-failed`,
      params.inputPayload,
      { error: message },
      startedAt,
      0,
      [message],
    );
    throw error;
  }
}

export async function runCerefyAIPipeline(input: CerefyExecutionInput, io: SocketIOServer | null): Promise<RunExecutionResult> {
  await ensureCoreAgentsRegistered();

  const execution = await createAgentExecutionRecord(input);
  const executionId = String(execution.id);
  const orchestrationStartedAt = Date.now();
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
    totalSteps: 10,
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
    let currentState = buildParallelState({
      ...supervisorState,
      nextAgent: 'parallel',
      summary: `Parallel execution planned by supervisor: ${supervisorPlan}`,
      output: {
        plan: supervisorPlan,
      },
      history: [
        ...supervisorState.history,
        { agent: 'supervisor', nextAgent: supervisorPlan, plan: supervisorPlan },
      ],
    });

    emitAgentLifecycle(io, executionId, 'supervisor', 'completed', {
      stepIndex: 1,
      totalSteps: 10,
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
    await persistTrace(
      io,
      executionId,
      'supervisor',
      'routing',
      {
        type: input.type,
        tenantId: input.tenantId,
        projectId: input.projectId || '',
        documentId: input.documentId || '',
      },
      { plan: supervisorPlan },
      orchestrationStartedAt,
      60,
    );

    if (shouldUseMemory(input, currentState)) {
      currentState = await runStage({
        io,
        executionId,
        agentName: 'memory',
        stepIndex: 2,
        totalSteps: 10,
        task: 'enterprise-memory-retrieval',
        inputState: currentState,
        inputPayload: {
          tenantId: input.tenantId,
          projectId: input.projectId || '',
          documentId: input.documentId || '',
          type: input.type,
        },
        stageFn: memoryAgent,
        tools: ['vectorMemory', 'knowledgeGraph'],
      });
    }

    if (input.documents?.length || input.type === 'document_analysis' || input.type === 'discovery') {
      currentState = await runStage({
        io,
        executionId,
        agentName: 'discovery',
        stepIndex: 3,
        totalSteps: 10,
        task: 'context-discovery',
        inputState: currentState,
        inputPayload: {
          tenantId: input.tenantId,
          projectId: input.projectId || '',
          documentId: input.documentId || '',
          type: input.type,
        },
        stageFn: discoveryAgent,
        tools: ['documentTool', 'vectorMemory', 'knowledgeGraph'],
      });
    }

  if (isRequirementType(input.type)) {
      currentState = await runStage({
        io,
        executionId,
        agentName: 'requirement',
        stepIndex: 4,
        totalSteps: 10,
        task: 'requirement-synthesis',
        inputState: currentState,
        inputPayload: {
          tenantId: input.tenantId,
          projectId: input.projectId || '',
          documentId: input.documentId || '',
          type: input.type,
        },
        stageFn: requirementAgent,
        tools: ['discoveryContext', 'memoryContext'],
      });
    }

    if (isProcessType(input.type)) {
      currentState = await runStage({
        io,
        executionId,
        agentName: 'process',
        stepIndex: 5,
        totalSteps: 10,
        task: 'process-intelligence',
        inputState: currentState,
        inputPayload: {
          tenantId: input.tenantId,
          projectId: input.projectId || '',
          documentId: input.documentId || '',
          type: input.type,
        },
        stageFn: processAgent,
        tools: ['workflow-analysis', 'optimization-rules'],
      });
    }

    if (isDataType(input.type)) {
      currentState = await runStage({
        io,
        executionId,
        agentName: 'data',
        stepIndex: 6,
        totalSteps: 10,
        task: 'data-intelligence',
        inputState: currentState,
        inputPayload: {
          tenantId: input.tenantId,
          projectId: input.projectId || '',
          documentId: input.documentId || '',
          type: input.type,
        },
        stageFn: dataAgent,
        tools: ['dataset-analysis', 'analytics-logic'],
      });
    }

    if (isCodeType(input.type)) {
      currentState = await runStage({
        io,
        executionId,
        agentName: 'code',
        stepIndex: 7,
        totalSteps: 10,
        task: 'code-generation',
        inputState: currentState,
        inputPayload: {
          tenantId: input.tenantId,
          projectId: input.projectId || '',
          documentId: input.documentId || '',
          type: input.type,
        },
        stageFn: codeAgent,
        tools: ['implementation-plan', 'test-generation'],
      });
    }

    if (isValidationType(input.type)) {
      currentState = await runStage({
        io,
        executionId,
        agentName: 'validation',
        stepIndex: 8,
        totalSteps: 10,
        task: 'validation',
        inputState: currentState,
        inputPayload: {
          tenantId: input.tenantId,
          projectId: input.projectId || '',
          documentId: input.documentId || '',
          type: input.type,
        },
        stageFn: validationAgent,
        tools: ['lint', 'typecheck', 'build', 'tests'],
      });
    }

    if (currentState.documents.length > 0 || currentState.requirements.length > 0 || input.type === 'requirements_analysis' || input.type === 'requirement_analysis' || input.type === 'document_analysis' || input.type === 'discovery') {
      currentState = await runStage({
        io,
        executionId,
        agentName: 'analyst',
        stepIndex: 9,
        totalSteps: 10,
        task: 'requirements-synthesis',
        inputState: currentState,
        inputPayload: {
          tenantId: input.tenantId,
          projectId: input.projectId || '',
          documentId: input.documentId || '',
          type: input.type,
        },
        stageFn: analystAgent,
        tools: ['reasoningPrompt', 'recommendationSynthesis'],
      });
    }

    const governanceStartedAt = Date.now();
    emitAgentLifecycle(io, executionId, 'governance', 'started', { stepIndex: 10, totalSteps: 10 });
    emitAgentLifecycle(io, executionId, 'governance', 'progress', {
      stepIndex: 10,
      totalSteps: 10,
      output: currentState.output,
    });
    emitToolCall(io, executionId, 'governance', ['enterpriseRules', 'riskScoring', 'approvalPolicy']);

  const finalState = await governanceAgent(currentState);
  const finalStateWithErrors = finalState as typeof finalState & { errors?: string[] };
  const output = finalState.output || currentState.output;
  const confidence = finalState.confidence || currentState.confidence || 0;

    await updateAgentExecutionRecord(executionId, {
      status: finalState.governanceComplete ? 'COMPLETED' : 'RUNNING',
      currentAgent: finalState.nextAgent || 'complete',
      confidence,
      output,
      errors: finalStateWithErrors.errors || [],
      completedAt: finalState.governanceComplete ? new Date() : null,
    });

    await appendAgentExecutionEvent(executionId, {
      event: 'workflow.completed',
      payload: { output, confidence, status: 'COMPLETED' },
      timestamp: now(),
    });

    emitAgentLifecycle(io, executionId, 'governance', 'completed', {
      stepIndex: 10,
      totalSteps: 10,
      confidence,
      output: finalState.output,
    });

    await persistTrace(
      io,
      executionId,
      'governance',
      'governance-review',
      {
        tenantId: input.tenantId,
        projectId: input.projectId || '',
        documentId: input.documentId || '',
        type: input.type,
        requirements: currentState.requirements,
        memoryComplete: currentState.memoryComplete,
      },
      (output || {}) as Record<string, unknown>,
      governanceStartedAt,
      confidence,
    );

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

    await persistTrace(
      io,
      executionId,
      'supervisor',
      'pipeline-failure',
      {
        tenantId: input.tenantId,
        projectId: input.projectId || '',
        documentId: input.documentId || '',
        type: input.type,
      },
      { error: message },
      orchestrationStartedAt,
      0,
      [message],
    );

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
