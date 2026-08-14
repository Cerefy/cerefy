import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

/**
 * §2 RLS enforcement integration test — runs against a REAL Postgres, never a
 * mocked DB layer (doc §2: "Spin up a real Postgres in CI, never mock the DB
 * layer for RLS tests specifically").
 *
 * Set DATABASE_URL_TEST when running outside CI, e.g.:
 *   DATABASE_URL_TEST=postgres://cerefy:cerefy_password@localhost:5432/cerefy_test
 * In GitHub Actions the CI workflow provisions a postgres service (superuser)
 * and exports this URL. The test provisions a dedicated non-superuser app role
 * so RLS is genuinely enforced — assertions under a superuser would be false
 * passes.
 */

const url = process.env.DATABASE_URL_TEST;
if (!url) {
  console.warn('[rls-integration] DATABASE_URL_TEST not set — skipping (runs in CI with postgres service).');
}

const APP_ROLE = 'cerefy_app';
const APP_ROLE_PASSWORD = 'cerefy_app_test';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..', '..'); // src/db/__tests__/../../..  => package root

function migrationOrder(): string[] {
  return readdirSync(join(root, 'drizzle'))
    .filter((f) => /^\d+_.+\.sql$/.test(f))
    .sort();
}

// Clone DATABASE_URL_TEST but authenticate as the non-superuser app role.
function appRoleUrl(): string {
  const u = new URL(url!);
  u.username = APP_ROLE;
  u.password = APP_ROLE_PASSWORD;
  return u.href;
}

let ready = false;

// The real migrations use the pgvector type `vector(N)` on document_chunks.
// RLS isolation tests only touch scalar columns, so when pgvector is not
// installed (e.g. a stock postgres:16 CI service, or an embedded local PG) we
// apply migrations with `vector(N)` mapped to `real[]` — a valid built-in
// array type — so the DDL parses. When pgvector IS available we prefer the
// real extension so the schema is applied verbatim.
let vectorFallback = false;

async function tryEnablePgvector(admin: pg.Client): Promise<void> {
  try {
    await admin.query('CREATE EXTENSION IF NOT EXISTS vector');
  } catch {
    vectorFallback = true;
  }
}

function migrationSql(file: string): string {
  const sql = readFileSync(join(root, 'drizzle', file), 'utf8');
  if (vectorFallback) {
    return sql
      .replace(/CREATE EXTENSION IF NOT EXISTS vector;\s*/gi, '')
      .replace(/vector\(\s*\d+\s*\)/g, 'real[]');
  }
  return sql;
}

before(async () => {
  if (!url) return;
  const admin = new pg.Client({ connectionString: url });
  await admin.connect();
  try {
    await tryEnablePgvector(admin);
    // Fresh schema each run (as the provisioning superuser).
    for (const file of migrationOrder()) {
      await admin.query(migrationSql(file));
    }
    await admin.query(readFileSync(join(root, 'src', 'db', 'rls.sql'), 'utf8'));

    // Provision a genuine non-superuser role and grant access to the schema.
    // Revoke any leftover grants first so a killed prior run can't block DROP.
    // All revokes are best-effort: the role may not exist on a fresh DB.
    await admin.query(`REVOKE ALL ON ALL TABLES IN SCHEMA public FROM "${APP_ROLE}"`).catch(() => {});
    await admin.query(`REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM "${APP_ROLE}"`).catch(() => {});
    await admin.query(`REVOKE ALL ON SCHEMA public FROM "${APP_ROLE}"`).catch(() => {});
    await admin.query(`REVOKE ALL ON SCHEMA app FROM "${APP_ROLE}"`).catch(() => {});
    await admin.query(`DROP ROLE IF EXISTS "${APP_ROLE}"`);
    await admin.query(`CREATE ROLE "${APP_ROLE}" WITH LOGIN PASSWORD '${APP_ROLE_PASSWORD}'`);
    await admin.query(`GRANT USAGE ON SCHEMA public TO "${APP_ROLE}"`);
    await admin.query(`GRANT ALL ON ALL TABLES IN SCHEMA public TO "${APP_ROLE}"`);
    await admin.query(`GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO "${APP_ROLE}"`);
    await admin.query(`GRANT USAGE ON SCHEMA app TO "${APP_ROLE}"`);
    ready = true;
  } finally {
    await admin.end();
  }
});

