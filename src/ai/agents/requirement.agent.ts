import type { CerefyGraphState } from '../graph/state';
import { appendAgentExecutionEvent, updateAgentExecutionRecord } from '../tools/databaseTool';

export async function requirementAgent(state: CerefyGraphState) {
  const discovery = state.output.discovery as Record<string, unknown> | undefined;
  const entities = Array.isArray(discovery?.entities) ? (discovery.entities as string[]) : [];
  const stakeholders = Array.isArray(discovery?.stakeholders) ? (discovery.stakeholders as string[]) : [];

  const requirements = [
    {
      id: 'req_auto_1',
      title: 'Automated business requirement extraction',
      description: `Generate requirements from ${entities[0] || 'enterprise documents'} for ${stakeholders[0] || 'business users'}.`,
      priority: 'HIGH',
      acceptanceCriteria: [
        'Requirements are traceable to source documents.',
        'Ambiguous items are flagged for review.',
      ],
    },
  ];

  const nextState = {
    ...state,
    requirements,
    output: {
      ...state.output,
      requirements,
    },
    history: [...state.history, { agent: 'requirement', output: requirements }],
  };

  if (state.executionId) {
    await appendAgentExecutionEvent(state.executionId, {
      event: 'agent.progress',
      payload: { agent: 'requirement', output: requirements },
      timestamp: new Date().toISOString(),
    });
    await updateAgentExecutionRecord(state.executionId, {
      currentAgent: 'requirement',
      confidence: Math.max(state.confidence, 72),
      output: nextState.output,
    });
  }

  return nextState;
}
