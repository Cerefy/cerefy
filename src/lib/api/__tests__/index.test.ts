import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ok, fail } from '../envelope';
import { encodeCursor, decodeCursor, paginate, paginateOrdered, uint64Cursor, decodeUint64Cursor } from '../pagination';
import { extractIdempotencyKey, IdempotencyService, MemoryIdempotencyStore } from '../idempotency';
import { defineContract, assertValid, validateContract } from '../validate';

test('envelope: ok() populates meta defaults', () => {
  const response = ok({ id: 1 });
  assert.deepEqual(response.data, { id: 1 });
  assert.ok(response.meta.requestId);
  assert.equal(response.meta.tenantId, undefined);
});

test('envelope: ok() accepts explicit meta', () => {
  const response = ok([1, 2], { requestId: 'req-1', tenantId: 'tenant-a' });
  assert.equal(response.meta.requestId, 'req-1');
  assert.equal(response.meta.tenantId, 'tenant-a');
});

test('envelope: fail() shapes the documented error', () => {
  const { status, body } = fail('NOT_FOUND', 'Decision not found', { requestId: 'req-2' });
  assert.equal(status, 404);
  assert.deepEqual(body.error, { code: 'NOT_FOUND', message: 'Decision not found', requestId: 'req-2' });
});

test('pagination: cursor encodes and decodes', () => {
  const cursor = encodeCursor({ id: 'proj_42' }, ['id']);
  assert.equal(decodeCursor(cursor)[0], 'proj_42');
});

test('client-side extract idempotency key', () => {
  const key = 'abc-123';
  assert.equal(extractIdempotencyKey({ headers: { 'idempotency-key': key } }), key);
});

test('idempotency: replay returns stored result', async () => {
  const service = new IdempotencyService(new MemoryIdempotencyStore(), 1000);
  let calls = 0;
  const produced = await service.execute('key-1', async () => { calls++; return { n: 1 }; });
  const replayed = await service.execute('key-1', async () => { calls++; return { n: 2 }; });
  assert.equal(produced.replay, false);
  assert.equal(replayed.replay, true);
  assert.deepEqual(replayed.result, { n: 1 });
  assert.equal(calls, 1);
});

test('pagination: paginate returns page and next cursor', () => {
  const items = [
    { id: 'three', t: 30 },
    { id: 'two', t: 20 },
    { id: 'one', t: 10 },
  ];
  const first = paginate({ items, nextCursor: null, limit: 1, orderKey: 't' });
  assert.equal(first.items.length, 1);
  assert.equal(first.items[0].id, 'three');
  assert.equal(first.hasMore, true);
  const second = paginate({ items, nextCursor: first.nextCursor, limit: 1, orderKey: 't' });
  assert.equal(second.items[0].id, 'two');
  const third = paginate({ items, nextCursor: second.nextCursor, limit: 1, orderKey: 't' });
  assert.equal(third.items[0].id, 'one');
  assert.equal(third.nextCursor, null);
  assert.equal(third.hasMore, false);
});

test('pagination: decodeUint64Cursor', () => {
  const cur = uint64Cursor(123);
  assert.equal(decodeUint64Cursor(cur), 123);
});

test('contract: strict rejects unknown fields', () => {
  const contract = defineContract({
    fields: {
      title: { type: 'string', required: true, max: 100 },
      count: { type: 'number', required: false, min: 0 },
    },
  });
  const result = validateContract(contract, { title: 'ok', extra: true });
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.field === 'extra'));
});

test('contract: assertValid returns typed body', () => {
  const contract = defineContract({
    fields: { title: { type: 'string', required: true } },
  });
  const body = assertValid<{ title: string }>(contract, { title: 'hello' });
  assert.equal(body.title, 'hello');
});

test('contract: required error message', () => {
  const contract = defineContract({ fields: { title: { type: 'string', required: true } } });
  const result = validateContract(contract, {});
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.field === 'title'));
});