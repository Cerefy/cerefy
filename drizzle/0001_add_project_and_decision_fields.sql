ALTER TABLE "projects"
  ADD COLUMN IF NOT EXISTS "assignees" jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS "agent_lead" text,
  ADD COLUMN IF NOT EXISTS "budget_used" text,
  ADD COLUMN IF NOT EXISTS "milestones_count" integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "completed_milestones" integer DEFAULT 0;

ALTER TABLE "decisions"
  ADD COLUMN IF NOT EXISTS "simulation_result" jsonb;
