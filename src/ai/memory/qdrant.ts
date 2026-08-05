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

function payloadMatchesQuery(payload: Record<string, unknown>, query: string, tenantId: string): boolean {
  if (payload.tenantId && String(payload.tenantId) !== tenantId) {
    return false;
  }

  const haystack = Object.values(payload)
    .map((value) => (typeof value === 'string' ? value : JSON.stringify(value)))
    .join(' ')
    .toLowerCase();
  return haystack.includes(query.toLowerCase());
}

export async function searchQdrantMemory(query: string, tenantId: string, limit = 5): Promise<QdrantMemoryMatch[]> {
  if (!isQdrantConfigured()) {
    return [];
  }

  const response = await fetch(`${QDRANT_API_BASE}/collections/${QDRANT_COLLECTION}/points/scroll`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(QDRANT_API_KEY ? { api-key: QDRANT_API_KEY } : {}),
    },
    body: JSON.stringify({
      limit: Math.max(limit * 3, 10),
      with_payload: true,
      with_vector: false,
    }),
  });

  if (!response.ok) {
    return [];
  }

  const data = await response.json() as { result?: Array<{ id: string; payload?: Record<string, unknown> }> };
  return (data.result || [])
    .filter((item) => payloadMatchesQuery(item.payload || {}, query, tenantId))
    .slice(0, limit)
    .map((item, index) => ({
      id: item.id,
      score: Math.max(0.5, 1 - index * 0.1),
      payload: item.payload || {},
    }));
}
