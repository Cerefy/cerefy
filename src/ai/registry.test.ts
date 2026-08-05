import test from 'node:test';
import assert from 'node:assert/strict';
import { coreAgentDefinitions } from './registry';

test('core registry includes the production agents', () => {
  const names = coreAgentDefinitions.map((agent) => agent.name);
  assert.deepEqual(names.sort(), ['analyst', 'discovery', 'governance', 'memory', 'supervisor'].sort());
});
