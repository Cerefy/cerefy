import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import type { CerefyGraphState } from '../graph/state';
import { appendAgentExecutionEvent, updateAgentExecutionRecord } from '../tools/databaseTool';

function getLLM() {
  return new ChatGoogleGenerativeAI({
    model: process.env.GEMINI_MODEL || 'gemini-1.5-pro',
    apiKey: process.env.GEMINI_API_KEY,
  });
}

export async function analystAgent(state: CerefyGraphState) {
  const discovery = state.output.discovery as Record<string, unknown> | undefined;
  const memory = state.output.memory as Record<string, unknown> | undefined;
  const entities = Array.isArray(discovery?.entities) ? (discovery?.entities as string[]) : [];
  const processes = Array.isArray(discovery?.processes) ? (discovery?.processes as string[]) : [];
  const stakeholders = Array.isArray(discovery?.stakeholders) ? (discovery?.stakeholders as string[]) : [];
  const executionSummaries = Array.isArray(memory?.executionSummaries) ? (memory?.executionSummaries as Array<Record<string, unknown>>) : [];

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

  if (process.env.GEMINI_API_KEY) {
    try {
      const llm = getLLM();
      const response = await llm.invoke(
        `You are the Business Analyst Agent for Cerefy. Convert the following discovery output into JSON with requirements, userStories, acceptanceCriteria, and risks.\n\nDiscovery:\n${JSON.stringify({
          discovery: discovery ?? {},
          memory: {
            executionSummaries,
          },
        }, null, 2)}`,
      );
      const parsed = safeParseJson(String(response.content));
      if (parsed) {
        requirements = Array.isArray(parsed.requirements) ? (parsed.requirements as typeof requirements) : requirements;
      }
    } catch {
      // fallback preserved
    }
  }

  const nextState = {
    nextAgent: 'governance',
    requirements,
    analystComplete: true,
    governanceComplete: state.governanceComplete,
    confidence: Math.max(state.confidence, 74),
    summary: 'Business analysis completed.',
    output: {
      ...state.output,
      analysis: {
        requirements,
      },
    },
    history: [...state.history, { agent: 'analyst', output: requirements }],
  };

  if (state.executionId) {
    await appendAgentExecutionEvent(state.executionId, {
      event: 'agent.progress',
      payload: { agent: 'analyst', output: requirements, confidence: nextState.confidence },
      timestamp: new Date().toISOString(),
    });
    await updateAgentExecutionRecord(state.executionId, {
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
