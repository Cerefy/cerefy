import { test } from 'node:test';
import assert from 'node:assert/strict';
import { reconstructAnswer, type AnswerRecord, type QueryRecord, type FollowUpRecord } from '../provenance';
import { createProvenanceStore } from '../store';
import { EmbeddingCache } from '../../cache/embeddingCache';
import { AiPipelineChaos } from '../../chaos/aiChaos';
import { lookupInventory, markValidated, MODEL_INVENTORY } from '../../llm/modelInventory';
import { estimateCompletionCost } from '../../llm/types';

const ANSWER: AnswerRecord = {
  id: 'answer_1',
  tenantId: 't1',
  queryId: 'query_1',
  modelVersion: 'gemini-2.5-flash',
  promptVersion: 'analysis_v1',
  confidence: 0.85,
  output: { answer: 'Acme runs SAP S/4HANA.' },
  sources: [{ id: 'doc-acme-2024', content: 'Acme runs SAP S/4HANA since 2022.' }],
  humanReviewStatus: 'PENDING',
  humanEdited: false,
  createdAt: '2025-01-15T10:00:00Z',
};

const QUERY: QueryRecord = {
  id: 'query_1',
  tenantId: 't1',
  userId: 'u1',
  type: 'analysis',
  tokensInput: 1200,
  tokensOutput: 320,
  costUsd: estimateCompletionCost('gemini-2.5-flash', 1200, 320),
  createdAt: '2025-01-15T10:00:00Z',
};

const FOLLOW_UP: FollowUpRecord = {
  answerId: 'answer_1',
  actorId: 'reviewer1',
  action: 'approved',
  reviewedAt: '2025-01-16T08:00:00Z',
  outcome: { achieved: true, confirmedAt: '2025-01-20T12:00:00Z', note: 'Decision implemented, ROI on track.' },
};

test('reconstruction §12: full provenance reconstructable with no gaps', () => {
  const r = reconstructAnswer({ answer: ANSWER, query: QUERY, followUps: [FOLLOW_UP], inventory: MODEL_INVENTORY });
  assert.equal(r.reconstructable, true);
  assert.deepEqual(r.gaps, []);
  assert.equal(r.model.modelVersion, 'gemini-2.5-flash');
  assert.equal(r.retrievedData[0].id, 'doc-acme-2024');
  assert.equal(r.humanFollowUp.latestReview?.action, 'approved');
  assert.equal(r.humanFollowUp.latestReview?.outcome?.achieved, true);
  assert.ok(r.cost.costUsd > 0);
});

test('reconstruction §12: missing model/prompt provenance is a gap', () => {
  const r = reconstructAnswer({ answer: { ...ANSWER, modelVersion: '', promptVersion: '' }, query: QUERY });
  assert.equal(r.reconstructable, false);
  assert.ok(r.gaps.includes('answer.modelVersion missing'));
  assert.ok(r.gaps.includes('answer.promptVersion missing'));
});

test('reconstruction §12: empty sources flagged as non-reconstructable', () => {
  const r = reconstructAnswer({ answer: { ...ANSWER, sources: [] }, query: QUERY });
  assert.equal(r.reconstructable, false);
  assert.ok(r.gaps.includes('answer.sources empty — retrieved data not recorded'));
});

test('reconstruction §12: not in inventory is a gap', () => {
  const r = reconstructAnswer({
    answer: { ...ANSWER, modelVersion: 'mystery-model', promptVersion: 'v9' },
    query: QUERY,
    inventory: MODEL_INVENTORY,
  });
  assert.equal(r.reconstructable, false);
});

test('store: records query/answer/follow-up and reflects edits', async () => {
  const store = createProvenanceStore();
  const q = await store.recordQuery({ tenantId: 't1', userId: 'u1', type: 'analysis', tokensInput: 10, tokensOutput: 5, costUsd: 0.001 });
  const a = await store.recordAnswer({
    tenantId: 't1', queryId: q.id, modelVersion: 'gemini-2.5-flash', promptVersion: 'analysis_v1',
    confidence: 0.7, output: { answer: 'x' }, sources: [{ id: 's1', content: 'x' }], humanReviewStatus: 'PENDING', humanEdited: false,
  });
  const r = reconstructAnswer({ answer: a, query: q });
  assert.equal(r.reconstructable, true);
  assert.equal(store.answers().length, 1);
  await store.recordFollowUp({ answerId: a.id, actorId: 'r', action: 'edited', revisedOutput: { answer: 'y' }, reviewedAt: '2025-01-16T00:00:00Z' });
  assert.equal(store.followUps().length, 1);
  store.reset();
  assert.equal(store.answers().length, 0);
});

