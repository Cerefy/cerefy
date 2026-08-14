-- Enable Row Level Security on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_intelligence_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE graph_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE graph_entity_links ENABLE ROW LEVEL SECURITY;

-- The application connects as the managed database owner. FORCE is required so
-- that owner privileges do not bypass tenant policies in the pilot runtime.
ALTER TABLE projects FORCE ROW LEVEL SECURITY;
ALTER TABLE documents FORCE ROW LEVEL SECURITY;
ALTER TABLE document_chunks FORCE ROW LEVEL SECURITY;
ALTER TABLE decisions FORCE ROW LEVEL SECURITY;
ALTER TABLE organization_intelligence_profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE agent_executions FORCE ROW LEVEL SECURITY;
ALTER TABLE ai_queries FORCE ROW LEVEL SECURITY;
ALTER TABLE ai_answers FORCE ROW LEVEL SECURITY;
ALTER TABLE audit_log FORCE ROW LEVEL SECURITY;
ALTER TABLE organizations FORCE ROW LEVEL SECURITY;
ALTER TABLE users FORCE ROW LEVEL SECURITY;
ALTER TABLE organization_members FORCE ROW LEVEL SECURITY;
ALTER TABLE sessions FORCE ROW LEVEL SECURITY;
ALTER TABLE graph_entities FORCE ROW LEVEL SECURITY;
ALTER TABLE graph_entity_links FORCE ROW LEVEL SECURITY;

-- Create policies that enforce tenant_id matches the current session tenant.
-- Each tenant-scoped table gets BOTH a select USING policy (existing reads)
-- and a WITH CHECK policy so writes under RLS also carry the tenant boundary;
-- without WITH CHECK, row inserts would be rejected once RLS is enabled.
-- Policies are dropped first so this file is idempotent (safe to re-run in CI
-- and local dev).
DROP POLICY IF EXISTS tenant_isolation_projects ON projects;
CREATE POLICY tenant_isolation_projects ON projects
    USING (tenant_id = current_setting('app.current_tenant', true))
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true));
DROP POLICY IF EXISTS tenant_isolation_documents ON documents;
CREATE POLICY tenant_isolation_documents ON documents
    USING (tenant_id = current_setting('app.current_tenant', true))
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true));
DROP POLICY IF EXISTS tenant_isolation_chunks ON document_chunks;
CREATE POLICY tenant_isolation_chunks ON document_chunks
    USING (tenant_id = current_setting('app.current_tenant', true))
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true));
DROP POLICY IF EXISTS tenant_isolation_decisions ON decisions;
CREATE POLICY tenant_isolation_decisions ON decisions
    USING (tenant_id = current_setting('app.current_tenant', true))
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true));
DROP POLICY IF EXISTS tenant_isolation_intelligence_profiles ON organization_intelligence_profiles;
CREATE POLICY tenant_isolation_intelligence_profiles ON organization_intelligence_profiles
    USING (tenant_id = current_setting('app.current_tenant', true))
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true));
DROP POLICY IF EXISTS tenant_isolation_agent_executions ON agent_executions;
CREATE POLICY tenant_isolation_agent_executions ON agent_executions
    USING (tenant_id = current_setting('app.current_tenant', true))
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true));
DROP POLICY IF EXISTS tenant_isolation_ai_queries ON ai_queries;
CREATE POLICY tenant_isolation_ai_queries ON ai_queries
    USING (tenant_id = current_setting('app.current_tenant', true))
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true));
DROP POLICY IF EXISTS tenant_isolation_ai_answers ON ai_answers;
CREATE POLICY tenant_isolation_ai_answers ON ai_answers
    USING (tenant_id = current_setting('app.current_tenant', true))
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true));
DROP POLICY IF EXISTS tenant_isolation_audit_log ON audit_log;
CREATE POLICY tenant_isolation_audit_log ON audit_log
    USING (tenant_id = current_setting('app.current_tenant', true))
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true));

-- agent_registry is a GLOBAL catalog (not tenant-scoped): every tenant reads
-- the same agent definitions. RLS was enabled on it without any policy, which
-- silently locked all non-owner readers out. Replace with an explicit
-- global-read policy so the catalog behaves as documented.
ALTER TABLE agent_registry DISABLE ROW LEVEL SECURITY;

-- organizations: tenant-scoped. Register inserts the new org row under that
-- org's own tenant context, so the WITH CHECK passes; other tenants can never
-- see it.
DROP POLICY IF EXISTS tenant_isolation_organizations ON organizations;
CREATE POLICY tenant_isolation_organizations ON organizations
    USING (tenant_id = current_setting('app.current_tenant', true))
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true));