after(async () => {
  if (!url) return;
  const admin = new pg.Client({ connectionString: url });
  await admin.connect();
  await admin.query('DROP TABLE IF EXISTS workflow_events, workflow_approvals, workflow_step_runs, workflow_runs, workflow_versions, workflows, graph_entity_links, graph_entities, sessions, organization_members, users, organizations, ai_answers, ai_queries, agent_registry, agent_executions, decisions, document_chunks, documents, projects, organization_intelligence_profiles CASCADE');
  await admin.query('DROP FUNCTION IF EXISTS app.current_tenant_id()');
  await admin.query(`REVOKE ALL ON ALL TABLES IN SCHEMA public FROM "${APP_ROLE}"`).catch(() => {});
  await admin.query(`REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM "${APP_ROLE}"`).catch(() => {});
  await admin.query(`REVOKE ALL ON SCHEMA public FROM "${APP_ROLE}"`).catch(() => {});
  // Schema app may not exist (e.g. if before() never created it); revoke then drop.
  await admin.query(`REVOKE ALL ON SCHEMA app FROM "${APP_ROLE}"`).catch(() => {});
  await admin.query('DROP SCHEMA IF EXISTS app CASCADE');
  await admin.query(`DROP ROLE IF EXISTS "${APP_ROLE}"`);
  await admin.end();
});

/**
 * A non-superuser session that uses the session setting app.current_tenant as
 * the puppet for "who the app believes it is" — the same mechanism the app
 * layer sets per request (server.ts requireTenant path). RLS evaluates this
 * real role, so invisibility of other tenants is genuine.
 */
function tenantSession(tenant: string) {
  const client = new pg.Client({ connectionString: appRoleUrl() });
  const conn = client.connect();
  const setTenant = conn.then(async () => {
    await client.query('SET ROLE NONE');
    // SET x = $1 does not accept parameters; set_config() does.
    await client.query("SELECT set_config('app.current_tenant', $1, false)", [tenant]);
  });
  return {
    async q(text: string, params?: any[]) {
      await setTenant;
      return client.query(text, params);
    },
    async end() {
      await client.end();
    },
  };
}

test('RLS §5: cross-tenant rows are invisible — projects', async (t) => {
  if (!url) return t.skip('no DATABASE_URL_TEST');
  if (!ready) return t.skip('non-superuser role not provisioned');
  const seed = tenantSession('ten_a');
  await seed.q("INSERT INTO projects (id, tenant_id, title, code) VALUES ('00000000-0000-0000-0000-000000000001', 'ten_a', 'A only', 'A1') ON CONFLICT DO NOTHING");
  await seed.end();
  const seedB = tenantSession('ten_b');
  await seedB.q("INSERT INTO projects (id, tenant_id, title, code) VALUES ('00000000-0000-0000-0000-000000000002', 'ten_b', 'B only', 'B1') ON CONFLICT DO NOTHING");
  await seedB.end();

  const a = tenantSession('ten_a');
  const aRows = await a.q("SELECT title FROM projects");
  assert.equal(aRows.rowCount, 1);
  assert.equal(aRows.rows[0].title, 'A only');
  await a.end();

  const b = tenantSession('ten_b');
  const bRows = await b.q("SELECT title FROM projects");
  assert.equal(bRows.rowCount, 1);
  assert.equal(bRows.rows[0].title, 'B only');
  await b.end();
});

test('RLS §5: ai_answers tenant isolation — the §12 audit-critical table', async (t) => {
  if (!url) return t.skip('no DATABASE_URL_TEST');
  if (!ready) return t.skip('non-superuser role not provisioned');
  const seed = tenantSession('ten_a');
  await seed.q(`
    INSERT INTO ai_answers (id, tenant_id, model_version, prompt_version, confidence, output, sources)
    VALUES ('00000000-0000-0000-0000-000000000011', 'ten_a', 'gemini-3.6-flash', 'analysis_v1', 0.9, '{"answer":"secret A"}', '[]')`);
  await seed.end();
  const seedB = tenantSession('ten_b');
  await seedB.q(`
    INSERT INTO ai_answers (id, tenant_id, model_version, prompt_version, confidence, output, sources)
    VALUES ('00000000-0000-0000-0000-000000000012', 'ten_b', 'gemini-3.6-flash', 'analysis_v1', 0.8, '{"answer":"secret B"}', '[]')`);
  await seedB.end();

  const b = tenantSession('ten_b');
  const rows = await b.q("SELECT output FROM ai_answers");
  assert.equal(rows.rowCount, 1);
  assert.equal(rows.rows[0].output.answer, 'secret B');
  await b.end();
});

