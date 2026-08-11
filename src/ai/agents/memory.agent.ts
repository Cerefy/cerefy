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
    graphSummary: graphMemory.summary,
    graphTriples: graphMemory.triples,
  };

  // Real retrieved sources (content + ids) that flow into the guardrail's
  // citation verification — audit BLOCKER-4: the answer path previously fed
  // `sources: []` so hallucination checks were unreachable.
  const sources = [
    ...vectorMemory.chunkSnippets.map((content, i) => ({ id: `chunk_${i}`, content })),
    ...graphMemory.triples.map((t, i) => ({ id: `triple_${i}`, content: String(t) })),
  ];

  const nextState = {
    ...state,
    nextAgent: 'discovery',
    output: {
      ...state.output,
      memory: memoryContext,
      _sources: sources,
    },
    history: [...state.history, { agent: 'memory', output: memoryContext }],
  };

  if (state.executionId) {
    await appendAgentExecutionEvent(state.tenantId, state.executionId, {
      event: 'agent.tool.called',
      payload: {
        agent: 'memory',
        tools: ['vectorMemory', 'knowledgeGraph'],
      },
      timestamp: new Date().toISOString(),
    });

    await updateAgentExecutionRecord(state.tenantId, state.executionId, {
      currentAgent: 'memory',
      output: nextState.output,
    });
  }

  return nextState;
}
