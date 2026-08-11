import { test } from 'node:test';
import assert from 'node:assert/strict';
import { can, assertPermission, rolesFor } from '../rbac';
import { scanText, scanFile } from '../secretScan';
import { createAuditLogger, MemoryAuditSink } from '../auditLog';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeFileSync, rmSync } from 'node:fs';

const fixtureDir = path.dirname(fileURLToPath(import.meta.url));

test('rbac: admin can run queries and approve', () => {
  assert.equal(can('admin', 'query:run'), true);
  assert.equal(can('admin', 'approve:decision'), true);
  assert.equal(can('admin', 'read:audit'), true);
});

test('rbac: member cannot approve decisions', () => {
  assert.equal(can('member', 'approve:decision'), false);
  assert.equal(can('member', 'read:audit'), false);
});

test('rbac: approver cannot read audit log', () => {
  assert.equal(can('approver', 'read:audit'), false);
});

test('rbac: auditor reads audit only', () => {
  assert.equal(can('auditor', 'read:audit'), true);
  assert.equal(can('auditor', 'approve:decision'), false);
});

test('rbac: resource-scoped permission', () => {
  assert.equal(can('analyst', 'simulate:decision', 'decision'), true);
  assert.equal(can('analyst', 'simulate:decision', 'tenant'), false);
});

test('rbac: assertPermission throws on denial', () => {
  assert.throws(() => assertPermission('member', 'approve:decision'));
});

test('rbac: rolesFor returns roles per resource/action', () => {
  const roles = rolesFor('audit.log', 'read:audit');
  assert.ok(roles.includes('admin'));
  assert.ok(roles.includes('auditor'));
});

test('secretScan: safe text returns no hits', () => {
  const result = scanText('const greeting = "hello world";\n// nothing sensitive\n');
  assert.equal(result.safe, true);
});

test('secretScan: detects stripe key and masks it', () => {
  const fakeStripeKey = `sk_${'live_' + 'abcdefghijklmnopqrstuvwxyz1234567890abcdef'}`;
  const result = scanText(`apiKey = ${fakeStripeKey}`);
  assert.equal(result.safe, false);
  assert.ok(result.hits.some((h) => h.detector === 'stripe_secret_key'));
  assert.ok(!result.hits.some((h) => h.value.includes('abcdefghijkl')));
});

test('secretScan: detects private key block', () => {
  const pem = `${'-----BEGIN '}RSA PRIVATE KEY-----\nAAAA`;
  const result = scanText(pem);
  assert.equal(result.safe, false);
  assert.ok(result.hits.some((h) => h.detector === 'private_key_block'));
});

test('secretScan: scans files on disk', () => {
  const tmp = path.join(fixtureDir, `.tmp-unsafe-${process.pid}.env`);
  const fakeKey = `sk-${'DummyFakeKeyUsedOnlyByTests' + '0000000000000000'}`;
  writeFileSync(tmp, `OPENAI_API_KEY=${fakeKey}\n`);
  try {
    const result = scanFile(tmp);
    assert.equal(result.safe, false);
  } finally {
    rmSync(tmp, { force: true });
  }
});

test('auditLog: records write-once entries', async () => {
  const sink = new MemoryAuditSink();
  const log = createAuditLogger({ sink });
  const entry = await log.log({ action: 'decide.approve', actorId: 'u1', actorRole: 'admin', tenantId: 't1', resource: 'decision' });
  assert.ok(entry.id.startsWith('audit_'));
  assert.equal(sink.records.length, 1);
});

test('auditLog: sealed log refuses writes', async () => {
  const sink = new MemoryAuditSink();
  const log = createAuditLogger({ sink, sealed: true });
  await assert.rejects(
    log.log({ action: 'x', actorId: 'u', actorRole: 'member', tenantId: 't' }),
    /sealed/,
  );
});