test('RLS §5: ai_queries tenant isolation (token/cost transparency per tenant)', async (t) => {
  if (!url) return t.skip('no DATABASE_URL_TEST');
  if (!ready) return t.skip('non-superuser role not provisioned');
  const seed = tenantSession('ten_a');
  await seed.q("INSERT INTO ai_queries (id, tenant_id, user_id, type, tokens_input, tokens_output, cost_usd) VALUES ('00000000-0000-0000-0000-000000000021', 'ten_a', 'u1', 'analysis', 100, 50, 0.01)");
  await seed.end();

  const b = tenantSession('ten_b');
  const rows = await b.q("SELECT cost_usd FROM ai_queries");
  assert.equal(rows.rowCount, 0);
  await b.end();
});

test('RLS §5: cross-tenant WRITES are rejected — insert with another tenant_id (WITH CHECK)', async (t) => {
  if (!url) return t.skip('no DATABASE_URL_TEST');
  if (!ready) return t.skip('non-superuser role not provisioned');
  const a = tenantSession('ten_a');
  // Inserting a row whose tenant_id is ten_b while the session is ten_a must
  // fail the WITH CHECK policy — a cross-tenant write is not just invisible
  // on read, it cannot be created at all.
  await assert.rejects(
    a.q("INSERT INTO projects (id, tenant_id, title, code) VALUES ('00000000-0000-0000-0000-000000000099', 'ten_b', 'sneak', 'S1')"),
    /new row violates row-level security policy/,
  );
  // The row must not exist even as an admin scan (no partial write).
  const b = tenantSession('ten_b');
  const rows = await b.q("SELECT title FROM projects WHERE id = '00000000-0000-0000-0000-000000000099'");
  assert.equal(rows.rowCount, 0);
  await a.end();
  await b.end();
});

test('RLS §5: cross-tenant UPDATE is a silent no-op (can never tamper another tenant)', async (t) => {
  if (!url) return t.skip('no DATABASE_URL_TEST');
  if (!ready) return t.skip('non-superuser role not provisioned');
  const seedA = tenantSession('ten_a');
  await seedA.q("INSERT INTO projects (id, tenant_id, title, code) VALUES ('00000000-0000-0000-0000-000000000030', 'ten_a', 'A title', 'A2') ON CONFLICT DO NOTHING");
  await seedA.end();

  const b = tenantSession('ten_b');
  // ten_b attempts to overwrite ten_a's row: RLS makes the target invisible,
  // so UPDATE affects zero rows and the original survives untouched.
  const upd = await b.q("UPDATE projects SET title = 'hacked' WHERE id = '00000000-0000-0000-0000-000000000030'");
  assert.equal(upd.rowCount, 0);
  await b.end();

  const a = tenantSession('ten_a');
  const rows = await a.q("SELECT title FROM projects WHERE id = '00000000-0000-0000-0000-000000000030'");
  assert.equal(rows.rowCount, 1);
  assert.equal(rows.rows[0].title, 'A title');
  await a.end();
});

test('RLS §5: documents + document_chunks tenant isolation (read + write-reject)', async (t) => {
  if (!url) return t.skip('no DATABASE_URL_TEST');
  if (!ready) return t.skip('non-superuser role not provisioned');
  const seedA = tenantSession('ten_a');
  await seedA.q("INSERT INTO documents (id, tenant_id, title, mime_type, raw_content, status) VALUES ('00000000-0000-0000-0000-000000000041', 'ten_a', 'Doc A', 'text/plain', 'confidential A', 'processed') ON CONFLICT DO NOTHING");
  await seedA.q("INSERT INTO document_chunks (id, tenant_id, document_id, chunk_index, content) VALUES ('00000000-0000-0000-0000-000000000042', 'ten_a', '00000000-0000-0000-0000-000000000041', 0, 'chunk A') ON CONFLICT DO NOTHING");
  await seedA.end();

  const b = tenantSession('ten_b');
  const docs = await b.q("SELECT title FROM documents");
  const chunks = await b.q("SELECT content FROM document_chunks");
  assert.equal(docs.rowCount, 0, 'ten_b must not read ten_a documents');
  assert.equal(chunks.rowCount, 0, 'ten_b must not read ten_a chunks');
  await assert.rejects(
    b.q("INSERT INTO documents (id, tenant_id, title, mime_type, raw_content, status) VALUES ('00000000-0000-0000-0000-000000000043', 'ten_a', 'sneak', 'text/plain', 'x', 'processed')"),
    /row-level security/,
    'cross-tenant document insert must be rejected by WITH CHECK',
  );
  await b.end();
});

