import type { CerefyGraphState } from '../graph/state';
import { appendAgentExecutionEvent, updateAgentExecutionRecord } from '../tools/databaseTool';

export async function processAnalysisAgent(state: CerefyGraphState) {
  const discovery = state.output.discovery as Record<string, unknown> | undefined;
  const processes = Array.isArray(discovery?.processes) ? (discovery.processes as string[]) : [];

  const processInsights = processes.length
    ? processes.map((processName, index) => ({
        id: `proc_${index + 1}`,
        processName,
        bottlenecks: ['Manual approval delay', 'Data handoff risk'],
        dependencies: ['Upstream document ingestion', 'Governance checkpoint'],
      }))
    : [{ id: 'proc_1', processName: 'Enterprise workflow', bottlenecks: [], dependencies: [] }];

  const nextState = {
    ...state,
    output: {
      ...state.output,
      processAnalysis: processInsights,
    },
    history: [...state.history, { agent: 'processAnalysis', output: processInsights }],
  };

  if (state.executionId) {
    await appendAgentExecutionEvent(state.executionId, {
      event: 'agent.progress',
      payload: { agent: 'processAnalysis', output: processInsights },
      timestamp: new Date().toISOString(),
    });
    await updateAgentExecutionRecord(state.executionId, {
      currentAgent: 'processAnalysis',
      confidence: Math.max(state.confidence, 70),
      output: nextState.output,
    });
  }

  return nextState;
}
