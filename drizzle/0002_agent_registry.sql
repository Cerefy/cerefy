CREATE TABLE "agent_registry" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"capabilities" jsonb NOT NULL,
	"tools" jsonb NOT NULL,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"execution_history" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
