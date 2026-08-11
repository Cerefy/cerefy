import type { CerefyGraphState } from '../graph/state';
import { loadKnowledgeGraphContext } from '../memory/knowledgeGraph';
import { loadVectorMemoryContext } from '../memory/vectorMemory';
import { extractDocumentSignals } from '../tools/documentTool';
import { appendAgentExecutionEvent, updateAgentExecutionRecord } from '../tools/databaseTool';
import { runAgentLlm, provenanceFrom, type AgentProvenance } from '../llm';

export async function discoveryAgent(state: CerefyGraphState) {
  const [vectorMemory, graphMemory] = await Promise.all([
    loadVectorMemoryContext({ tenantId: state.tenantId, documentId: state.documentId }),
    loadKnowledgeGraphContext({ tenantId: state.tenantId, projectId: state.projectId }),
  ]);

  const documentSignals = extractDocumentSignals({
    id: state.documentId,
    title: vectorMemory.documentSummary || 'Business Document',
    content: [
      ...state.documents.map((doc) => String((doc as any).content ?? '')),
      ...vectorMemory.chunkSnippets,
    ].join('\n'),
  });

  // Real evidence coverage: how much actual retrieved content exists. Confidence
  // is derived from this real signal — never a fixed floor (audit LLM-ops #5).
  const coverage = vectorMemory.chunkSnippets.length + graphMemory.triples.length;
  const evidenceConfidence = coverage === 0 ? 0 : Math.min(0.9, 0.4 + coverage * 0.1);

  let reasoning = {
    entities: documentSignals.entities,
    processes: documentSignals.processes,
    stakeholders: documentSignals.stakeholders,
    assumptions: documentSignals.assumptions,
    memory: {
      vector: vectorMemory.chunkSnippets,
      graph: graphMemory.triples,
    },
  };

  let usedProvenance: AgentProvenance | undefined = undefined;

  if (process.env.GEMINI_API_KEY) {
    const call = await runAgentLlm({
      promptVersion: 'discovery_v1',
      instruction:
        'You are the Discovery Agent for Cerefy. Analyze the supplied business context and return valid JSON ' +
        'with entities, processes, stakeholders, assumptions, and gaps.',
      retrieved: [
        ...vectorMemory.chunkSnippets.map((content, i) => ({ id: `chunk_${i}`, content })),
        ...graphMemory.triples.map((t, i) => ({ id: `triple_${i}`, content: String(t) })),
      ],
    });
    usedProvenance = provenanceFrom(call);
    if (call.result) {
      const parsed = safeParseJson(call.result.text);
      if (parsed) {
        reasoning = { ...reasoning, ...parsed };
      }
    }
  }

  const nextState = {
    nextAgent: 'analyst',
    documents: state.documents,
    requirements: state.requirements,
    decisions: state.decisions,
    confidence: Math.max(state.confidence, evidenceConfidence),
    discoveryComplete: true,
    analystComplete: state.analystComplete,
    governanceComplete: state.governanceComplete,
    summary: `Discovery completed for ${state.type}`,
    output: {
      ...state.output,
      discovery: reasoning,
      _provenance: usedProvenance,
      _evidenceConfidence: evidenceConfidence,
    },
    history: [...state.history, { agent: 'discovery', output: reasoning }],
  };

  if (state.executionId) {
    await appendAgentExecutionEvent(state.tenantId, state.executionId, {
      event: 'agent.progress',
      payload: { agent: 'discovery', output: reasoning, confidence: nextState.confidence },
      timestamp: new Date().toISOString(),
    });
    await updateAgentExecutionRecord(state.tenantId, state.executionId, {
      currentAgent: 'discovery',
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