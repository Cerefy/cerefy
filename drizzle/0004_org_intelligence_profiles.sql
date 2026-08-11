--> statement-breakpoint
-- §6 Arabic Intelligence per-organization profile. Created now so that
-- src/db/rls.sql (which enables RLS + tenant_isolation policy on this table)
-- can be applied by the deploy path without failing on a missing relation.
CREATE TABLE IF NOT EXISTS "organization_intelligence_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" text NOT NULL,
	"country" text,
	"market_id" text,
	"industry_id" text,
	"language" text DEFAULT 'en' NOT NULL,
	"dialect" text DEFAULT 'msa' NOT NULL,
	"response_style" text DEFAULT 'formal' NOT NULL,
	"terminology" jsonb DEFAULT '[]' NOT NULL,
	"policies" jsonb DEFAULT '[]' NOT NULL,
	"data_residency" text DEFAULT 'MENA' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "organization_intelligence_profiles_tenant_id_unique"
	ON "organization_intelligence_profiles" USING btree ("tenant_id");
--> statement-breakpoint
-- §6.1 hot-path index flagged by audit: document_chunks rows are queried by
-- (tenant_id, document_id) during rag/vector retrieval; the FK had no index.
CREATE INDEX IF NOT EXISTS "document_chunks_document_id_chunk_index_idx"
	ON "document_chunks" USING btree ("document_id", "chunk_index");