import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import type { CerefyGraphState } from '../graph/state';
import { appendAgentExecutionEvent, updateAgentExecutionRecord } from '../tools/databaseTool';

function getLLM() {
  return new ChatGoogleGenerativeAI({
    model: process.env.GEMINI_MODEL || 'gemini-1.5-pro',
    apiKey: process.env.GEMINI_API_KEY,
  });
}

export async function dataAgent(state: CerefyGraphState) {
  const memory = state.output.memory as Record<string, unknown> | undefined;
  const dataInsights = {
    datasets: ['agent_executions', 'decisions', 'documents'],
    metrics: {
      confidence: state.confidence,
      memorySignals: Array.isArray(memory?.executionSummaries) ? memory.executionSummaries.length : 0,
    },
    recommendations: ['Create dataset-backed dashboards', 'Persist analytics summaries for longitudinal reporting'],
  };

  if (process.env.GEMINI_API_KEY) {
    try {
      const llm = getLLM();
      const response = await llm.invoke(
        `You are the Data Intelligence Agent for Cerefy. Return JSON with datasets, metrics, and recommendations.\n\nMemory:\n${JSON.stringify(memory ?? {}, null, 2)}`,
      );
      const parsed = safeParseJson(String(response.content));
      if (parsed) {
        Object.assign(dataInsights, parsed);
      }
    } catch {
      // fallback retained
    }
  }

  const nextState = {
    ...state,
    confidence: Math.max(state.confidence, 70),
    output: {
      ...state.output,
      data: dataInsights,
    },
    history: [...state.history, { agent: 'data', output: dataInsights }],
  };

  if (state.executionId) {
    await appendAgentExecutionEvent(state.executionId, {
      event: 'agent.progress',
      payload: { agent: 'data', output: dataInsights },
      timestamp: new Date().toISOString(),
    });
    await updateAgentExecutionRecord(state.executionId, {
      currentAgent: 'data',
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
