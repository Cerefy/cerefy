CREATE TABLE "agent_executions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" text NOT NULL,
	"project_id" text,
	"document_id" text,
	"type" text NOT NULL,
	"status" text DEFAULT 'RUNNING' NOT NULL,
	"current_agent" text DEFAULT 'supervisor' NOT NULL,
	"confidence" real DEFAULT 0 NOT NULL,
	"input" jsonb NOT NULL,
	"output" jsonb,
	"event_log" jsonb NOT NULL,
	"errors" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
