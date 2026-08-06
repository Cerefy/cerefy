import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import type { CerefyGraphState } from '../graph/state';
import { loadKnowledgeGraphContext } from '../memory/knowledgeGraph';
import { loadVectorMemoryContext } from '../memory/vectorMemory';
import { extractDocumentSignals } from '../tools/documentTool';
import { appendAgentExecutionEvent, updateAgentExecutionRecord } from '../tools/databaseTool';

function getLLM() {
  return new ChatGoogleGenerativeAI({
    model: process.env.GEMINI_MODEL || 'gemini-1.5-pro',
    apiKey: process.env.GEMINI_API_KEY,
  });
}

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

  let reasoning = {
    entities: documentSignals.entities,
    processes: documentSignals.processes,
    stakeholders: documentSignals.stakeholders,
    assumptions: documentSignals.assumptions,
    memory: {
      vector: vectorMemory.chunkSnippets,
      executions: vectorMemory.executionSummaries,
      qdrant: vectorMemory.qdrantMatches,
      graph: graphMemory.triples,
    },
  };

  if (process.env.GEMINI_API_KEY) {
    try {
      const llm = getLLM();
      const response = await llm.invoke(
        `You are the Discovery Agent for Cerefy.
Analyze the following business context and return valid JSON with entities, processes, stakeholders, assumptions, and gaps.\n\nContext:\n${JSON.stringify(
          {
            documentSummary: vectorMemory.documentSummary,
            chunks: vectorMemory.chunkSnippets,
            executions: vectorMemory.executionSummaries,
            qdrant: vectorMemory.qdrantMatches,
            graph: graphMemory.summary,
          },
          null,
          2,
        )}`,
      );
      const content = String(response.content);
      const parsed = safeParseJson(content);
      if (parsed) {
        reasoning = {
          ...reasoning,
          ...parsed,
        };
      }
    } catch {
      // deterministic fallback already prepared
    }
  }

  const nextState = {
    nextAgent: 'analyst',
    documents: state.documents,
    requirements: state.requirements,
    decisions: state.decisions,
    confidence: Math.max(state.confidence, 62),
    discoveryComplete: true,
    analystComplete: state.analystComplete,
    governanceComplete: state.governanceComplete,
    summary: `Discovery completed for ${state.type}`,
    output: {
      ...state.output,
      discovery: reasoning,
    },
    history: [...state.history, { agent: 'discovery', output: reasoning }],
  };

  if (state.executionId) {
    await appendAgentExecutionEvent(state.executionId, {
      event: 'agent.progress',
      payload: { agent: 'discovery', output: reasoning, confidence: nextState.confidence },
      timestamp: new Date().toISOString(),
    });
    await updateAgentExecutionRecord(state.executionId, {
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
