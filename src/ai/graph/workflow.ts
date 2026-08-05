import { END, START, StateGraph } from '@langchain/langgraph';
import { analystAgent } from '../agents/analyst.agent';
import { codeAgent } from '../agents/code.agent';
import { dataAgent } from '../agents/data.agent';
import { discoveryAgent } from '../agents/discovery.agent';
import { governanceAgent } from '../agents/governance.agent';
import { memoryAgent } from '../agents/memory.agent';
import { processAgent } from '../agents/process.agent';
import { requirementAgent } from '../agents/requirement.agent';
import { validationAgent } from '../agents/validation.agent';
import { supervisorAgent } from './supervisor';
import { CerefyStateAnnotation, type CerefyExecutionInput, type CerefyGraphState } from './state';

function isRequirementPath(state: CerefyGraphState) {
  return state.type === 'requirements_analysis' || state.type === 'requirement_analysis';
}

function isProcessPath(state: CerefyGraphState) {
  return state.type === 'process_analysis' || state.type === 'workflow_analysis';
}

function isDataPath(state: CerefyGraphState) {
  return state.type === 'data_analysis' || state.type === 'analytics';
}

function isCodePath(state: CerefyGraphState) {
  return state.type === 'code_generation' || state.type === 'implementation';
}

function isValidationPath(state: CerefyGraphState) {
  return state.type === 'validation' || state.type === 'validation_review';
}

function shouldUseMemory(state: CerefyGraphState) {
  return state.documents.length > 0
    || state.requirements.length > 0
    || state.decisions.length > 0
    || state.type === 'document_analysis'
    || state.type === 'discovery'
    || isRequirementPath(state)
    || isProcessPath(state)
    || isDataPath(state)
    || isCodePath(state)
    || isValidationPath(state);
}

function routeFromSupervisor(state: CerefyGraphState) {
  if (shouldUseMemory(state)) {
    return 'memory';
  }
  return supervisorAgent(state);
}

function routeAfterMemory(state: CerefyGraphState) {
  if (state.documents.length > 0 || state.type === 'document_analysis' || state.type === 'discovery') {
    return 'discovery';
  }
  if (isRequirementPath(state)) {
    return 'requirement';
  }
  if (isProcessPath(state)) {
    return 'process';
  }
  if (isDataPath(state)) {
    return 'data';
  }
  if (isCodePath(state)) {
    return 'code';
  }
  if (isValidationPath(state)) {
    return 'validation';
  }
  if (state.requirements.length > 0 || state.type === 'requirements_analysis') {
    return 'analyst';
  }
  return state.governanceComplete ? END : 'governance';
}

function routeAfterRequirement(state: CerefyGraphState) {
  if (isProcessPath(state)) {
    return 'process';
  }
  if (isDataPath(state)) {
    return 'data';
  }
  return state.requirements.length > 0 ? 'analyst' : 'governance';
}

function routeAfterProcess(state: CerefyGraphState) {
  if (isDataPath(state)) {
    return 'data';
  }
  return state.requirements.length > 0 ? 'analyst' : 'governance';
}

function routeAfterData(state: CerefyGraphState) {
  return state.requirements.length > 0 ? 'analyst' : 'governance';
}

function routeAfterCode(state: CerefyGraphState) {
  return isValidationPath(state) ? 'validation' : 'governance';
}

function routeAfterValidation(state: CerefyGraphState) {
  return state.governanceComplete ? END : 'governance';
}

function routeAfterDiscovery(state: CerefyGraphState) {
  if (!state.analystComplete) {
    return 'analyst';
  }
  return state.governanceComplete ? END : 'governance';
}

function routeAfterAnalyst(state: CerefyGraphState) {
  return state.governanceComplete ? END : 'governance';
}

export function buildCerefyWorkflow() {
  const workflow = new StateGraph(CerefyStateAnnotation)
    .addNode('supervisor', async (state: CerefyGraphState) => {
      const nextAgent = shouldUseMemory(state) ? 'memory' : supervisorAgent(state);
      return {
        nextAgent,
        history: [...state.history, { agent: 'supervisor', nextAgent }],
      };
    })
    .addNode('memory', memoryAgent)
    .addNode('discovery', discoveryAgent)
    .addNode('requirement', requirementAgent)
    .addNode('process', processAgent)
    .addNode('data', dataAgent)
    .addNode('code', codeAgent)
    .addNode('validation', validationAgent)
    .addNode('analyst', analystAgent)
    .addNode('governance', governanceAgent)
    .addEdge(START, 'supervisor')
    .addConditionalEdges('supervisor', routeFromSupervisor)
    .addConditionalEdges('memory', routeAfterMemory)
    .addConditionalEdges('requirement', routeAfterRequirement)
    .addConditionalEdges('process', routeAfterProcess)
    .addConditionalEdges('data', routeAfterData)
    .addConditionalEdges('code', routeAfterCode)
    .addConditionalEdges('validation', routeAfterValidation)
    .addConditionalEdges('discovery', routeAfterDiscovery)
    .addConditionalEdges('analyst', routeAfterAnalyst)
    .addEdge('governance', END);

  return workflow.compile();
}

export function createInitialExecutionState(input: CerefyExecutionInput): CerefyGraphState {
  return {
    executionId: (input.metadata?.executionId as string) || '',
    tenantId: input.tenantId,
    projectId: input.projectId || '',
    documentId: input.documentId || '',
    type: input.type,
    documents: input.documents || [],
    requirements: input.requirements || [],
    decisions: input.decisions || [],
    confidence: 0,
    nextAgent: 'supervisor',
    history: [],
    memoryComplete: false,
    discoveryComplete: false,
    requirementComplete: false,
    processComplete: false,
    dataComplete: false,
    codeComplete: false,
    validationComplete: false,
    analystComplete: false,
    governanceComplete: false,
    summary: '',
    output: {},
    errors: [],
    input: input as unknown as Record<string, unknown>,
    metadata: input.metadata || {},
  };
}
