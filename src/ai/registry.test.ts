/// <reference types="node" />
import test from 'node:test';
import assert from 'node:assert/strict';
import { coreAgentDefinitions } from './registry';

test('core registry includes the enterprise agents', () => {
  const names = coreAgentDefinitions.map((agent) => agent.name);
  assert.deepEqual(
    names.sort(),
    ['analyst', 'code', 'data', 'discovery', 'governance', 'memory', 'process', 'requirement', 'supervisor', 'validation'].sort(),
  );
});
