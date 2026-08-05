import { Annotation, END, START, StateGraph } from '@langchain/langgraph';
import { discoveryAgent } from '../agents/discovery.agent';
import { analystAgent } from '../agents/analyst.agent';
import { governanceAgent } from '../agents/governance.agent';
import { supervisorAgent, shouldRunDiscovery, shouldRunAnalyst, shouldRunGovernance } from './supervisor';
import { CerefyStateAnnotation, type CerefyExecutionInput, type CerefyGraphState } from './state';

export function buildCerefyWorkflow() {
  const workflow = new StateGraph(CerefyStateAnnotation)
    .addNode('supervisor', async (state: CerefyGraphState) => ({
      nextAgent: supervisorAgent(state),
      history: [...state.history, { agent: 'supervisor', nextAgent: supervisorAgent(state) }],
    }))
    .addNode('discovery', discoveryAgent)
    .addNode('analyst', analystAgent)
    .addNode('governance', governanceAgent)
    .addEdge(START, 'supervisor')
    .addConditionalEdges('supervisor', (state) => {
      if (shouldRunDiscovery(state)) return 'discovery';
      if (shouldRunAnalyst(state)) return 'analyst';
      if (shouldRunGovernance(state)) return 'governance';
      return END;
    })
    .addConditionalEdges('discovery', (state) => {
      if (shouldRunAnalyst(state)) return 'analyst';
      if (shouldRunGovernance(state)) return 'governance';
      return END;
    })
    .addConditionalEdges('analyst', (state) => {
      if (shouldRunGovernance(state)) return 'governance';
      return END;
    })
    .addEdge('governance', END);

  return workflow.compile();
}

export function createInitialExecutionState(input: CerefyExecutionInput): CerefyGraphState {
  return {
    executionId: input.metadata?.executionId as string || '',
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
