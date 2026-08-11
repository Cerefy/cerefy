import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FeatureFlagStore } from '../../featureFlags';
import { createJobQueue, InMemoryJobQueue } from '../jobQueue';

test('feature flags §7: default disabled, fail-closed on undeclared names', () => {
  const store = new FeatureFlagStore({ reconstruction_endpoint: false, outcome_linking: false });
  assert.equal(store.isEnabled('reconstruction_endpoint'), false);
  assert.equal(store.isEnabled('typo_flag_that_does_not_exist'), false); // fail closed
});

test('feature flags §7: per-tenant override without global change', () => {
  const store = new FeatureFlagStore({ reconstruction_endpoint: false });
  store.setOverride('tenant_a', 'reconstruction_endpoint', true);
  assert.equal(store.isEnabled('reconstruction_endpoint', 'tenant_a'), true);
  assert.equal(store.isEnabled('reconstruction_endpoint', 'tenant_b'), false);
  assert.equal(store.isEnabled('reconstruction_endpoint'), false);
});

test('feature flags §7: setOverride rejects undeclared flags (typo protection)', () => {
  const store = new FeatureFlagStore({ reconstruction_endpoint: false });
  assert.throws(() => store.setOverride('t1', 'reconstrction_endpoint', true), /Unknown feature flag/);
});

test('feature flags §7: clearOverrides restores defaults', () => {
  const store = new FeatureFlagStore({ outcome_linking: false });
  store.setOverride('t1', 'outcome_linking', true);
  assert.equal(store.isEnabled('outcome_linking', 't1'), true);
  store.clearOverrides('t1');
  assert.equal(store.isEnabled('outcome_linking', 't1'), false);
});

test('job queue §6.3: enqueue + worker processes to completion', async () => {
  const queue = createJobQueue();
  const seen: string[] = [];
  queue.register(async (job) => {
    seen.push(job.type);
  });
  await new Promise<void>((resolve) => setTimeout(resolve, 20));
  const job = await queue.enqueue('ingestion', { documentId: 'd1' });
  assert.ok(job.id.startsWith('job_'));
  await queue.close();
  assert.deepEqual(seen, ['ingestion']);
  assert.equal(queue.completedCount(), 1);
  assert.equal(queue.pendingCount(), 0);
});

test('job queue §6.3: retries then fails with onFailure hook', async () => {
  let attempts = 0;
  let reported: unknown;
  const queue = new InMemoryJobQueue({
    maxRetries: 2,
    backoffMs: 5,
    onFailure: (job, err) => {
      reported = err;
      void job;
    },
  });
  queue.register(async () => {
    attempts++;
    throw new Error('boom');
  });
  await queue.enqueue('agent_execute', {});
  await new Promise((r) => setTimeout(r, 80));
  await queue.close();
  assert.ok(attempts >= 2, `expected retries, got ${attempts}`);
  assert.equal(queue.failedCount(), 1);
  assert.match(String(reported), /boom/);
});

test('job queue §6.3: enqueue before worker registers is still processed', async () => {
  const queue = createJobQueue();
  const job = await queue.enqueue('ingestion', {});
  queue.register(async () => {});
  await queue.close();
  assert.equal(queue.completedCount(), 1);
  assert.ok(job.id);
});