import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MetricsRegistry, Metrics, resetRegistry, registry } from '../metrics';
import { tracer, resetTracer } from '../trace';
import { buildSloReport, deploymentTargets, burnRate, percentile, emptyWindow } from '../slo';
import { renderPrometheus, observeAiTokens } from '../httpMonitoring';

test('metrics: counters increment and snapshot', () => {
  resetRegistry();
  const r = new MetricsRegistry();
  r.incr('requests', { tenant: 'a' });
  r.incr('requests', { tenant: 'a' }, 2);
  r.incr('requests', { tenant: 'b' });
  assert.equal(r.counter('requests', { tenant: 'a' }), 3);
  const snap = r.snapshot();
  assert.equal(snap.counters.filter((c) => c.name === 'requests').length, 2);
});

test('metrics: histogram observe stores values', () => {
  resetRegistry();
  const r = new MetricsRegistry();
  r.observe('latency', 100);
  r.observe('latency', 200);
  assert.deepEqual(r.histogram('latency'), [100, 200]);
});

test('trace: withSpan records duration and nesting', async () => {
  resetTracer();
  const p = new Promise<void>((resolve) => setTimeout(resolve, 10));
  await tracer.withSpan('parent', async () => {
    await tracer.withSpan('child', async () => { await p; });
  });
  const spans = tracer.snapshot();
  assert.equal(spans.length, 2);
  const parent = spans.find((s) => s.name === 'parent');
  const child = spans.find((s) => s.name === 'child');
  assert.ok(parent && child);
  assert.ok(tracer.durationMs(parent) >= 5);
  assert.equal(child.parent, parent);
});

test('slo: pilot targets match doc table', () => {
  const t = deploymentTargets('pilot');
  assert.equal(t.api, 0.995);
  assert.equal(t.latencyP95Ms, 15000);
  assert.equal(t.auth, 0.999);
});

test('slo: scale targets match doc table', () => {
  const t = deploymentTargets('scale');
  assert.equal(t.api, 0.999);
  assert.equal(t.latencyP95Ms, 8000);
  assert.equal(t.auth, 0.9995);
});

test('slo: healthy window reports meeting', () => {
  const report = buildSloReport('pilot', {
    ...emptyWindow(),
    successful: 998,
    errors: 2,
    latenciesMs: Array.from({ length: 100 }, (_, i) => 8000 + i),
  });
  assert.equal(report.overall, 'meeting');
});

test('slo: degraded window breaches api availability', () => {
  const report = buildSloReport('pilot', {
    ...emptyWindow(),
    successful: 900,
    errors: 500,
  });
  assert.equal(report.apiAvailability.status, 'breaching');
  assert.ok(['at_risk', 'breaching'].includes(report.overall));
});

test('slo: burnRate grows with error rate', () => {
  const low = burnRate('pilot', { ...emptyWindow(), successful: 990, errors: 10 });
  const high = burnRate('pilot', { ...emptyWindow(), successful: 500, errors: 500 });
  assert.ok(high > low);
});

test('percentile p95', () => {
  const values = Array.from({ length: 100 }, (_, i) => i + 1);
  assert.equal(percentile(values, 95), 95);
});

test('prometheus: renders lines with labels', () => {
  resetRegistry();
  observeAiTokens('tenant-x', 1200);
  const out = renderPrometheus();
  assert.ok(out.includes('ai_tokens_per_query'));
  assert.ok(out.includes('tenantId="tenant-x"'));
});

test('registry reset isolated', () => {
  resetRegistry();
  assert.equal(registry.counter(Metrics.httpRequestsTotal), 0);
});