/// <reference types="node" />
import test from 'node:test';
import assert from 'node:assert/strict';
import { supervisorAgent } from './supervisor';
import { createInitialExecutionState } from './workflow';

const base = createInitialExecutionState({
  type: 'document_analysis',
  tenantId: 'tenant_1',
  userId: 'user_1',
  documents: [],
  requirements: [],
  decisions: [],
});

test('supervisor routes document analysis to discovery', () => {
  const next = supervisorAgent({ ...base, documents: [{ id: 'doc_1' }] });
  assert.equal(next, 'discovery');
});

test('supervisor routes requirements work to requirement agent', () => {
  const next = supervisorAgent({ ...base, type: 'requirements_analysis', requirements: [{ id: 'req_1' }] });
  assert.equal(next, 'requirement');
});

test('supervisor routes process work to process agent', () => {
  const next = supervisorAgent({ ...base, type: 'process_analysis' });
  assert.equal(next, 'process');
});

test('supervisor routes data work to data agent', () => {
  const next = supervisorAgent({ ...base, type: 'data_analysis' });
  assert.equal(next, 'data');
});

test('supervisor routes code work to code agent', () => {
  const next = supervisorAgent({ ...base, type: 'code_generation' });
  assert.equal(next, 'code');
});

test('supervisor routes validation work to validation agent', () => {
  const next = supervisorAgent({ ...base, type: 'validation' });
  assert.equal(next, 'validation');
});

test('supervisor routes governance work to governance', () => {
  const next = supervisorAgent({ ...base, type: 'governance_review' });
  assert.equal(next, 'governance');
});

test('initial execution state defaults all completion flags to false', () => {
  const state = createInitialExecutionState({
    type: 'discovery',
    tenantId: 'tenant_1',
    userId: 'user_1',
  });

  assert.equal(state.memoryComplete, false);
  assert.equal(state.discoveryComplete, false);
  assert.equal(state.requirementComplete, false);
  assert.equal(state.processComplete, false);
  assert.equal(state.dataComplete, false);
  assert.equal(state.codeComplete, false);
  assert.equal(state.validationComplete, false);
  assert.equal(state.nextAgent, 'supervisor');
});
