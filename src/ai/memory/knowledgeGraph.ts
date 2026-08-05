import { getNeo4jDriver } from '../../lib/neo4j';

export interface KnowledgeGraphContext {
  triples: Array<Record<string, unknown>>;
  summary: string;
}

export async function loadKnowledgeGraphContext(params: {
  tenantId: string;
  projectId?: string;
  limit?: number;
}): Promise<KnowledgeGraphContext> {
  const limit = params.limit ?? 5;

  try {
    const driver = getNeo4jDriver();
    const session = driver.session();

    try {
      const result = await session.run(
        `MATCH (t:Tenant {id: $tenantId})<-[:BELONGS_TO]-(n)
         OPTIONAL MATCH (n)-[r]->(m)
         RETURN coalesce(n.name, n.id, labels(n)[0]) AS subject,
                type(r) AS relation,
                coalesce(m.name, m.id, labels(m)[0]) AS object
         LIMIT $limit`,
        { tenantId: params.tenantId, limit },
      );

      const triples = result.records.map((record) => ({
        subject: record.get('subject'),
        relation: record.get('relation'),
        object: record.get('object'),
      }));

      return {
        triples,
        summary: triples.length
          ? triples.map((triple) => `${triple.subject} - ${triple.relation ?? 'related_to'} - ${triple.object}`).join('\n')
          : 'No graph context available.',
      };
    } finally {
      await session.close();
    }
  } catch {
    return {
      triples: [],
      summary: 'Neo4j is not available for knowledge graph retrieval.',
    };
  }
}
