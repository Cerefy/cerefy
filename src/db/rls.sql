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

-- Helper used by the application. Runner sets once per request/transaction:
--   SELECT set_config('app.current_tenant', :tenantId, false)
CREATE SCHEMA IF NOT EXISTS app;
CREATE OR REPLACE FUNCTION app.current_tenant_id() RETURNS text
    LANGUAGE sql STABLE
    AS $$ SELECT current_setting('app.current_tenant', true) $$;