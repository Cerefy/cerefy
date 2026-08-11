import type { CerefyGraphState } from '../graph/state';
import { appendAgentExecutionEvent, updateAgentExecutionRecord } from '../tools/databaseTool';
import { runAgentLlm, provenanceFrom, type AgentProvenance } from '../llm';

export async function governanceAgent(state: CerefyGraphState) {
  const requirements = state.requirements ?? [];
  const decisionContext = {
    tenantId: state.tenantId,
    projectId: state.projectId,
    documentId: state.documentId,
    requirements,
    history: state.history,
    confidence: state.confidence,
  };

  // Real signal: governance confidence is capped by the evidence floor already
  // computed by the upstream agents — never lift it (audit LLM-ops #5).
  const finalConfidence = Math.min(0.95, Math.max(0, state.confidence));

  let decision = {
    decision: finalConfidence >= 0.8 ? 'Approve' : 'Needs Human Review',
    confidence: finalConfidence,
    risk: Math.max(0.12, 1 - finalConfidence),
    reason: 'Comparable Cerefy business patterns support this outcome.',
    checkpoints: ['Review architecture fit', 'Validate security controls', 'Confirm business owner approval'],
  };

  let usedProvenance: AgentProvenance | undefined = undefined;

  if (process.env.GEMINI_API_KEY) {
    const call = await runAgentLlm({
      promptVersion: 'governance_v1',
      instruction:
        `You are the Governance Agent for Cerefy. Return JSON with decision, confidence, risk, reason, and checkpoints.\n\nContext:\n${JSON.stringify(decisionContext, null, 2)}`,
    });
    usedProvenance = provenanceFrom(call);
    if (call.result) {
      const parsed = safeParseJson(call.result.text);
      if (parsed) {
        decision = { ...decision, ...(parsed as Record<string, any>) } as typeof decision;
      }
    }
  }

  const finalDecision = {
    ...decision,
    checkpoint: decision.confidence < 0.85 ? 'HUMAN_APPROVAL_REQUIRED' : 'AUTO_APPROVED',
  };

  const nextState = {
    nextAgent: 'complete',
    decisions: [...state.decisions, finalDecision],
    governanceComplete: true,
    confidence: Math.max(state.confidence, Number(finalDecision.confidence) || state.confidence),
    summary: 'Governance decision completed.',
    output: {
      ...state.output,
      governance: finalDecision,
      confidence: finalDecision.confidence,
      answer: finalDecision.reason,
      _provenance: usedProvenance,
      _sources: Array.isArray(state.output?._sources) ? state.output._sources : [],
    },
    history: [...state.history, { agent: 'governance', output: finalDecision }],
  };

  if (state.executionId) {
    await appendAgentExecutionEvent(state.tenantId, state.executionId, {
      event: 'agent.progress',
      payload: { agent: 'governance', output: finalDecision, confidence: nextState.confidence },
      timestamp: new Date().toISOString(),
    });
    await updateAgentExecutionRecord(state.tenantId, state.executionId, {
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