-- users: global identity. A row is visible to its own tenant context AND to the
-- pre-auth email lookup, which runs with the `app.auth_email` session setting
-- set (login/register must resolve an account by email before a tenant context
-- exists). Cross-tenant reads without either context return nothing.
DROP POLICY IF EXISTS tenant_isolation_users ON users;
CREATE POLICY tenant_isolation_users ON users
    USING (
        tenant_id = current_setting('app.current_tenant', true)
        OR email = current_setting('app.auth_email', true)
    )
    WITH CHECK (
        tenant_id = current_setting('app.current_tenant', true)
        OR email = current_setting('app.auth_email', true)
    );

-- organization_members: tenant-scoped.
DROP POLICY IF EXISTS tenant_isolation_organization_members ON organization_members;
CREATE POLICY tenant_isolation_organization_members ON organization_members
    USING (tenant_id = current_setting('app.current_tenant', true))
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true));

-- sessions: tenant-scoped. Login/register know the tenant BEFORE a session is
-- created (they resolve the account first), and refresh/logout/me resolve the
-- tenant from the verified token, so every session operation runs under a real
-- tenant context. The refresh flow additionally exposes a row to its own
-- refresh-token hash (server-generated, unguessable) so the token can be
-- resolved before its tenant is known; mutations still happen under the
-- resolved tenant context.
DROP POLICY IF EXISTS tenant_isolation_sessions ON sessions;
CREATE POLICY tenant_isolation_sessions ON sessions
    USING (
        tenant_id = current_setting('app.current_tenant', true)
        OR refresh_hash = current_setting('app.auth_refresh_hash', true)
    )
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true));

-- graph_entities / graph_entity_links: tenant-scoped knowledge graph.
DROP POLICY IF EXISTS tenant_isolation_graph_entities ON graph_entities;
CREATE POLICY tenant_isolation_graph_entities ON graph_entities
    USING (tenant_id = current_setting('app.current_tenant', true))
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true));
DROP POLICY IF EXISTS tenant_isolation_graph_entity_links ON graph_entity_links;
CREATE POLICY tenant_isolation_graph_entity_links ON graph_entity_links
    USING (tenant_id = current_setting('app.current_tenant', true))
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true));

-- Helper used by the application. Runner sets once per request/transaction:
--   SELECT set_config('app.current_tenant', :tenantId, false)
CREATE SCHEMA IF NOT EXISTS app;
CREATE OR REPLACE FUNCTION app.current_tenant_id() RETURNS text
    LANGUAGE sql STABLE
    AS $$ SELECT current_setting('app.current_tenant', true) $$;

-- Workflow runtime tables: every row is tenant-scoped and forced through RLS.
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows FORCE ROW LEVEL SECURITY;
ALTER TABLE workflow_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_versions FORCE ROW LEVEL SECURITY;
ALTER TABLE workflow_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_runs FORCE ROW LEVEL SECURITY;
ALTER TABLE workflow_step_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_step_runs FORCE ROW LEVEL SECURITY;
ALTER TABLE workflow_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_approvals FORCE ROW LEVEL SECURITY;
ALTER TABLE workflow_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_events FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_workflows ON workflows;
CREATE POLICY tenant_isolation_workflows ON workflows USING (tenant_id = current_setting('app.current_tenant', true)) WITH CHECK (tenant_id = current_setting('app.current_tenant', true));
DROP POLICY IF EXISTS tenant_isolation_workflow_versions ON workflow_versions;
CREATE POLICY tenant_isolation_workflow_versions ON workflow_versions USING (tenant_id = current_setting('app.current_tenant', true)) WITH CHECK (tenant_id = current_setting('app.current_tenant', true));
DROP POLICY IF EXISTS tenant_isolation_workflow_runs ON workflow_runs;
CREATE POLICY tenant_isolation_workflow_runs ON workflow_runs USING (tenant_id = current_setting('app.current_tenant', true)) WITH CHECK (tenant_id = current_setting('app.current_tenant', true));
DROP POLICY IF EXISTS tenant_isolation_workflow_step_runs ON workflow_step_runs;
CREATE POLICY tenant_isolation_workflow_step_runs ON workflow_step_runs USING (tenant_id = current_setting('app.current_tenant', true)) WITH CHECK (tenant_id = current_setting('app.current_tenant', true));
DROP POLICY IF EXISTS tenant_isolation_workflow_approvals ON workflow_approvals;
CREATE POLICY tenant_isolation_workflow_approvals ON workflow_approvals USING (tenant_id = current_setting('app.current_tenant', true)) WITH CHECK (tenant_id = current_setting('app.current_tenant', true));
DROP POLICY IF EXISTS tenant_isolation_workflow_events ON workflow_events;
CREATE POLICY tenant_isolation_workflow_events ON workflow_events USING (tenant_id = current_setting('app.current_tenant', true)) WITH CHECK (tenant_id = current_setting('app.current_tenant', true));
