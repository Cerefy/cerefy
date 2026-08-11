--> statement-breakpoint
-- §7 / audit BLOCKER-2: durable, tenant-scoped, append-only-by-convention audit
-- trail. Fixes the memory-only MemoryAuditSink that previously left production
-- actions unlogged. Row Level Security is enabled on this table via
-- src/db/rls.sql (policy + enable added there so one deploy path owns RLS).
CREATE TABLE IF NOT EXISTS "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" text NOT NULL,
	"action" text NOT NULL,
	"actor_id" text NOT NULL,
	"actor_role" text NOT NULL,
	"resource" text,
	"detail" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_log_tenant_created_idx"
	ON "audit_log" USING btree ("tenant_id", "created_at" DESC);