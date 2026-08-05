import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import type { CerefyGraphState } from '../graph/state';
import { appendAgentExecutionEvent, updateAgentExecutionRecord } from '../tools/databaseTool';

function getLLM() {
  return new ChatGoogleGenerativeAI({
    model: process.env.GEMINI_MODEL || 'gemini-1.5-pro',
    apiKey: process.env.GEMINI_API_KEY,
  });
}

export async function processAgent(state: CerefyGraphState) {
  const discovery = state.output.discovery as Record<string, unknown> | undefined;
  const processInsights = {
    workflows: Array.isArray(discovery?.processes) ? discovery?.processes : [],
    bottlenecks: ['Manual approvals', 'Fragmented handoffs'],
    optimizations: ['Parallelize independent workstreams', 'Persist durable execution state'],
  };

  if (process.env.GEMINI_API_KEY) {
    try {
      const llm = getLLM();
      const response = await llm.invoke(
        `You are the Process Intelligence Agent for Cerefy. Return JSON with workflows, bottlenecks, and optimizations.\n\nDiscovery:\n${JSON.stringify(discovery ?? {}, null, 2)}`,
      );
      const parsed = safeParseJson(String(response.content));
      if (parsed) {
        Object.assign(processInsights, parsed);
      }
    } catch {
      // fallback retained
    }
  }

  const nextState = {
    ...state,
    processComplete: true,
    confidence: Math.max(state.confidence, 68),
    output: {
      ...state.output,
      process: processInsights,
    },
    history: [...state.history, { agent: 'process', output: processInsights }],
  };

  if (state.executionId) {
    await appendAgentExecutionEvent(state.executionId, {
      event: 'agent.progress',
      payload: { agent: 'process', output: processInsights },
      timestamp: new Date().toISOString(),
    });
    await updateAgentExecutionRecord(state.executionId, {
      currentAgent: 'process',
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
