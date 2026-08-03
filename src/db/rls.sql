-- Enable Row Level Security on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE decisions ENABLE ROW LEVEL SECURITY;

-- Create policies that enforce tenant_id matches the current session tenant
CREATE POLICY tenant_isolation_projects ON projects
    USING (tenant_id = current_setting('app.current_tenant', true));

CREATE POLICY tenant_isolation_documents ON documents
    USING (tenant_id = current_setting('app.current_tenant', true));

CREATE POLICY tenant_isolation_chunks ON document_chunks
    USING (tenant_id = current_setting('app.current_tenant', true));

CREATE POLICY tenant_isolation_decisions ON decisions
    USING (tenant_id = current_setting('app.current_tenant', true));
