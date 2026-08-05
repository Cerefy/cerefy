import type { CerefyGraphState } from '../graph/state';
import { loadKnowledgeGraphContext } from '../memory/knowledgeGraph';
import { loadVectorMemoryContext } from '../memory/vectorMemory';
import { appendAgentExecutionEvent, updateAgentExecutionRecord } from '../tools/databaseTool';

export async function memoryAgent(state: CerefyGraphState) {
  const [vectorMemory, graphMemory] = await Promise.all([
    loadVectorMemoryContext({ tenantId: state.tenantId, documentId: state.documentId }),
    loadKnowledgeGraphContext({ tenantId: state.tenantId, projectId: state.projectId }),
  ]);

  const memoryContext = {
    documentSummary: vectorMemory.documentSummary,
    chunkSnippets: vectorMemory.chunkSnippets,
    decisionHistory: vectorMemory.decisionHistory,
    executionSummaries: vectorMemory.executionSummaries,
    graphSummary: graphMemory.summary,
    graphTriples: graphMemory.triples,
  };

  const nextState = {
    ...state,
    nextAgent: 'discovery',
    memoryComplete: true,
    confidence: Math.max(state.confidence, 58),
    summary: `Memory retrieval completed for ${state.type}`,
    output: {
      ...state.output,
      memory: memoryContext,
    },
    history: [...state.history, { agent: 'memory', output: memoryContext }],
  };

  if (state.executionId) {
    await appendAgentExecutionEvent(state.executionId, {
      event: 'agent.tool.called',
      payload: {
        agent: 'memory',
        tools: ['vectorMemory', 'knowledgeGraph'],
        output: memoryContext,
      },
      timestamp: new Date().toISOString(),
    });

    await updateAgentExecutionRecord(state.executionId, {
      currentAgent: 'memory',
      confidence: nextState.confidence,
      output: nextState.output,
    });
  }

  return nextState;
}