test('RLS §5: decisions + audit_log tenant isolation', async (t) => {
  if (!url) return t.skip('no DATABASE_URL_TEST');
  if (!ready) return t.skip('non-superuser role not provisioned');
  const seedA = tenantSession('ten_a');
  await seedA.q("INSERT INTO decisions (id, tenant_id, title, question, status) VALUES ('00000000-0000-0000-0000-000000000051', 'ten_a', 'Decision A', 'Should A expand?', 'PENDING') ON CONFLICT DO NOTHING");
  await seedA.q("INSERT INTO audit_log (id, tenant_id, action, actor_id, actor_role, resource, detail) VALUES ('00000000-0000-0000-0000-000000000052', 'ten_a', 'project.create', 'u1', 'admin', 'project', '{}') ON CONFLICT DO NOTHING");
  await seedA.end();

  const b = tenantSession('ten_b');
  const decisions = await b.q("SELECT title FROM decisions");
  const audit = await b.q("SELECT action FROM audit_log");
  assert.equal(decisions.rowCount, 0, 'ten_b must not read ten_a decisions');
  assert.equal(audit.rowCount, 0, 'ten_b must not read ten_a audit_log');
  await assert.rejects(
    b.q("INSERT INTO audit_log (id, tenant_id, action, actor_id, actor_role, resource, detail) VALUES ('00000000-0000-0000-0000-000000000053', 'ten_a', 'project.delete', 'u2', 'admin', 'project', '{}')"),
    /row-level security/,
    'cross-tenant audit insert must be rejected',
  );
  await b.end();
});

test('RLS §5: agent_executions tenant isolation + write-reject', async (t) => {
  if (!url) return t.skip('no DATABASE_URL_TEST');
  if (!ready) return t.skip('non-superuser role not provisioned');
  const seedA = tenantSession('ten_a');
  await seedA.q("INSERT INTO agent_executions (id, tenant_id, type, status, current_agent, confidence, input, event_log, errors) VALUES ('00000000-0000-0000-0000-000000000061', 'ten_a', 'analysis', 'RUNNING', 'supervisor', 0, '{}', '[]', '[]') ON CONFLICT DO NOTHING");
  await seedA.end();

  const b = tenantSession('ten_b');
  const rows = await b.q("SELECT id FROM agent_executions");
  assert.equal(rows.rowCount, 0, 'ten_b must not read ten_a executions');
  await assert.rejects(
    b.q("INSERT INTO agent_executions (id, tenant_id, type, status, current_agent, confidence, input, event_log, errors) VALUES ('00000000-0000-0000-0000-000000000062', 'ten_a', 'analysis', 'RUNNING', 'supervisor', 0, '{}', '[]', '[]')"),
    /row-level security/,
    'cross-tenant execution insert must be rejected',
  );
  await b.end();
});

test('RLS §5: workflow runtime tables are tenant-isolated end to end', async (t) => {
  if (!url) return t.skip('no DATABASE_URL_TEST');
  if (!ready) return t.skip('non-superuser role not provisioned');

  const seedA = tenantSession('ten_a');
  await seedA.q(`
    INSERT INTO workflows (id, tenant_id, name, trigger_type, created_by)
    VALUES ('00000000-0000-0000-0000-000000000101', 'ten_a', 'A workflow', 'MANUAL', 'u1')
  `);
  await seedA.q(`
    INSERT INTO workflow_versions (id, workflow_id, tenant_id, version, definition, created_by)
    VALUES ('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000101', 'ten_a', 1, '{"steps":[]}', 'u1')
  `);
  await seedA.q(`
    INSERT INTO workflow_runs (id, workflow_id, workflow_version_id, tenant_id, input, created_by)
    VALUES ('00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000102', 'ten_a', '{}', 'u1')
  `);
  await seedA.q(`
    INSERT INTO workflow_step_runs (id, workflow_run_id, tenant_id, step_key, step_type, input)
    VALUES ('00000000-0000-0000-0000-000000000104', '00000000-0000-0000-0000-000000000103', 'ten_a', 'approval', 'APPROVAL', '{}')
  `);
  await seedA.q(`
    INSERT INTO workflow_approvals (id, workflow_run_id, workflow_step_run_id, tenant_id)
    VALUES ('00000000-0000-0000-0000-000000000105', '00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000104', 'ten_a')
  `);
  await seedA.q(`
    INSERT INTO workflow_events (id, workflow_run_id, tenant_id, event_type, payload)
    VALUES ('00000000-0000-0000-0000-000000000106', '00000000-0000-0000-0000-000000000103', 'ten_a', 'workflow.started', '{}')
  `);
  await seedA.end();

  const b = tenantSession('ten_b');
  for (const table of ['workflows', 'workflow_versions', 'workflow_runs', 'workflow_step_runs', 'workflow_approvals', 'workflow_events']) {
    const rows = await b.q(`SELECT id FROM ${table}`);
    assert.equal(rows.rowCount, 0, `ten_b must not read ten_a rows in ${table}`);
  }
  await assert.rejects(
    b.q("INSERT INTO workflows (id, tenant_id, name, trigger_type, created_by) VALUES ('00000000-0000-0000-0000-000000000107', 'ten_a', 'sneak', 'MANUAL', 'u2')"),
    /row-level security/,
    'cross-tenant workflow insert must be rejected',
  );
  await b.end();
});

