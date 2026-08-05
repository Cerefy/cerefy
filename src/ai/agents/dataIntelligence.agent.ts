import type { CerefyGraphState } from '../graph/state';
import { appendAgentExecutionEvent, updateAgentExecutionRecord } from '../tools/databaseTool';

export async function dataIntelligenceAgent(state: CerefyGraphState) {
  const memory = state.output.memory as Record<string, unknown> | undefined;
  const dataIntelligence = {
    dataSources: ['documents', 'database', 'knowledge graph'],
    extractedSignals: [
      'Historical decisions',
      'Document entities',
      'Process dependencies',
    ],
    contextScore: Array.isArray(memory?.chunkSnippets) ? Math.min(100, (memory.chunkSnippets as string[]).length * 10 + 40) : 40,
  };

  const nextState = {
    ...state,
    output: {
      ...state.output,
      dataIntelligence,
    },
    history: [...state.history, { agent: 'dataIntelligence', output: dataIntelligence }],
  };

  if (state.executionId) {
    await appendAgentExecutionEvent(state.executionId, {
      event: 'agent.progress',
      payload: { agent: 'dataIntelligence', output: dataIntelligence },
      timestamp: new Date().toISOString(),
    });
    await updateAgentExecutionRecord(state.executionId, {
      currentAgent: 'dataIntelligence',
      confidence: Math.max(state.confidence, dataIntelligence.contextScore),
      output: nextState.output,
    });
  }

  return nextState;
}
