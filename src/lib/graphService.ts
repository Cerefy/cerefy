import { desc, eq } from 'drizzle-orm';
import { db, isDatabaseReachable, withTenantContext } from '../db';
import { graphEntities, graphEntityLinks } from '../db/schema';

export interface GraphNodeRecord {
  id: string;
  label: string;
  type: string;
  source: string;
}

export interface GraphLinkRecord {
  source: string;
  target: string;
  relation: string;
}

export interface GraphQueryResult {
  query: string;
  executedInMs: number;
  nodesMatched: number;
  records: Array<GraphNodeRecord>;
  links: GraphLinkRecord[];
}

/** Real knowledge-graph read: returns the tenant's persisted graph entities and links.
 *  This replaces the former fabricated cypher stub with data actually stored in
 *  Postgres (ingested at document-ingestion time). Cypher itself is not executed —
 *  the query string is honored as a label filter when one is present. */
export async function queryGraph(tenantId: string, cypher?: string): Promise<GraphQueryResult> {
  const started = Date.now();
  if (!(await isDatabaseReachable())) {
    throw new Error('Knowledge graph unavailable — database not reachable');
  }
  const labelFilter = extractLabelFilter(cypher);
  return withTenantContext(tenantId, async (tx) => {
    const entities = labelFilter
      ? await tx.select().from(graphEntities).where(eq(graphEntities.label, labelFilter)).orderBy(desc(graphEntities.createdAt)).limit(50)
      : await tx.select().from(graphEntities).orderBy(desc(graphEntities.createdAt)).limit(50);
    const links = await tx.select().from(graphEntityLinks).orderBy(desc(graphEntityLinks.createdAt)).limit(100);

    const idToName = new Map<string, string>();
    for (const entity of entities) idToName.set(entity.id, entity.name);

    const records: GraphNodeRecord[] = entities.map((entity) => ({
      id: entity.id,
      label: entity.label ?? entity.name,
      type: entity.label ?? 'Entity',
      source: entity.source,
    }));

    const linkRecords: GraphLinkRecord[] = links
      .filter((link) => idToName.has(link.sourceEntityId ?? '') && idToName.has(link.targetEntityId ?? ''))
      .map((link) => ({
        source: idToName.get(link.sourceEntityId ?? '')!,
        target: idToName.get(link.targetEntityId ?? '')!,
        relation: link.relation,
      }));

    return {
      query: cypher ?? 'MATCH (e:Entity) RETURN e LIMIT 50',
      executedInMs: Date.now() - started,
      nodesMatched: entities.length,
      records,
      links: linkRecords,
    };
  });
}

/** Extracts a `label` from a minimal read-only cypher-style query like
 *  `MATCH (e:SomeLabel) RETURN e LIMIT n`. Returns undefined when none is present. */
function extractLabelFilter(cypher?: string): string | undefined {
  if (!cypher) return undefined;
  const match = /MATCH\s*\(\s*\w+\s*:\s*([A-Za-z0-9_]+)\s*\)/.exec(cypher);
  if (!match) return undefined;
  const label = match[1];
  if (label.toLowerCase() === 'entity') return undefined;
  return label;
}
