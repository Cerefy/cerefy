import type { Server as SocketIOServer } from 'socket.io';
import { createInitialExecutionState } from './graph/workflow';
import type { CerefyExecutionInput, CerefyGraphState } from './graph/state';
import { discoveryAgent } from './agents/discovery.agent';
import { requirementAgent } from './agents/requirement.agent';
import { processAnalysisAgent } from './agents/processAnalysis.agent';
import { dataIntelligenceAgent } from './agents/dataIntelligence.agent';
import { codeGenerationAgent } from './agents/codeGeneration.agent';
import { analystAgent } from './agents/analyst.agent';
import { validationAgent } from './agents/validation.agent';
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

function mergeOutputs(results: Record<string, any>, supervisorPlan: string) {
  return {
    plan: supervisorPlan,
    memory: results.memory.output?.memory ?? results.memory.output,
    discovery: results.discovery.output?.discovery ?? results.discovery.output,
    requirements: results.requirement.output?.requirements ?? results.requirement.output,
    processAnalysis: results.processAnalysis.output?.processAnalysis ?? results.processAnalysis.output,
    dataIntelligence: results.dataIntelligence.output?.dataIntelligence ?? results.dataIntelligence.output,
    codeGeneration: results.codeGeneration.output?.codeGeneration ?? results.codeGeneration.output,
    analysis: results.analyst.output?.analysis ?? results.analyst.output,
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
      output: { plan: supervisorPlan },
      history: [...initialState.history, { agent: 'supervisor', nextAgent: supervisorPlan, plan: supervisorPlan }],
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
    emitAgentLifecycle(io, executionId, 'requirement', 'started', { stepIndex: 2, totalSteps: 4 });
    emitAgentLifecycle(io, executionId, 'processAnalysis', 'started', { stepIndex: 2, totalSteps: 4 });
    emitAgentLifecycle(io, executionId, 'dataIntelligence', 'started', { stepIndex: 2, totalSteps: 4 });
    emitAgentLifecycle(io, executionId, 'codeGeneration', 'started', { stepIndex: 2, totalSteps: 4 });
    emitAgentLifecycle(io, executionId, 'analyst', 'started', { stepIndex: 2, totalSteps: 4 });

    emitToolCall(io, executionId, 'memory', ['vectorMemory', 'knowledgeGraph']);
    emitToolCall(io, executionId, 'discovery', ['documentTool', 'vectorMemory', 'knowledgeGraph']);
    emitToolCall(io, executionId, 'requirement', ['requirementSynthesis', 'traceabilityModel']);
    emitToolCall(io, executionId, 'processAnalysis', ['processDiscovery', 'dependencyMapping']);
    emitToolCall(io, executionId, 'dataIntelligence', ['signalExtraction', 'contextScoring']);
    emitToolCall(io, executionId, 'codeGeneration', ['implementationGuidance', 'contractDrafting']);
    emitToolCall(io, executionId, 'analyst', ['reasoningPrompt', 'recommendationSynthesis']);

    const [memoryResult, discoveryResult, requirementResult, processAnalysisResult, dataIntelligenceResult, codeGenerationResult, analystResult] = await Promise.all([
      memoryAgent(parallelState),
      discoveryAgent(parallelState),
      requirementAgent(parallelState),
      processAnalysisAgent(parallelState),
      dataIntelligenceAgent(parallelState),
      codeGenerationAgent(parallelState),
      analystAgent(parallelState),
    ]);

    emitAgentLifecycle(io, executionId, 'memory', 'progress', { stepIndex: 2, totalSteps: 4, output: memoryResult.output });
    emitAgentLifecycle(io, executionId, 'discovery', 'progress', { stepIndex: 2, totalSteps: 4, confidence: discoveryResult.confidence, output: discoveryResult.output });
    emitAgentLifecycle(io, executionId, 'requirement', 'progress', { stepIndex: 2, totalSteps: 4, confidence: requirementResult.confidence, output: requirementResult.output });
    emitAgentLifecycle(io, executionId, 'processAnalysis', 'progress', { stepIndex: 2, totalSteps: 4, confidence: processAnalysisResult.confidence, output: processAnalysisResult.output });
    emitAgentLifecycle(io, executionId, 'dataIntelligence', 'progress', { stepIndex: 2, totalSteps: 4, confidence: dataIntelligenceResult.confidence, output: dataIntelligenceResult.output });
    emitAgentLifecycle(io, executionId, 'codeGeneration', 'progress', { stepIndex: 2, totalSteps: 4, confidence: codeGenerationResult.confidence, output: codeGenerationResult.output });
    emitAgentLifecycle(io, executionId, 'analyst', 'progress', { stepIndex: 2, totalSteps: 4, confidence: analystResult.confidence, output: analystResult.output });

    emitAgentLifecycle(io, executionId, 'memory', 'completed', { stepIndex: 2, totalSteps: 4, output: memoryResult.output });
    emitAgentLifecycle(io, executionId, 'discovery', 'completed', { stepIndex: 2, totalSteps: 4, confidence: discoveryResult.confidence, output: discoveryResult.output });
    emitAgentLifecycle(io, executionId, 'requirement', 'completed', { stepIndex: 2, totalSteps: 4, confidence: requirementResult.confidence, output: requirementResult.output });
    emitAgentLifecycle(io, executionId, 'processAnalysis', 'completed', { stepIndex: 2, totalSteps: 4, confidence: processAnalysisResult.confidence, output: processAnalysisResult.output });
    emitAgentLifecycle(io, executionId, 'dataIntelligence', 'completed', { stepIndex: 2, totalSteps: 4, confidence: dataIntelligenceResult.confidence, output: dataIntelligenceResult.output });
    emitAgentLifecycle(io, executionId, 'codeGeneration', 'completed', { stepIndex: 2, totalSteps: 4, confidence: codeGenerationResult.confidence, output: codeGenerationResult.output });
    emitAgentLifecycle(io, executionId, 'analyst', 'completed', { stepIndex: 2, totalSteps: 4, confidence: analystResult.confidence, output: analystResult.output });

    await Promise.all([
      recordAgentExecution('memory', { executionId, status: 'COMPLETED', confidence: 55, output: memoryResult.output }),
      recordAgentExecution('discovery', { executionId, status: 'COMPLETED', confidence: discoveryResult.confidence, output: discoveryResult.output }),
      recordAgentExecution('requirement', { executionId, status: 'COMPLETED', confidence: requirementResult.confidence, output: requirementResult.output }),
      recordAgentExecution('processAnalysis', { executionId, status: 'COMPLETED', confidence: processAnalysisResult.confidence, output: processAnalysisResult.output }),
      recordAgentExecution('dataIntelligence', { executionId, status: 'COMPLETED', confidence: dataIntelligenceResult.confidence, output: dataIntelligenceResult.output }),
      recordAgentExecution('codeGeneration', { executionId, status: 'COMPLETED', confidence: codeGenerationResult.confidence, output: codeGenerationResult.output }),
      recordAgentExecution('analyst', { executionId, status: 'COMPLETED', confidence: analystResult.confidence, output: analystResult.output }),
    ]);

    const mergedOutput = mergeOutputs(
      {
        memory: memoryResult,
        discovery: discoveryResult,
        requirement: requirementResult,
        processAnalysis: processAnalysisResult,
        dataIntelligence: dataIntelligenceResult,
        codeGeneration: codeGenerationResult,
        analyst: analystResult,
      },
      supervisorPlan,
    );

    const postParallelState = buildParallelState({
      ...parallelState,
      documents: discoveryResult.documents || parallelState.documents,
      requirements: requirementResult.requirements || analystResult.requirements || parallelState.requirements,
      decisions: analystResult.decisions || parallelState.decisions,
      confidence: Math.max(
        memoryResult.confidence || 0,
        discoveryResult.confidence || 0,
        requirementResult.confidence || 0,
        processAnalysisResult.confidence || 0,
        dataIntelligenceResult.confidence || 0,
        codeGenerationResult.confidence || 0,
        analystResult.confidence || 0,
      ),
      nextAgent: 'validation',
      discoveryComplete: true,
      analystComplete: true,
      output: mergedOutput,
      history: [
        ...parallelState.history,
        ...memoryResult.history.slice(-1),
        ...discoveryResult.history.slice(-1),
        ...requirementResult.history.slice(-1),
        ...processAnalysisResult.history.slice(-1),
        ...dataIntelligenceResult.history.slice(-1),
        ...codeGenerationResult.history.slice(-1),
        ...analystResult.history.slice(-1),
      ],
    });

    emitAgentLifecycle(io, executionId, 'validation', 'started', { stepIndex: 3, totalSteps: 4 });
    emitToolCall(io, executionId, 'validation', ['completenessCheck', 'schemaValidation']);

    const validationResult = await validationAgent(postParallelState);
    const validationOutput = validationResult.output?.validation ?? validationResult.output;

    emitAgentLifecycle(io, executionId, 'validation', 'progress', { stepIndex: 3, totalSteps: 4, output: validationOutput });
    emitAgentLifecycle(io, executionId, 'validation', 'completed', { stepIndex: 3, totalSteps: 4, output: validationOutput });

    await recordAgentExecution('validation', {
      executionId,
      status: 'COMPLETED',
      confidence: validationResult.confidence,
      output: validationResult.output,
    });

    const governanceState = buildParallelState({
      ...validationResult,
      nextAgent: 'governance',
      output: {
        ...validationResult.output,
        validation: validationOutput,
      },
      history: [...validationResult.history],
      confidence: validationResult.confidence || postParallelState.confidence,
    });

    emitAgentLifecycle(io, executionId, 'governance', 'started', { stepIndex: 4, totalSteps: 4 });
    emitToolCall(io, executionId, 'governance', ['enterpriseRules', 'riskScoring', 'approvalPolicy']);
    emitAgentLifecycle(io, executionId, 'governance', 'progress', { stepIndex: 4, totalSteps: 4, output: governanceState.output });

    const finalState = await governanceAgent(governanceState);
    const output = finalState.output || governanceState.output || mergedOutput;
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

    await Promise.all([
      recordAgentExecution('governance', { executionId, status: 'COMPLETED', confidence, output }),
      recordAgentExecution('validation', { executionId, status: 'COMPLETED', output: validationResult.output }),
    ]);

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
