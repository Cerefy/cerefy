import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import type { CerefyGraphState } from '../graph/state';
import { appendAgentExecutionEvent, updateAgentExecutionRecord } from '../tools/databaseTool';

function getLLM() {
  return new ChatGoogleGenerativeAI({
    model: process.env.GEMINI_MODEL || 'gemini-1.5-pro',
    apiKey: process.env.GEMINI_API_KEY,
  });
}

export async function validationAgent(state: CerefyGraphState) {
  const validationPlan = {
    checks: ['npm run lint', 'npm run typecheck', 'npm run build', 'npm test'],
    status: 'READY',
    notes: ['Use CI to enforce every check after each logical change.'],
  };

  if (process.env.GEMINI_API_KEY) {
    try {
      const llm = getLLM();
      const response = await llm.invoke(
        `You are the Validation Agent for Cerefy. Return JSON with checks, status, and notes.\n\nState:\n${JSON.stringify(state.output ?? {}, null, 2)}`,
      );
      const parsed = safeParseJson(String(response.content));
      if (parsed) {
        Object.assign(validationPlan, parsed);
      }
    } catch {
      // fallback retained
    }
  }

  const nextState = {
    ...state,
    validationComplete: true,
    confidence: Math.max(state.confidence, 78),
    output: {
      ...state.output,
      validation: validationPlan,
    },
    history: [...state.history, { agent: 'validation', output: validationPlan }],
  };

  if (state.executionId) {
    await appendAgentExecutionEvent(state.executionId, {
      event: 'agent.progress',
      payload: { agent: 'validation', output: validationPlan },
      timestamp: new Date().toISOString(),
    });
    await updateAgentExecutionRecord(state.executionId, {
      currentAgent: 'validation',
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