test('embedding cache §6.2: hit/miss and event-based invalidation', () => {
  const cache = new EmbeddingCache({ maxEntries: 100 });
  assert.equal(cache.get('query a'), null);
  cache.set('query a', [0.1, 0.2], ['doc1']);
  assert.deepEqual(cache.get('query a'), [0.1, 0.2]);
  cache.invalidateForDocument('doc1');
  assert.equal(cache.has('query a'), false);
});

test('embedding cache §6.2: invalidating unrelated doc keeps cache', () => {
  const cache = new EmbeddingCache();
  cache.set('q1', [1], ['doc1']);
  cache.set('q2', [2], ['doc2']);
  cache.invalidateForDocument('doc2');
  assert.equal(cache.has('q1'), true);
  assert.equal(cache.has('q2'), false);
});

test('embedding cache §6.2: respects max entries (evicts least-recently-hit)', () => {
  const cache = new EmbeddingCache({ maxEntries: 2 });
  cache.set('a', [1]);
  cache.set('b', [2]);
  cache.get('a');
  cache.set('c', [3]);
  assert.equal(cache.has('a'), true);
  assert.equal(cache.has('c'), true);
  assert.equal(cache.size(), 2);
});

test('chaos §11.6: disabled harness passes through unchanged', async () => {
  const chaos = new AiPipelineChaos({ enabled: false });
  const result = await chaos.withProviderChaos({ id: 'gemini' } as any, async () => ({ ok: true }));
  assert.deepEqual(result, { ok: true });
  const ret = chaos.degradeRetrieve([1, 2, 3, 4]);
  assert.equal(ret.degraded, false);
  assert.deepEqual(ret.records, [1, 2, 3, 4]);
});

test('chaos §11.6: retrieve degradation returns clearly-flagged partial results', () => {
  const chaos = new AiPipelineChaos({ enabled: true, effect: 'retrieve_degraded', faultRate: 1 });
  const ret = chaos.degradeRetrieve([1, 2, 3, 4]);
  assert.equal(ret.degraded, true);
  assert.ok(ret.records.length < 4);
  assert.match(ret.reason, /degraded/);
});

test('chaos §11.6: provider outage throws honest AI_TEMPORARILY_LIMITED', async () => {
  const chaos = new AiPipelineChaos({ enabled: true, effect: 'provider_outage', faultRate: 1 });
  await assert.rejects(
    chaos.withProviderChaos({ id: 'gemini' } as any, async () => ({ ok: true })),
    (err: any) => err.code === 'AI_TEMPORARILY_LIMITED' && /unavailable/.test(err.message),
  );
});

test('chaos §11.6: llm_error fault route throws honest error', async () => {
  const chaos = new AiPipelineChaos({ enabled: true, effect: 'llm_error', faultRate: 1 });
  await assert.rejects(
    chaos.withProviderChaos({ id: 'gemini' } as any, async () => ({ ok: true })),
    (err: any) => err.code === 'AI_TEMPORARILY_LIMITED',
  );
});

test('model inventory §11.4: lookup finds active entry, boundaries documented', () => {
  const entry = lookupInventory('gemini-2.5-flash', 'analysis_v1');
  assert.ok(entry);
  assert.equal(entry!.status, 'active');
  assert.ok(entry!.knownLimitations.length > 0);
  assert.ok(entry!.usageBoundaries.length > 0);
  const unknown = lookupInventory('nope', 'v0');
  assert.equal(unknown, null);
});

test('model inventory §11.4: independent validation recorded', () => {
  const entry = markValidated('gemini-2.5-flash', 'decision_v1', '2025-03-01T00:00:00Z');
  assert.equal(entry?.lastIndependentValidationAt, '2025-03-01T00:00:00Z');
});