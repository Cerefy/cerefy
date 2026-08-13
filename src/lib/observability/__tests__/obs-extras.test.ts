import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RUNBOOKS, runbookFor, linkToRunbook } from '../runbooks';
import { observeAiOutcome, renderPrometheus } from '../httpMonitoring';
import { registry, resetRegistry } from '../metrics';

test('runbooks §4.3: every SLO/burn/cost/guardrail alert has a doc', () => {
  for (const alert of ['SLO_BURN_RATE_HIGH', 'AI_COST_ANOMALY', 'AI_GUARDRAIL_TRIP', 'AI_PROVIDER_OUTAGE']) {
    assert.ok(runbookFor(alert), `missing runbook for ${alert}`);
    assert.match(linkToRunbook(alert), /^runbook:/);
  }
});

test('runbooks §4.3: unknown alert resolves to runbook:unassigned', () => {
  assert.equal(linkToRunbook('NOTHING_KNOWN'), 'runbook:unassigned');
  assert.equal(runbookFor('NOTHING_KNOWN'), null);
});

test('runbooks §4.3: every runbook has steps', () => {
  for (const rb of RUNBOOKS) assert.ok(rb.steps.length > 0);
});

test('outcome metric §11.5: confirmed and unconfirmed counters increment', () => {
  resetRegistry();
  observeAiOutcome('t1', true);
  observeAiOutcome('t1', false);
  assert.equal(registry.counter('ai_outcome_linked_confirmed', { tenantId: 't1' }), 1);
  assert.equal(registry.counter('ai_outcome_linked_unconfirmed', { tenantId: 't1' }), 1);
  const txt = renderPrometheus();
  assert.ok(txt.includes('ai_outcome_linked_confirmed'));
});

test('chaos + fallback integration §11.6/§3.3: provider outage degrades honestly', async () => {
  const { AiPipelineChaos } = await import('../../chaos/aiChaos');
  const { FallbackRouter, RuleBasedFallbackProvider } = await import('../../llm/fallback');

  // Primary provider wrapped with a chaos-injected outage; router must fall
  // through to the fallback and return an honest "AI temporarily limited"
  // answer — never a stale/fabricated one (idempotent §3.3 degradation).
  const chaos = new AiPipelineChaos({ enabled: true, effect: 'provider_outage', faultRate: 1 });
  const failingProvider = {
    id: 'gemini',
    async complete(req: any) {
      return chaos.withProviderChaos({ id: 'gemini', complete: () => Promise.reject(new Error('unreachable')), embed: () => Promise.reject(new Error('unreachable')) } as any, async () => {
        throw new Error('unreachable');
      });
    },
    async embed() {
      throw new Error('unreachable');
    },
  };

  const router = new FallbackRouter(failingProvider as any, new RuleBasedFallbackProvider());
  const result = await router.complete({
    modelId: 'gemini-3.6-flash',
    messages: [{ role: 'user', content: 'What is the Q3 revenue?' }],
  });
  assert.match(result.text, /AI temporarily limited/);
  assert.equal(result.modelId, 'fallback-rule');
});