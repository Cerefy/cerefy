--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ai_queries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" text NOT NULL,
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"model_version" text,
	"prompt_version" text,
	"tokens_input" integer DEFAULT 0 NOT NULL,
	"tokens_output" integer DEFAULT 0 NOT NULL,
	"cost_usd" real DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'RUNNING' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ai_answers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" text NOT NULL,
	"query_id" uuid,
	"model_version" text NOT NULL,
	"prompt_version" text NOT NULL,
	"confidence" real DEFAULT 0 NOT NULL,
	"output" jsonb NOT NULL,
	"human_review_status" text DEFAULT 'PENDING' NOT NULL,
	"human_edited" boolean DEFAULT false NOT NULL,
	"sources" jsonb DEFAULT '[]' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_answers" ADD CONSTRAINT "ai_answers_query_id_ai_queries_id_fk"
	FOREIGN KEY ("query_id") REFERENCES "ai_queries"("id") ON DELETE set null;
--> statement-breakpoint
-- §6.1 hot-path indexes: every FK and every WHERE/ORDER BY column used on
-- tenant-scoped hot paths is indexed. Tenant isolation queries and the §12
-- reconstruction lookups (query_id) are the shapes verified by EXPLAIN ANALYZE.
CREATE INDEX IF NOT EXISTS "ai_queries_tenant_created_idx"
	ON "ai_queries" USING btree ("tenant_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "ai_answers_tenant_created_idx"
	ON "ai_answers" USING btree ("tenant_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "ai_answers_query_id_idx"
	ON "ai_answers" USING btree ("query_id");
CREATE INDEX IF NOT EXISTS "projects_tenant_id_idx"
	ON "projects" USING btree ("tenant_id");
CREATE INDEX IF NOT EXISTS "documents_tenant_id_idx"
	ON "documents" USING btree ("tenant_id");
CREATE INDEX IF NOT EXISTS "document_chunks_tenant_id_idx"
	ON "document_chunks" USING btree ("tenant_id");
CREATE INDEX IF NOT EXISTS "decisions_tenant_id_idx"
	ON "decisions" USING btree ("tenant_id");
CREATE INDEX IF NOT EXISTS "agent_executions_tenant_id_idx"
	ON "agent_executions" USING btree ("tenant_id");