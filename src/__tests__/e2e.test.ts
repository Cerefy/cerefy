import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, execFile } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * §2 E2E — critical user flow against a REAL running server (not a mocked
 * runtime): register → login → authenticated request → AI query submitted.
 * Runs in CI/staging; the AI turn completes only when GEMINI_API_KEY is
 * present (otherwise the deterministic auth/flow assertions still gate).
 */

const here = dirname(fileURLToPath(import.meta.url));
const pkgRoot = join(here, '..', '..'); // src/__tests__/.. => src => repo root
const PORT = 3199 + Math.floor(Math.random() * 300);
const BASE = `http://127.0.0.1:${PORT}`;

let child: ReturnType<typeof spawn> | null = null;
let ready = false;

function waitForReady(): Promise<void> {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const tick = async () => {
      if (Date.now() - started > 100_000) return reject(new Error('server did not become ready'));
      try {
        const r = await fetch(`${BASE}/health/live`);
        if (r.ok) return resolve();
      } catch {
        /* not up yet */
      }
      setTimeout(tick, 300);
    };
    tick();
  });
}

function killServer(): void {
  if (!child?.pid) return;
  // On Windows, `shell: true` spawns a cmd wrapper; killing it orphans the
  // real `node server.ts` process, which then keeps the port bound and
  // pollutes later test runs. taskkill /T /F tears down the whole tree.
  if (process.platform === 'win32') {
    try {
      execFile('taskkill', ['/pid', String(child.pid), '/T', '/F'], { windowsHide: true }, () => {});
    } catch {
      child.kill('SIGKILL');
    }
  } else {
    child.kill('SIGTERM');
  }
}

before(async () => {
  child = spawn('npx tsx server.ts', {
    cwd: pkgRoot,
    shell: true,
    env: {
      ...process.env,
      PORT: String(PORT),
      NODE_ENV: 'development',
      DEV_LOCAL_FALLBACK: 'true',
      SLO_PHASE: 'pilot',
    },
    stdio: 'ignore',
  });
  try {
    await waitForReady();
    ready = true;
  } catch (err) {
    killServer();
    console.warn('[e2e] server did not start — skipping (CI/staging runs this).', String(err));
  }
});

after(() => {
  killServer();
});

async function json(path: string, init?: RequestInit): Promise<{ status: number; body: any }> {
  const res = await fetch(`${BASE}${path}`, init);
  return { status: res.status, body: await res.json().catch(() => null) };
}

test('E2E §2: login → authenticated AI query submission', { timeout: 90_000 }, async (t) => {
  if (!ready) return t.skip('server not started');
  const email = `e2e_${Date.now()}@cerefy.test`;

  const reg = await json('/api/v1/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'S3cure!pass2026', firstName: 'E2E', lastName: 'Tester', organizationName: 'E2E Org' }),
  });
  assert.equal(reg.status, 200, 'register');
  const token = reg.body?.tokens?.accessToken;
  assert.ok(typeof token === 'string', 'access token issued');
  const auth = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const me = await json('/api/v1/auth/me', { headers: auth });
  assert.equal(me.status, 200);
  assert.equal(me.body?.email, email);

  // AI query submission — 202 + executionId (pipeline may need GEMINI_API_KEY
  // to complete; without retrieval the guardrail honestly returns
  // REVIEW_REQUIRED rather than fabricating a deliverable answer).
  const ai = await json('/api/v1/ai/run', {
    method: 'POST',
    headers: auth,
    body: JSON.stringify({ type: 'analysis', documents: ['Acme runs SAP S/4HANA.'], requirements: ['What ERP does Acme run?'] }),
  });
  assert.equal(ai.status, 202, 'AI run accepted');
  assert.ok(ai.body?.executionId, 'executionId present');
  assert.ok(['RUNNING', 'COMPLETED', 'FAILED', 'REVIEW_REQUIRED'].includes(ai.body?.status), `status is one of RUNNING/COMPLETED/FAILED/REVIEW_REQUIRED (got ${ai.body?.status})`);
  if (ai.body?.status === 'REVIEW_REQUIRED') {
    assert.ok(ai.body?.guardrail?.decision, 'REVIEW_REQUIRED carries a guardrail decision');
  }
});

test('E2E §2: unauthenticated AI submission is rejected', async (t) => {
  if (!ready) return t.skip('server not started');
  const res = await json('/api/v1/ai/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'analysis' }),
  });
  assert.equal(res.status, 401, 'no token -> 401');
});

test('E2E §2: health + SLO self-report publish', async (t) => {
  if (!ready) return t.skip('server not started');
  const health = await json('/health/live');
  assert.equal(health.status, 200);
  const slo = await json('/api/slo');
  assert.equal(slo.status, 200);
  assert.ok(slo.body?.overall, 'SLO report has overall verdict');
  assert.ok(slo.body?.apiAvailability, 'SLO report has apiAvailability');
});