import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ok, fail, ApiError, ErrorCode, toApiError } from '../envelope';

test('ok() builds a scoped envelope', () => {
  const out = ok({ id: 1 }, { requestId: 'req_1', tenantId: 't_1' });
  assert.equal(out.data.id, 1);
  assert.equal(out.meta.requestId, 'req_1');
  assert.equal(out.meta.tenantId, 't_1');
});

test('ok() generates a requestId when not supplied', () => {
  const out = ok({});
  assert.equal(typeof out.meta.requestId, 'string');
  assert.ok(out.meta.requestId.length > 0);
});

test('fail() maps codes to statuses', () => {
  assert.equal(fail(ErrorCode.NOT_FOUND, 'missing').status, 404);
  assert.equal(fail(ErrorCode.VALIDATION_ERROR, 'bad').status, 400);
  assert.equal(fail(ErrorCode.UNAUTHORIZED, 'nope').status, 401);
  assert.equal(fail(ErrorCode.FORBIDDEN, 'denied').status, 403);
  assert.equal(fail(ErrorCode.RATE_LIMITED, 'slow down').status, 429);
  assert.equal(fail(ErrorCode.INTERNAL, 'boom').status, 500);
});

test('fail() body matches the documented error shape', () => {
  const { body, status } = fail(ErrorCode.NOT_FOUND, 'x', { requestId: 'req' });
  assert.equal(status, 404);
  assert.equal(body.error.code, 'NOT_FOUND');
  assert.equal(body.error.requestId, 'req');
});

test('toApiError() extracts an error', () => {
  const { body } = fail(ErrorCode.CONFLICT, 'dup');
  const err = toApiError(body);
  assert.ok(err instanceof ApiError);
  assert.equal(err.code, 'CONFLICT');
  assert.equal(err.message, 'dup');
});

test('toApiError returns null for a success envelope', () => {
  const env = ok({ a: 1 });
  assert.equal(toApiError(env), null);
});