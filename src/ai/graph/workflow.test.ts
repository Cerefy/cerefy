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

test('supervisor routes requirements work to analyst', () => {
  const next = supervisorAgent({ ...base, type: 'requirements_analysis', requirements: [{ id: 'req_1' }] });
  assert.equal(next, 'analyst');
});

test('supervisor routes everything else to governance', () => {
  const next = supervisorAgent({ ...base, type: 'governance_review' });
  assert.equal(next, 'governance');
});
