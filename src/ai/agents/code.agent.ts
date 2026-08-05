import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import type { CerefyGraphState } from '../graph/state';
import { appendAgentExecutionEvent, updateAgentExecutionRecord } from '../tools/databaseTool';

function getLLM() {
  return new ChatGoogleGenerativeAI({
    model: process.env.GEMINI_MODEL || 'gemini-1.5-pro',
    apiKey: process.env.GEMINI_API_KEY,
  });
}

export async function codeAgent(state: CerefyGraphState) {
  const codePlan = {
    implementation: ['Extend existing Express routes', 'Preserve frontend contracts', 'Add focused tests'],
    testing: ['Run lint', 'Run typecheck', 'Run build', 'Run tests'],
    risks: ['Schema drift', 'Unverified external credentials'],
  };

  if (process.env.GEMINI_API_KEY) {
    try {
      const llm = getLLM();
      const response = await llm.invoke(
        `You are the Code Generation Agent for Cerefy. Return JSON with implementation, testing, and risks.\n\nState:\n${JSON.stringify(state.output ?? {}, null, 2)}`,
      );
      const parsed = safeParseJson(String(response.content));
      if (parsed) {
        Object.assign(codePlan, parsed);
      }
    } catch {
      // fallback retained
    }
  }

  const nextState = {
    ...state,
    confidence: Math.max(state.confidence, 66),
    output: {
      ...state.output,
      code: codePlan,
    },
    history: [...state.history, { agent: 'code', output: codePlan }],
  };

  if (state.executionId) {
    await appendAgentExecutionEvent(state.executionId, {
      event: 'agent.progress',
      payload: { agent: 'code', output: codePlan },
      timestamp: new Date().toISOString(),
    });
    await updateAgentExecutionRecord(state.executionId, {
      currentAgent: 'code',
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
