import { desc, eq } from 'drizzle-orm';
import { db, isDatabaseReachable } from '../db';
import { agentRegistry } from '../db/schema';

export type AgentStatus = 'ACTIVE' | 'DISABLED' | 'DEGRADED';

export interface AgentDefinition {
  name: string;
  capabilities: string[];
  tools: string[];
  status?: AgentStatus;
}

export const coreAgentDefinitions: AgentDefinition[] = [
  { name: 'supervisor', capabilities: ['planning', 'routing', 'coordination'], tools: ['langgraph', 'socket.io'], status: 'ACTIVE' },
  { name: 'memory', capabilities: ['retrieval', 'context synthesis', 'enterprise memory'], tools: ['postgresql', 'pgvector', 'neo4j'], status: 'ACTIVE' },
  { name: 'discovery', capabilities: ['document analysis', 'entity extraction', 'process discovery'], tools: ['langchain', 'gemini', 'vector search'], status: 'ACTIVE' },
  { name: 'analyst', capabilities: ['reasoning', 'recommendation generation', 'insight synthesis'], tools: ['langchain', 'gemini'], status: 'ACTIVE' },
  { name: 'governance', capabilities: ['policy validation', 'risk scoring', 'approval checks'], tools: ['langchain', 'gemini', 'enterprise rules'], status: 'ACTIVE' },
];

export async function ensureCoreAgentsRegistered() {
  if (!(await isDatabaseReachable())) return [];
  const results = [] as Array<Record<string, unknown>>;
  for (const definition of coreAgentDefinitions) {
    results.push(await upsertAgentDefinition(definition));
  }
  return results;
}

export async function upsertAgentDefinition(definition: AgentDefinition) {
  if (!(await isDatabaseReachable())) return null;
  const [existing] = await db.select().from(agentRegistry).where(eq(agentRegistry.name, definition.name)).limit(1);

  if (existing) {
    const [updated] = await db
      .update(agentRegistry)
      .set({
        capabilities: definition.capabilities,
        tools: definition.tools,
        status: definition.status || 'ACTIVE',
        updatedAt: new Date(),
      })
      .where(eq(agentRegistry.id, existing.id))
      .returning();

    return updated;
  }

  const [created] = await db
    .insert(agentRegistry)
    .values({
      name: definition.name,
      capabilities: definition.capabilities,
      tools: definition.tools,
      status: definition.status || 'ACTIVE',
      executionHistory: [],
    })
    .returning();

  return created;
}

export async function recordAgentExecution(agentName: string, execution: Record<string, unknown>) {
  if (!(await isDatabaseReachable())) return null;
  const [existing] = await db.select().from(agentRegistry).where(eq(agentRegistry.name, agentName)).limit(1);

  if (!existing) {
    await upsertAgentDefinition({ name: agentName, capabilities: [], tools: [], status: 'ACTIVE' });
  }

  const [current] = await db.select().from(agentRegistry).where(eq(agentRegistry.name, agentName)).limit(1);
  const history = [
    ...(((current?.executionHistory as Array<Record<string, unknown>> | null | undefined) ?? [])),
    { ...execution, timestamp: new Date().toISOString() },
  ].slice(-100);

  const [updated] = await db
    .update(agentRegistry)
    .set({
      executionHistory: history,
      updatedAt: new Date(),
    })
    .where(eq(agentRegistry.name, agentName))
    .returning();

  return updated;
}

export async function listAgentDefinitions() {
  if (!(await isDatabaseReachable())) return [];
  return db.select().from(agentRegistry).orderBy(desc(agentRegistry.updatedAt));
}

export async function getAgentDefinitionById(agentId: string) {
  if (!(await isDatabaseReachable())) return null;
  const [row] = await db.select().from(agentRegistry).where(eq(agentRegistry.id, agentId as any)).limit(1);
  return row ?? null;
}
