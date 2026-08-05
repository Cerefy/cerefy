const QDRANT_API_BASE = process.env.QDRANT_URL;
const QDRANT_API_KEY = process.env.QDRANT_API_KEY;
const QDRANT_COLLECTION = process.env.QDRANT_COLLECTION || 'cerefy-memory';

export interface QdrantMemoryMatch {
  id: string;
  score: number;
  payload: Record<string, unknown>;
}

function isQdrantConfigured(): boolean {
  return Boolean(QDRANT_API_BASE);
}

export async function searchQdrantMemory(query: string, limit = 5): Promise<QdrantMemoryMatch[]> {
  if (!isQdrantConfigured()) {
    return [];
  }

  const response = await fetch(`${QDRANT_API_BASE}/collections/${QDRANT_COLLECTION}/points/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(QDRANT_API_KEY ? { api-key: QDRANT_API_KEY } : {}),
    },
    body: JSON.stringify({
      limit,
      with_payload: true,
      with_vector: false,
      // Use text query as a placeholder payload filter for now.
      // The existing Cerefy runtime can still store and retrieve embeddings
      // from PostgreSQL/Neo4j; Qdrant is an optional supplemental memory layer.
      vector: [],
      filter: {
        must: [
          { key: 'text', match: { value: query } },
        ],
      },
    }),
  });

  if (!response.ok) {
    return [];
  }

  const data = await response.json() as { result?: Array<{ id: string; score: number; payload?: Record<string, unknown> }> };
  return (data.result || []).map((item) => ({
    id: item.id,
    score: item.score,
    payload: item.payload || {},
  }));
}
