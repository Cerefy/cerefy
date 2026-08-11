import type { CerefyGraphState } from '../graph/state';
import { appendAgentExecutionEvent, updateAgentExecutionRecord } from '../tools/databaseTool';
import { runAgentLlm, provenanceFrom, type AgentProvenance } from '../llm';

export async function analystAgent(state: CerefyGraphState) {
  const discovery = state.output.discovery as Record<string, unknown> | undefined;
  const entities = Array.isArray(discovery?.entities) ? (discovery?.entities as string[]) : [];
  const processes = Array.isArray(discovery?.processes) ? (discovery?.processes as string[]) : [];
  const stakeholders = Array.isArray(discovery?.stakeholders) ? (discovery?.stakeholders as string[]) : [];

  let requirements = [
    {
      title: 'Business rule validation',
      userStory: `As a ${stakeholders[0] || 'business user'} I want the process to validate ${entities[0] || 'key data'} automatically so that errors are reduced.`,
      acceptanceCriteria: [
        'The system must capture business rules explicitly.',
        'The system must surface edge cases for human review.',
      ],
      priority: 'HIGH',
      risks: ['Incomplete source requirements', 'Ambiguous downstream integrations'],
    },
  ];

  if (processes.length > 0) {
    requirements = processes.map((process, index) => ({
      title: `${process} automation requirement`,
      userStory: `As a ${stakeholders[0] || 'business user'} I want ${process.toLowerCase()} to be automated so that delivery is faster.`,
      acceptanceCriteria: [
        `Process ${process} must be traceable end-to-end.`,
        'Human approval is required when confidence is below threshold.',
      ],
      priority: index === 0 ? 'HIGH' : 'MEDIUM',
      risks: ['Scope creep', 'Insufficient governance coverage'],
    }));
  }

  // Real signal: requirements grounded in actual discovered processes/entities.
  const evidenceConfidence = processes.length === 0 && entities.length === 0 ? 0 : Math.min(0.9, 0.4 + (processes.length + entities.length) * 0.08);

  let usedProvenance: AgentProvenance | undefined = undefined;

  if (process.env.GEMINI_API_KEY) {
    const call = await runAgentLlm({
      promptVersion: 'analyst_v1',
      instruction:
        'You are the Business Analyst Agent for Cerefy. Convert the supplied discovery output into JSON with ' +
        'requirements, userStories, acceptanceCriteria, and risks.',
      retrieved: [{ id: 'discovery_output', content: JSON.stringify(discovery ?? {}) }],
    });
    usedProvenance = provenanceFrom(call);
    if (call.result) {
      const parsed = safeParseJson(call.result.text);
      if (parsed) {
        requirements = Array.isArray(parsed.requirements) ? (parsed.requirements as typeof requirements) : requirements;
      }
    }
  }

  const nextState = {
    nextAgent: 'governance',
    requirements,
    analystComplete: true,
    governanceComplete: state.governanceComplete,
    confidence: Math.max(state.confidence, evidenceConfidence),
    summary: 'Business analysis completed.',
    output: {
      ...state.output,
      analysis: { requirements },
      _provenance: usedProvenance,
    },
    history: [...state.history, { agent: 'analyst', output: requirements }],
  };

  if (state.executionId) {
    await appendAgentExecutionEvent(state.tenantId, state.executionId, {
      event: 'agent.progress',
      payload: { agent: 'analyst', output: requirements, confidence: nextState.confidence },
      timestamp: new Date().toISOString(),
    });
    await updateAgentExecutionRecord(state.tenantId, state.executionId, {
      currentAgent: 'analyst',
      confidence: nextState.confidence,
      output: nextState.output,
    });
  }

  return nextState;
}

function safeParseJson(raw: string): Record<string, unknown> | null {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}