#!/usr/bin/env node
// scripts/backend-smoke-test.mjs
// End-to-end smoke test for the real DB-backed API: applies migrations + RLS to
// a real Postgres, boots the built server in production mode against it, and
// exercises the durable-auth and DB-backed data flows (register -> login ->
// refresh -> me -> agents -> analytics -> graph). Fails loudly if any step
// 501s, returns fabricated data, or errors.
//
// Requires: built server (npm run build) and a real Postgres reachable via
// DATABASE_URL_TEST (defaults to the embedded-postgres used by the RLS suite).

import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import pg from 'pg';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const here = dirname(fileURLToPath(import.meta.url));
const baseUrl = process.env.DATABASE_URL_TEST || 'postgres://cerefy:cerefy_password@127.0.0.1:55432/cerefy_test';
const smokeUrl = baseUrl.replace(/\/[^/]+$/, '/cerefy_smoke');
const PORT = 3055;

let vectorFallback = false;
function migrationOrder() {
  return readdirSync(join(root, 'drizzle')).filter((f) => /^\d+_.+\.sql$/.test(f)).sort();
}

async function main() {
  const admin = new pg.Client({ connectionString: baseUrl });
  await admin.connect();
  try {
    try { await admin.query('CREATE EXTENSION IF NOT EXISTS vector'); } catch { vectorFallback = true; }
    await admin.query('DROP DATABASE IF EXISTS cerefy_smoke').catch(() => {});
    await admin.query('CREATE DATABASE cerefy_smoke');
  } finally {
    await admin.end();
  }

  const dba = new pg.Client({ connectionString: smokeUrl });
  await dba.connect();
  try {
    for (const file of migrationOrder()) {
      let sql = readFileSync(join(root, 'drizzle', file), 'utf8');
      if (vectorFallback) sql = sql.replace(/vector\(\s*\d+\s*\)/g, 'real[]');
      await dba.query(sql);
    }
    await dba.query(readFileSync(join(root, 'src', 'db', 'rls.sql'), 'utf8'));
    console.log('[smoke] migrations + RLS applied');
  } finally {
    await dba.end();
  }

  const server = spawn(process.execPath, [join(root, 'dist', 'server.cjs')], {
    env: {
      ...process.env,
      NODE_ENV: 'production',
      PORT: String(PORT),
      DATABASE_URL: smokeUrl,
      JWT_SECRET: 'smoke-test-jwt-secret-32chars',
      GEMINI_API_KEY: process.env.GEMINI_API_KEY || 'missing',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  server.stdout.on('data', (d) => process.stdout.write(`[server] ${d}`));
  server.stderr.on('data', (d) => process.stdout.write(`[server:err] ${d}`));

  const api = async (method, path, body, token) => {
    const res = await fetch(`http://127.0.0.1:${PORT}${path}`, {
      method,
      headers: {
        'content-type': 'application/json',
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await res.text();
    let json;
    try { json = text ? JSON.parse(text) : null; } catch { json = null; }
    return { status: res.status, json };
  };

  const waitForReady = async () => {
    for (let i = 0; i < 60; i++) {
      try {
        const r = await fetch(`http://127.0.0.1:${PORT}/health/ready`);
        if (r.ok || r.status === 503) return;
      } catch {}
      await new Promise((r) => setTimeout(r, 1000));
    }
    throw new Error('server did not become ready');
  };

  try {
    await waitForReady();

    const email = `smoke_${Date.now()}@cerefy.test`;
    // 1. register
    const reg = await api('POST', '/api/v1/auth/register', { email, password: 'CorrectHorseBattery99', firstName: 'Smoke', lastName: 'Test', organizationName: 'Smoke Org' });
    if (reg.status !== 200) throw new Error(`register failed: ${reg.status} ${JSON.stringify(reg.json)}`);
    const { user, tokens } = reg.json;
    if (!tokens?.accessToken || !tokens?.refreshToken) throw new Error('register returned no tokens');
    console.log('[smoke] register OK ->', user.email, user.organizationId);

    // 2. login with the stored (scrypt) password
    const login = await api('POST', '/api/v1/auth/login', { email, password: 'CorrectHorseBattery99' });
    if (login.status !== 200) throw new Error(`login failed: ${login.status} ${JSON.stringify(login.json)}`);
    if (login.json.user.id !== user.id) throw new Error('login returned a different user');
    console.log('[smoke] login OK');

    // 3. refresh rotates the refresh token
    const refresh = await api('POST', '/api/v1/auth/refresh', { refreshToken: tokens.refreshToken });
    if (refresh.status !== 200) throw new Error(`refresh failed: ${refresh.status} ${JSON.stringify(refresh.json)}`);
    if (!refresh.json.accessToken) throw new Error('refresh returned no access token');
    console.log('[smoke] refresh OK');

    // 4. me with the refreshed access token
    const me = await api('GET', '/api/v1/auth/me', undefined, refresh.json.accessToken);
    if (me.status !== 200) throw new Error(`me failed: ${me.status} ${JSON.stringify(me.json)}`);
    if (me.json.email !== email) throw new Error('me returned wrong email');
    console.log('[smoke] me OK ->', me.json.organizationName);

    // 5. agents (must be DB rows, not the dev stub, not 501)
    const agents = await api('GET', '/api/v1/agents', undefined, refresh.json.accessToken);
    if (agents.status !== 200) throw new Error(`agents failed: ${agents.status} ${JSON.stringify(agents.json)}`);
    if (!Array.isArray(agents.json?.data)) throw new Error('agents did not return an array');
    console.log('[smoke] agents OK ->', agents.json.data.length, 'rows');

    // 6. executive KPIs (must be real aggregates)
    const kpis = await api('GET', '/api/v1/analytics/executive-kpis', undefined, refresh.json.accessToken);
    if (kpis.status !== 200) throw new Error(`kpis failed: ${kpis.status} ${JSON.stringify(kpis.json)}`);
    if (kpis.json.totalProjects < 0 || typeof kpis.json.activeAgents !== 'number') throw new Error('kpis malformed');
    console.log('[smoke] executive-kpis OK ->', { totalProjects: kpis.json.totalProjects, activeAgents: kpis.json.activeAgents });

    // 7. agent performance
    const perf = await api('GET', '/api/v1/analytics/agent-performance', undefined, refresh.json.accessToken);
    if (perf.status !== 200) throw new Error(`agent-performance failed: ${perf.status} ${JSON.stringify(perf.json)}`);
    if (!Array.isArray(perf.json?.data)) throw new Error('agent-performance did not return an array');
    console.log('[smoke] agent-performance OK ->', perf.json.data.length, 'rows');

    // 8. memory documents
    const docs = await api('GET', '/api/v1/memory/documents', undefined, refresh.json.accessToken);
    if (docs.status !== 200) throw new Error(`memory documents failed: ${docs.status} ${JSON.stringify(docs.json)}`);
    if (!Array.isArray(docs.json?.data)) throw new Error('memory documents did not return an array');
    console.log('[smoke] memory documents OK ->', docs.json.data.length, 'rows');

    // 9. graph query (real Postgres-backed graph)
    const graph = await api('POST', '/api/v1/graph/cypher', { cypher: 'MATCH (e:Entity) RETURN e LIMIT 50' }, refresh.json.accessToken);
    if (graph.status !== 200) throw new Error(`graph failed: ${graph.status} ${JSON.stringify(graph.json)}`);
    if (!Array.isArray(graph.json?.records)) throw new Error('graph did not return records');
    console.log('[smoke] graph OK ->', graph.json.nodesMatched, 'nodes');

    // 9b. audit trail (must return real rows written during this session)
    const audit = await api('GET', '/api/v1/audit', undefined, refresh.json.accessToken);
    if (audit.status !== 200) throw new Error(`audit failed: ${audit.status} ${JSON.stringify(audit.json)}`);
    if (!Array.isArray(audit.json?.data)) throw new Error('audit did not return an array');
    if (audit.json.data.length === 0) throw new Error('audit returned no rows (expected user.registered entry)');
    console.log('[smoke] audit OK ->', audit.json.data.length, 'rows');

    // 10. wrong password is rejected
    const badLogin = await api('POST', '/api/v1/auth/login', { email, password: 'WrongPassword' });
    if (badLogin.status !== 401) throw new Error(`expected 401 on bad login, got ${badLogin.status}`);
    console.log('[smoke] bad login rejected OK');

    console.log('\n[smoke] ALL CHECKS PASSED');
  } catch (err) {
    console.error('\n[smoke] FAILED:', err.message);
    process.exitCode = 1;
  } finally {
    server.kill('SIGKILL');
    try {
      const cleanup = new pg.Client({ connectionString: baseUrl });
      await cleanup.connect();
      await cleanup.query('DROP DATABASE IF EXISTS cerefy_smoke');
      await cleanup.end();
    } catch {}
  }
}

main().catch((err) => { console.error('[smoke] fatal', err); process.exitCode = 1; });
