--> statement-breakpoint
-- 0006: durable auth (users/orgs/sessions), org membership, and a Postgres-backed
-- knowledge graph surface. RLS policies for every table here live in
-- src/db/rls.sql — one deploy path owns RLS (see 0005 header comment).
CREATE TABLE IF NOT EXISTS "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" text NOT NULL,
	"name" text NOT NULL,
	"plan" text DEFAULT 'trial' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "organizations_tenant_id_unique" ON "organizations" USING btree ("tenant_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"role" text DEFAULT 'admin' NOT NULL,
	"avatar_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_unique" ON "users" USING btree ("email");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_tenant_idx" ON "users" USING btree ("tenant_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "organization_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" text NOT NULL,
	"user_id" uuid,
	"role" text DEFAULT 'member' NOT NULL,
	"invited_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "organization_members_tenant_idx" ON "organization_members" USING btree ("tenant_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" text NOT NULL,
	"user_id" uuid,
	"refresh_hash" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"revoked_at" timestamp,
	"last_used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sessions_tenant_idx" ON "sessions" USING btree ("tenant_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sessions_refresh_hash_idx" ON "sessions" USING btree ("refresh_hash");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "graph_entities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" text NOT NULL,
	"name" text NOT NULL,
	"label" text,
	"document_id" uuid,
	"source" text DEFAULT 'ingestion' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "graph_entities_tenant_idx" ON "graph_entities" USING btree ("tenant_id", "name");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "graph_entity_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" text NOT NULL,
	"source_entity_id" uuid,
	"target_entity_id" uuid,
	"relation" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "graph_entity_links_tenant_idx" ON "graph_entity_links" USING btree ("tenant_id", "source_entity_id");
--> statement-breakpoint
-- Extend agent_registry with the display fields the roster API serves. These are
-- real, maintained catalog columns — not fabricated UI numbers.
ALTER TABLE "agent_registry" ADD COLUMN IF NOT EXISTS "role" text;
--> statement-breakpoint
ALTER TABLE "agent_registry" ADD COLUMN IF NOT EXISTS "department" text;
--> statement-breakpoint
ALTER TABLE "agent_registry" ADD COLUMN IF NOT EXISTS "description" text;
--> statement-breakpoint
ALTER TABLE "agent_registry" ADD COLUMN IF NOT EXISTS "permissions" jsonb DEFAULT '[]' NOT NULL;
--> statement-breakpoint
ALTER TABLE "agent_registry" ADD COLUMN IF NOT EXISTS "monthly_cost" text;
