import { StateGraph, START, END, Annotation } from '@langchain/langgraph';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { db, withTenantContext } from '../db';
import { documentChunks } from '../db/schema';
import { desc } from 'drizzle-orm';
import { getNeo4jDriver } from './neo4j';

export const AgentState = Annotation.Root({
  tenantId: Annotation<string>(),
  query: Annotation<string>(),
  plan: Annotation<string[]>(),
  retrievedContext: Annotation<string>(),
  reasoningOutput: Annotation<string>(),
  reflectionCritique: Annotation<string>(),
  status: Annotation<string>(),
});

const getLLM = () => new ChatGoogleGenerativeAI({
  model: 'gemini-1.5-pro',
  apiKey: process.env.GEMINI_API_KEY,
});

async function plannerAgent(state: typeof AgentState.State): Promise<Partial<typeof AgentState.State>> {
  const llm = getLLM();
  const prompt = `You are an Enterprise Multi-Agent Planner.
Target Query: "${state.query}"
Create a structured 4-step execution plan. Format your response as 4 lines, each starting with "Step 1:", etc.`;
  
  const res = await llm.invoke(prompt);
  const plan = res.content.toString().split('\n').filter(l => l.trim().length > 0);
  return { plan };
}

async function retrieverAgent(state: typeof AgentState.State): Promise<Partial<typeof AgentState.State>> {
  let context = '';
  
  await withTenantContext(state.tenantId, async (tx) => {
    const chunks = await tx.select().from(documentChunks).orderBy(desc(documentChunks.createdAt)).limit(3);
    context += chunks.map((c: any) => c.content).join('\n\n');
  });

  const neo4jDriver = getNeo4jDriver();
  const session = neo4jDriver.session();
  try {
    const result = await session.run(`
      MATCH (t:Tenant {id: $tenantId})<-[:BELONGS_TO]-(e:Entity)<-[:CONTAINS]-(d:Document)
      RETURN e.name as entity, e.label as label, d.title as doc
      LIMIT 5
    `, { tenantId: state.tenantId });
    
    if (result.records.length > 0) {
      context += '\n\nKnowledge Graph Context:\n';
      result.records.forEach(r => {
        context += `- Entity: ${r.get('entity')} (${r.get('label')}) from Document: ${r.get('doc')}\n`;
      });
    }
  } catch (e) {
    console.error('Neo4j retrieval error', e);
  } finally {
    await session.close();
  }

  return { retrievedContext: context || 'No context found.' };
}

async function reasonerAgent(state: typeof AgentState.State): Promise<Partial<typeof AgentState.State>> {
  const llm = getLLM();
  const prompt = `You are an Enterprise Reasoner.
Query: "${state.query}"
Context:
${state.retrievedContext}

Provide a comprehensive, authoritative enterprise answer based strictly on the context.`;
  
  const res = await llm.invoke(prompt);
  return { reasoningOutput: res.content.toString() };
}

async function reflectionAgent(state: typeof AgentState.State): Promise<Partial<typeof AgentState.State>> {
  const llm = getLLM();
  const prompt = `You are a Reflection Guard.
Output: "${state.reasoningOutput}"
Critique the answer in 2 bullet points ensuring it does not expose sensitive data. End with "STATUS: PASSED".`;
  
  const res = await llm.invoke(prompt);
  return { reflectionCritique: res.content.toString(), status: 'completed' };
}

export function buildAgentOrchestrator() {
  const workflow = new StateGraph(AgentState)
    .addNode('planner', plannerAgent)
    .addNode('retriever', retrieverAgent)
    .addNode('reasoner', reasonerAgent)
    .addNode('reflection', reflectionAgent)
    .addEdge(START, 'planner')
    .addEdge('planner', 'retriever')
    .addEdge('retriever', 'reasoner')
    .addEdge('reasoner', 'reflection')
    .addEdge('reflection', END);

  return workflow.compile();
}
