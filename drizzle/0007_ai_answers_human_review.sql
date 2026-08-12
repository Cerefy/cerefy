--> statement-breakpoint
-- 0007: human-review columns on ai_answers.
-- §2.5 (human-feedback capture) mandates human_review_status | human_review_note |
-- reviewed_by | reviewed_at on every AI-answer table FROM the migration that
-- creates it. Migration 0003 created ai_answers with only human_review_status and
-- human_edited; provenanceStore.recordFollowUp already writes the note/reviewer/
-- reviewed-at columns. This fixup backfills the missing columns so the persisted
-- feedback moat is durable. RLS policies for this table live in src/db/rls.sql.
ALTER TABLE "ai_answers" ADD COLUMN IF NOT EXISTS "human_review_note" text;
--> statement-breakpoint
ALTER TABLE "ai_answers" ADD COLUMN IF NOT EXISTS "reviewed_by" text;
--> statement-breakpoint
ALTER TABLE "ai_answers" ADD COLUMN IF NOT EXISTS "reviewed_at" timestamp;
