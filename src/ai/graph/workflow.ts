import { END, START, StateGraph } from '@langchain/langgraph';
import { discoveryAgent } from '../agents/discovery.agent';
import { analystAgent } from '../agents/analyst.agent';
import { governanceAgent } from '../agents/governance.agent';
import { supervisorAgent } from './supervisor';
import { CerefyStateAnnotation, type CerefyExecutionInput, type CerefyGraphState } from './state';

function routeFromSupervisor(state: CerefyGraphState) {
  if (state.documents.length > 0 || state.type === 'document_analysis' || state.type === 'discovery') {
    return 'discovery';
  }
  if (state.requirements.length > 0 || state.type === 'requirements_analysis') {
    return 'analyst';
  }
  return 'governance';
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
      const nextAgent = supervisorAgent(state);
      return {
        nextAgent,
        history: [...state.history, { agent: 'supervisor', nextAgent }],
      };
    })
    .addNode('discovery', discoveryAgent)
    .addNode('analyst', analystAgent)
    .addNode('governance', governanceAgent)
    .addEdge(START, 'supervisor')
    .addConditionalEdges('supervisor', routeFromSupervisor)
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
