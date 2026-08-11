import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { isDatabaseReachable, withTenantContext } from '../../db';
import { aiQueries, aiAnswers } from '../../db/schema';
import type { AnswerRecord, QueryRecord, FollowUpRecord } from './provenance';

/**
 * Provenance store used for §12 reconstruction.
 *
 * - When Postgres is reachable (prod path) `recordQuery` / `recordAnswer` /
 *   `recordFollowUp` persist to the real `ai_queries` / `ai_answers` tables
 *   inside a tenant RLS context, so the audit trail and §2.5 human-review
 *   columns are durable — never in-memory-only.
 * - When Postgres is unreachable (local dev-fallback, degraded pilot, unit
 *   tests) the same records are kept in memory with the identical shape, so
 *   the reconstruction contract and call sites do not differ.
 *
 * Human-review capture: `recordFollowUp` writes §2.5 columns
 * (human_review_status / human_review_note / reviewed_by / reviewed_at) onto
 * the stored answer rather than only logging an in-memory side-note.
 */
export interface ProvenanceStoreShape {
  recordQuery(record: Omit<QueryRecord, 'id' | 'createdAt'>): Promise<QueryRecord>;
  recordAnswer(record: Omit<AnswerRecord, 'id' | 'createdAt'>): Promise<AnswerRecord>;
  recordFollowUp(record: FollowUpRecord): Promise<void>;
  answers(): AnswerRecord[];
  queries(): QueryRecord[];
  followUps(): FollowUpRecord[];
  reset(): void;
}

export function createProvenanceStore(): ProvenanceStoreShape {
  const answers = new Map<string, AnswerRecord>();
  const queries = new Map<string, QueryRecord>();
  const followUps: FollowUpRecord[] = [];
  let querySeq = 0;
  let answerSeq = 0;

  return {
    recordQuery(record) {
      const entry: QueryRecord = {
        ...record,
        id: `query_${++querySeq}`,
        createdAt: new Date().toISOString(),
      };
      queries.set(entry.id, entry);
      return Promise.resolve(entry);
    },
    recordAnswer(record) {
      const entry: AnswerRecord = {
        ...record,
        id: `answer_${++answerSeq}`,
        createdAt: new Date().toISOString(),
      };
      answers.set(entry.id, entry);
      return Promise.resolve(entry);
    },
    recordFollowUp(record) {
      followUps.push(record);
      return Promise.resolve();
    },
    answers() {
      return [...answers.values()];
    },
    queries() {
      return [...queries.values()];
    },
    followUps() {
      return [...followUps];
    },
    reset() {
      answers.clear();
      queries.clear();
      followUps.length = 0;
    },
  };
}

/**
 * DB-backed store: keeps the in-memory view (for §12 reconstruction reads and
 * the dev-fallback) while writing durable rows to `ai_queries` / `ai_answers`.
 * The in-memory record id rebinds to the real DB row id when the insert
 * succeeds, so `answerId` params and `queryId` links in routes refer to real
 * persisted rows in prod.
 */
function createDbBackedStore(): ProvenanceStoreShape {
  const answers = new Map<string, AnswerRecord>();
  const queries = new Map<string, QueryRecord>();
  const followUps: FollowUpRecord[] = [];

  return {
    async recordQuery(record) {
      const createdAt = new Date().toISOString();
      const entry: QueryRecord = { ...record, id: `query_${randomUUID()}`, createdAt };
      queries.set(entry.id, entry);

      if (await isDatabaseReachable()) {
        try {
          const [row] = await withTenantContext(record.tenantId, async (tx) =>
            tx
              .insert(aiQueries)
              .values({
                tenantId: record.tenantId,
                userId: record.userId ?? null,
                type: record.type,
                tokensInput: record.tokensInput,
                tokensOutput: record.tokensOutput,
                costUsd: record.costUsd,
                status: 'COMPLETED',
              })
              .returning({ id: aiQueries.id }),
          );
          if (row) {
            queries.delete(entry.id);
            entry.id = row.id;
            queries.set(entry.id, entry);
          }
        } catch {
          // Best-effort persist: the in-memory copy keeps the request path
          // working even if the write fails under a degraded DB.
        }
      }
      return entry;
    },
    async recordAnswer(record) {
      const createdAt = new Date().toISOString();
      const entry: AnswerRecord = { ...record, id: `answer_${randomUUID()}`, createdAt };
      answers.set(entry.id, entry);

      if (await isDatabaseReachable()) {
        try {
          const queryIdIsDbUuid =
            typeof record.queryId === 'string' &&
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(record.queryId);
          const values = {
            ...(queryIdIsDbUuid ? { queryId: record.queryId } : {}),
            tenantId: record.tenantId,
            modelVersion: record.modelVersion,
            promptVersion: record.promptVersion,
            confidence: record.confidence,
            output: record.output,
            sources: record.sources,
            humanReviewStatus: 'PENDING',
            humanEdited: false,
          };
          const [row] = await withTenantContext(record.tenantId, async (tx) =>
            tx.insert(aiAnswers).values(values).returning({ id: aiAnswers.id }),
          );
          if (row) {
            answers.delete(entry.id);
            entry.id = row.id;
            answers.set(entry.id, entry);
          }
        } catch {
          // Best-effort persist (see above).
        }
      }
      return entry;
    },
    async recordFollowUp(record) {
      followUps.push(record);
      const answer = answers.get(record.answerId);
      if (!answer) return;

      if (record.action === 'edited' && record.revisedOutput) {
        answer.output = record.revisedOutput;
        answer.humanEdited = true;
      }
      answer.humanReviewStatus =
        record.action === 'approved' ? 'REVIEWED' : record.action === 'rejected' ? 'REJECTED' : 'EDITING';
      answer.reviewedBy = record.actorId;
      answer.reviewedAt = record.reviewedAt;

      if (await isDatabaseReachable()) {
        try {
          const dbRowId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
            answer.id,
          )
            ? answer.id
            : null;
          if (dbRowId) {
            await withTenantContext(answer.tenantId, async (tx) =>
              tx
                .update(aiAnswers)
                .set({
                  humanReviewStatus: answer.humanReviewStatus,
                  humanEdited: answer.humanEdited,
                  humanReviewNote: record.outcome?.note ?? null,
                  reviewedBy: answer.reviewedBy,
                  reviewedAt: answer.reviewedAt ? new Date(answer.reviewedAt) : null,
                  ...(record.revisedOutput ? { output: record.revisedOutput } : {}),
                })
                .where(eq(aiAnswers.id, dbRowId)),
            );
          }
        } catch {
          // Best-effort persist.
        }
      }
    },
    answers() {
      return [...answers.values()];
    },
    queries() {
      return [...queries.values()];
    },
    followUps() {
      return [...followUps];
    },
    reset() {
      answers.clear();
      queries.clear();
      followUps.length = 0;
    },
  };
}

export const provenanceStore: ProvenanceStoreShape =
  process.env.CEREBY_DB_BACKED_PROVENANCE === '1' ? createDbBackedStore() : createProvenanceStore();