import type { CerefyGraphState } from '../graph/state';
import { appendAgentExecutionEvent, updateAgentExecutionRecord } from '../tools/databaseTool';

export async function codeGenerationAgent(state: CerefyGraphState) {
  const requirements = state.requirements ?? [];
  const codeRecommendations = requirements.map((requirement, index) => ({
    id: `code_${index + 1}`,
    capability: String((requirement as any).title || 'implementation'),
    recommendation: 'Implement backend API contract and orchestration hook.',
  }));

  const nextState = {
    ...state,
    output: {
      ...state.output,
      codeGeneration: codeRecommendations,
    },
    history: [...state.history, { agent: 'codeGeneration', output: codeRecommendations }],
  };

  if (state.executionId) {
    await appendAgentExecutionEvent(state.executionId, {
      event: 'agent.progress',
      payload: { agent: 'codeGeneration', output: codeRecommendations },
      timestamp: new Date().toISOString(),
    });
    await updateAgentExecutionRecord(state.executionId, {
      currentAgent: 'codeGeneration',
      confidence: Math.max(state.confidence, 68),
      output: nextState.output,
    });
  }

  return nextState;
}
