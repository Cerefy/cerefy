import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import type { CerefyGraphState } from '../graph/state';
import { appendAgentExecutionEvent, updateAgentExecutionRecord } from '../tools/databaseTool';

function getLLM() {
  return new ChatGoogleGenerativeAI({
    model: process.env.GEMINI_MODEL || 'gemini-1.5-pro',
    apiKey: process.env.GEMINI_API_KEY,
  });
}

export async function requirementAgent(state: CerefyGraphState) {
  const discovery = state.output.discovery as Record<string, unknown> | undefined;
  const memory = state.output.memory as Record<string, unknown> | undefined;
  const stakeholderName = Array.isArray(discovery?.stakeholders) && discovery.stakeholders.length > 0
    ? String((discovery.stakeholders as string[])[0])
    : 'business user';

  const requirements = Array.isArray(state.requirements) && state.requirements.length > 0
    ? state.requirements
    : [
        {
          title: 'Enterprise requirement synthesis',
          userStory: `As a ${stakeholderName} I want the workflow to reflect the discovered business process so that delivery is aligned with enterprise policy.`,
          acceptanceCriteria: [
            'The requirement must be traceable to discovery output.',
            'Acceptance criteria must reflect governance constraints.',
          ],
          priority: 'HIGH',
          risks: ['Incomplete discovery context', 'Missing approvals'],
        },
      ];

  let synthesizedRequirements = requirements;

  if (process.env.GEMINI_API_KEY) {
    try {
      const llm = getLLM();
      const response = await llm.invoke(
        `You are the Requirement Agent for Cerefy. Produce JSON with requirements and acceptance criteria.\n\nDiscovery:\n${JSON.stringify(discovery ?? {}, null, 2)}\n\nMemory:\n${JSON.stringify(memory ?? {}, null, 2)}`,
      );
      const parsed = safeParseJson(String(response.content));
      if (parsed && Array.isArray(parsed.requirements)) {
        synthesizedRequirements = parsed.requirements as typeof requirements;
      }
    } catch {
      // deterministic fallback
    }
  }

  const nextState = {
    ...state,
    requirements: synthesizedRequirements,
    confidence: Math.max(state.confidence, 72),
    output: {
      ...state.output,
      requirement: {
        requirements: synthesizedRequirements,
      },
    },
    history: [...state.history, { agent: 'requirement', output: synthesizedRequirements }],
  };

  if (state.executionId) {
    await appendAgentExecutionEvent(state.executionId, {
      event: 'agent.progress',
      payload: { agent: 'requirement', output: synthesizedRequirements },
      timestamp: new Date().toISOString(),
    });
    await updateAgentExecutionRecord(state.executionId, {
      currentAgent: 'requirement',
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
