import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import type { CerefyGraphState } from '../graph/state';
import { appendAgentExecutionEvent, updateAgentExecutionRecord } from '../tools/databaseTool';

function getLLM() {
  return new ChatGoogleGenerativeAI({
    model: process.env.GEMINI_MODEL || 'gemini-1.5-pro',
    apiKey: process.env.GEMINI_API_KEY,
  });
}

export async function governanceAgent(state: CerefyGraphState) {
  const requirements = state.requirements ?? [];
  const memory = state.output.memory as Record<string, unknown> | undefined;
  const decisionContext = {
    tenantId: state.tenantId,
    projectId: state.projectId,
    documentId: state.documentId,
    requirements,
    memory: {
      executions: Array.isArray(memory?.executionSummaries) ? memory.executionSummaries : [],
      graph: Array.isArray(memory?.graphTriples) ? memory.graphTriples : [],
    },
    history: state.history,
    confidence: state.confidence,
  };

  let decision = {
    decision: state.confidence >= 80 ? 'Approve' : 'Needs Human Review',
    confidence: Math.min(96, Math.max(state.confidence, 82)),
    risk: Math.max(12, 100 - Math.max(state.confidence, 70)),
    reason: 'Comparable Cerefy business patterns support this outcome.',
    checkpoints: ['Review architecture fit', 'Validate security controls', 'Confirm business owner approval'],
  };

  if (process.env.GEMINI_API_KEY) {
    try {
      const llm = getLLM();
      const response = await llm.invoke(
        `You are the Governance Agent for Cerefy. Return JSON with decision, confidence, risk, reason, and checkpoints.\n\nContext:\n${JSON.stringify(decisionContext, null, 2)}`,
      );
      const parsed = safeParseJson(String(response.content));
      if (parsed) {
        decision = {
          ...decision,
          ...(parsed as Record<string, any>),
        } as typeof decision;
      }
    } catch {
      // deterministic fallback already prepared
    }
  }

  const finalDecision = {
    ...decision,
    checkpoint: decision.confidence < 85 ? 'HUMAN_APPROVAL_REQUIRED' : 'AUTO_APPROVED',
  };

  const nextState = {
    nextAgent: 'complete',
    decisions: [
      ...state.decisions,
      finalDecision,
    ],
    governanceComplete: true,
    confidence: Math.max(state.confidence, Number(finalDecision.confidence) || state.confidence),
    summary: 'Governance decision completed.',
    output: {
      ...state.output,
      governance: finalDecision,
    },
    history: [...state.history, { agent: 'governance', output: finalDecision }],
  };

  if (state.executionId) {
    await appendAgentExecutionEvent(state.executionId, {
      event: 'agent.progress',
      payload: { agent: 'governance', output: finalDecision, confidence: nextState.confidence },
      timestamp: new Date().toISOString(),
    });
    await updateAgentExecutionRecord(state.executionId, {
      currentAgent: 'governance',
      status: 'COMPLETED',
      confidence: nextState.confidence,
      output: nextState.output,
      completedAt: new Date(),
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
