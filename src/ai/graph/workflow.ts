import { END, START, StateGraph } from '@langchain/langgraph';
import { discoveryAgent } from '../agents/discovery.agent';
import { analystAgent } from '../agents/analyst.agent';
import { governanceAgent } from '../agents/governance.agent';
import { memoryAgent } from '../agents/memory.agent';
import { supervisorAgent } from './supervisor';
import { CerefyStateAnnotation, type CerefyExecutionInput, type CerefyGraphState } from './state';

function shouldUseMemory(state: CerefyGraphState) {
  return state.documents.length > 0
    || state.requirements.length > 0
    || state.decisions.length > 0
    || state.type === 'document_analysis'
    || state.type === 'discovery'
    || state.type === 'requirements_analysis';
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
  if (state.requirements.length > 0 || state.type === 'requirements_analysis') {
    return 'analyst';
  }
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
    .addNode('analyst', analystAgent)
    .addNode('governance', governanceAgent)
    .addEdge(START, 'supervisor')
    .addConditionalEdges('supervisor', routeFromSupervisor)
    .addConditionalEdges('memory', routeAfterMemory)
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
    analystComplete: false,
    governanceComplete: false,
    summary: '',
    output: {},
    errors: [],
    input: input as unknown as Record<string, unknown>,
    metadata: input.metadata || {},
  };
}
