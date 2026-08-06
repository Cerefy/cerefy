const QDRANT_COLLECTION = process.env.QDRANT_COLLECTION || 'cerefy-memory';

export interface QdrantMemoryMatch {
  id: string;
  score: number;
  payload: Record<string, unknown>;
}

function getQdrantConfig() {
  return {
    baseUrl: process.env.QDRANT_URL,
    apiKey: process.env.QDRANT_API_KEY,
  };
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
  const { baseUrl, apiKey } = getQdrantConfig();
  if (!baseUrl) {
    return [];
  }

  const response = await fetch(`${baseUrl}/collections/${QDRANT_COLLECTION}/points/scroll`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(apiKey ? { 'api-key': apiKey } : {}),
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
  const seen = new Set<string>();
  return (data.result || [])
    .filter((item) => {
      const id = String(item.id);
      if (!id || seen.has(id)) {
        return false;
      }
      const matches = payloadMatchesQuery(item.payload || {}, query, tenantId);
      if (matches) {
        seen.add(id);
      }
      return matches;
    })
    .slice(0, limit)
    .map((item, index) => ({
      id: item.id,
      score: Math.max(0.5, 1 - index * 0.1),
      payload: item.payload || {},
    }));
}
