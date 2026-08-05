import type { CerefyGraphState } from '../graph/state';
import { appendAgentExecutionEvent, updateAgentExecutionRecord } from '../tools/databaseTool';

export async function validationAgent(state: CerefyGraphState) {
  const requiredSections = ['discovery', 'requirements', 'processAnalysis', 'dataIntelligence', 'codeGeneration'];
  const output = state.output as Record<string, unknown>;
  const missing = requiredSections.filter((section) => !output[section]);
  const validation = {
    passed: missing.length === 0,
    missing,
    score: missing.length === 0 ? 100 : Math.max(50, 100 - missing.length * 15),
  };

  const nextState = {
    ...state,
    output: {
      ...state.output,
      validation,
    },
    history: [...state.history, { agent: 'validation', output: validation }],
  };

  if (state.executionId) {
    await appendAgentExecutionEvent(state.executionId, {
      event: 'agent.progress',
      payload: { agent: 'validation', output: validation },
      timestamp: new Date().toISOString(),
    });
    await updateAgentExecutionRecord(state.executionId, {
      currentAgent: 'validation',
      confidence: validation.score,
      output: nextState.output,
    });
  }

  return nextState;
}
