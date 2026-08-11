import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RuleBasedFallbackProvider, FallbackRouter } from '../fallback';
import { estimateCompletionCost } from '../types';
import { getPrompt, listPromptVersions } from '../prompts';
import { providerRegistry } from '../registry';
import { FeedbackPipeline, structureTrainingExample } from '../feedbackPipeline';
import { GOLDEN_SET, scoreAnswer, summarize } from '../eval';

test('fallback: degrades honestly and marks text', async () => {
  const provider = new RuleBasedFallbackProvider();
  const out = await provider.complete({
    modelId: 'fallback-rule',
    messages: [{ role: 'user', content: 'Analyze revenue' }],
  });
  assert.ok(out.modelId === 'fallback-rule');
  assert.ok(out.text.includes('AI temporarily limited'));
  assert.ok(out.costUsd === 0);
});

test('router: primary failure rolls to fallback', async () => {
  const failing = {
    id: 'broken',
    complete: async () => { throw new Error('down'); },
    embed: async () => ({ embedding: [0], modelId: 'broken', tokensInput: 0, costUsd: 0 }),
  };
  const fallback = new RuleBasedFallbackProvider();
  const router = new FallbackRouter(failing, fallback);
  const out = await router.complete({ modelId: 'broken', messages: [{ role: 'user', content: 'hi' }] });
  assert.equal(out.modelId, 'fallback-rule');
});

test('cost: estimate completion cost from pricing table', () => {
  const cost = estimateCompletionCost('gemini-2.5-flash', 1_000_000, 1_000_000);
  assert.ok(Math.abs(cost - 1.8) < 1e-6);
});

test('prompts: versioned registry serves known templates', () => {
  const p = getPrompt('analysis_v1');
  assert.equal(p.version, 'analysis_v1');
  assert.equal(p.modelId, 'gemini-2.5-flash');
  assert.ok(p.user({ query: 'q', sources: [] }).includes('q'));
});

test('prompts: unknown template throws', () => {
  assert.throws(() => getPrompt('nope'));
});

test('registry: registers and resolves provider', () => {
  providerRegistry.register(new RuleBasedFallbackProvider());
  providerRegistry.setPrimary('fallback-rule');
  const provider = providerRegistry.get('fallback-rule');
  assert.ok(provider);
});

test('feedback: edit produces prompt_response_pair', () => {
  const example = structureTrainingExample({
    answerId: 'a1',
    tenantId: 't',
    modelVersion: 'm1',
    promptVersion: 'p1',
    originalOutput: { prompt: 'q?', answer: 'wrong' },
    revisedOutput: { prompt: 'q?', answer: 'right' },
    action: 'edited',
    reviewerId: 'r',
    reviewedAt: new Date().toISOString(),
  });
  assert.ok(example);
  assert.equal(example.kind, 'prompt_response_pair');
  assert.equal(example.chosen, 'right');
});

test('feedback: approve is not a training example', () => {
  const example = structureTrainingExample({
    answerId: 'a2',
    tenantId: 't',
    modelVersion: 'm1',
    promptVersion: 'p1',
    originalOutput: { answer: 'ok' },
    revisedOutput: { answer: 'ok' },
    action: 'approved',
    reviewerId: 'r',
    reviewedAt: new Date().toISOString(),
  });
  assert.equal(example, null);
});

test('feedback pipeline: ingest + drain', () => {
  const pipeline = new FeedbackPipeline();
  pipeline.ingest({
    answerId: 'a3',
    tenantId: 't',
    modelVersion: 'm',
    promptVersion: 'p',
    originalOutput: { prompt: 'question', answer: 'bad' },
    revisedOutput: { prompt: 'question', answer: 'good' },
    action: 'edited',
    reviewerId: 'r',
    reviewedAt: new Date().toISOString(),
  });
  assert.equal(pipeline.count(), 1);
  assert.equal(pipeline.drain().length, 1);
  assert.equal(pipeline.count(), 0);
});

test('eval: golden set structural scoring', () => {
  const results = GOLDEN_SET.map((c) =>
    scoreAnswer(c, { answer: c.goldenAnswer, sources: c.goldenSources, confidence: 0.9 }),
  );
  const summary = summarize(results);
  assert.equal(summary.total, GOLDEN_SET.length);
  assert.equal(summary.factual, GOLDEN_SET.length);
  assert.equal(summary.citation, GOLDEN_SET.length);
  assert.equal(summary.refusal, GOLDEN_SET.length);
});

test('eval: wrong answer fails accuracy without brittle string asserts', () => {
  const [c] = GOLDEN_SET;
  const r = scoreAnswer(c, { answer: 'totally different', sources: [], confidence: 0.2 });
  assert.equal(r.factualAccuracy, false);
  assert.equal(r.citationCorrect, false);
  assert.equal(typeof r.confidence, 'number');
  assert.ok(r.confidence >= 0 && r.confidence <= 1);
});