test('RLS §5: users are invisible across tenants without an auth_email lookup context', async (t) => {
  if (!url) return t.skip('no DATABASE_URL_TEST');
  if (!ready) return t.skip('non-superuser role not provisioned');
  const seedA = tenantSession('ten_a');
  await seedA.q("INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, role) VALUES ('00000000-0000-0000-0000-000000000071', 'ten_a', 'a@cerefy.test', 'hash', 'A', 'User', 'admin') ON CONFLICT DO NOTHING");
  await seedA.end();
  const seedB = tenantSession('ten_b');
  await seedB.q("INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, role) VALUES ('00000000-0000-0000-0000-000000000072', 'ten_b', 'b@cerefy.test', 'hash', 'B', 'User', 'admin') ON CONFLICT DO NOTHING");
  await seedB.end();

  // ten_b without any auth_email setting must NOT see ten_a's user row.
  const b = tenantSession('ten_b');
  const all = await b.q("SELECT email FROM users");
  assert.equal(all.rowCount, 1, 'ten_b sees only its own user under tenant context');
  assert.equal(all.rows[0].email, 'b@cerefy.test');
  await b.end();

  // The pre-auth email lookup path (app.auth_email set) can resolve an account
  // by email across the boundary — this is what login needs before a tenant
  // context exists.
  const lookup = tenantSession('ten_b');
  await lookup.q("SELECT set_config('app.auth_email', 'a@cerefy.test', false)");
  const found = await lookup.q("SELECT id, tenant_id FROM users WHERE email = 'a@cerefy.test'");
  assert.equal(found.rowCount, 1);
  assert.equal(found.rows[0].tenant_id, 'ten_a');
  await lookup.end();
});

test('RLS §5: sessions + graph_entities tenant isolation (read + write-reject)', async (t) => {
  if (!url) return t.skip('no DATABASE_URL_TEST');
  if (!ready) return t.skip('non-superuser role not provisioned');
  const seedA = tenantSession('ten_a');
  await seedA.q("INSERT INTO sessions (id, tenant_id, user_id, refresh_hash, expires_at) VALUES ('00000000-0000-0000-0000-000000000081', 'ten_a', '00000000-0000-0000-0000-000000000071', 'h1', now() + interval '1 day') ON CONFLICT DO NOTHING");
  await seedA.q("INSERT INTO graph_entities (id, tenant_id, name, label) VALUES ('00000000-0000-0000-0000-000000000082', 'ten_a', 'Entity A', 'Policy') ON CONFLICT DO NOTHING");
  await seedA.end();

  const b = tenantSession('ten_b');
  const sessions = await b.q("SELECT id FROM sessions");
  const entities = await b.q("SELECT name FROM graph_entities");
  assert.equal(sessions.rowCount, 0, 'ten_b must not read ten_a sessions');
  assert.equal(entities.rowCount, 0, 'ten_b must not read ten_a graph entities');
  await assert.rejects(
    b.q("INSERT INTO graph_entities (id, tenant_id, name, label) VALUES ('00000000-0000-0000-0000-000000000083', 'ten_a', 'sneak', 'Policy')"),
    /row-level security/,
    'cross-tenant graph entity insert must be rejected',
  );
  await b.end();
});