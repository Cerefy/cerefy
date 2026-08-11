# Cerefy 7-Agent Audit Report

Date: 2026-08-10 · Repo: `C:\Users\MontaserAbdalla\Documents\Default Project`
Executed via `/audit` supervisor: `@capability-auditor` → then `@rls-auditor`, `@test-eval-auditor`, `@performance-auditor`, `@i18n-auditor`, `@llm-ops-auditor`, `@docs-auditor` in parallel.

## 1. Honest summary — can this ship to an enterprise pilot?

**No.** The architecture, schema, and honest-state discipline are genuinely good — two-or-more real tenants with real RLS tests, a real AI pipeline, real Postgres/Drizzle, an eval suite scoring 2/2 factual + 2/2 citation + 2/2 refusal, honest 501s for unimplemented surfaces, and a production build that boots and degrades cleanly. But the system's **trust model itself is not yet wired end-to-end**: RLS is never applied by any deploy path, the audit trail is memory-only and dev-fallback-only, the LLM guardrail that is the product's whole reason for existing is unreachable in the live request path, and several `capabilities.ts` entries claim `implemented` for endpoints that return 501 or don't exist. The single biggest reason it cannot ship today: **the runtime the buyer would use (production AI run) records version/cost/confidence values that don't match what actually executed, and no real claim→source verification happens before an answer is served.**

## 2. Findings (severity table)

| # | Severity | Finding | Agent | Evidence | Fix |
|---|---|---|---|---|---|
| 1 | **BLOCKER** | RLS never applied in deploy path: `scripts/db-migrate.sh` runs only `drizzle-kit push`; no runner references `src/db/rls.sql`. Production DB = RLS disabled → cross-tenant reads. | rls/docs | `scripts/db-migrate.sh:17-20`, `DEPLOYMENT.md:87`, grep of `rls.sql` | Add `psql -f src/db/rls.sql` step to `db-migrate.sh` + DEPLOYMENT.md |
| 2 | **BLOCKER** | No durable audit trail: in-memory `MemoryAuditSink`; only `decision.approve/reject` logged, and only inside `isLocalDevFallback()`; prod paths unlogged; singleton created `sealed:false`. | docs | `auditLog.ts:47`, `server.ts:431-432`, `capebitz:108-112` claims `implemented` | Durable `audit_log` table + middleware that logs prod actions; remove sealed=false |
| 3 | **BLOCKER** | Prompt-injection isolation not used: retrieved content concatenated into instruction prompts in all 4 agents; `isolateRetrievedContent` is dead code. | llm-ops | `discovery.agent.ts:44-55`, `analyst.agent.ts:47-49`, `governance.agent.ts:34-36`, `agentOrchestrator.ts:68-79` | Wrap retrieved blocks with `isolateRetrievedContent` / use `prompts.ts` templates |
| 4 | **BLOCKER** | §11.1 hallucination validation unreachable: `answerText` always `''` (pipeline never emits `response`/`summary`); guardrail fed `sources:[]`,`retrieved:[]`. | llm-ops | `server.ts:438,447,451`, `runtime.ts:215-231` | Emit a real answer string + propagate retrieval sources into `runGuardrails` |
| 5 | **BLOCKER** | Confidence is fabricated: agents hard-floor 62/74/82/55; `apps/api` uses `Math.random()`; recorded version `gemini-2.5-flash@analysis_v1` ≠ invoked `gemini-1.5-pro` + inline prompts. | llm-ops | `runtime.ts:227`, `discovery.agent.ts:74`, `analyst.agent.ts:64`, `governance.agent.ts:24-29`, `server.ts:438`, `base-agent.ts:43` | Agents return real modelId/promptVersion; confidence from verifyAnswer + retrieval overlap only |
| 6 | **HIGH** | `simulateDecision` writes `simulationResult` column that doesn't exist in schema → 500 in prod; also writes hardcoded `$1.9M`/`$270K`. | rls/llm | `decisionService.ts:39-49`, `schema.ts:49-61` | Add `simulation_result` column OR return honest 501; remove fabricated figures |
| 7 | **HIGH** | `organization_intelligence_profiles` in schema + `rls.sql` but **no migration** creates it → `rls.sql` fails when applied. | rls/docs | `schema.ts:124-137`, `rls.sql:6,24-25`, `drizzle/0000-0003` | Add `0004` migration creating it |
| 8 | **HIGH** | RLS integration test cannot run as written (`before()` applies `rls.sql` → fails on §7). Coverage gaps: no write-side tamper tests, 5/9 tables untested. | rls | `rls-integration.test.ts:54-57` | Fix after §7; add update/delete + 5-table + fail-closed tests |
| 9 | **HIGH** | `document_chunks.document_id` FK has no index; memory-agent hot path scales a seq-scan table. | performance | `drizzle/0000:48`, `vectorMemory.ts:28-33` | Add `(document_id, chunk_index)` index in `0004` |
| 10 | **HIGH** | Socket.IO broadcasts `io.emit` globally (cross-tenant leak) + arbitrary room join. | rls | `runtime.ts:23-29,274-280`, `server.ts:517-519` | Broadcast to `tenant:<id>` rooms only |
| 11 | **HIGH** | Provenance reconstruction/outcome reads not tenant-filtered; sequential IDs enumerable (SSRF-ish cross-tenant). | rls | `store.ts:36,46-50`, `server.ts:275` | Filter by `req.tenantId` |
| 12 | **HIGH** | `PATCH`/`DELETE` projects and `ai/pipeline/run`, `agents/execute` have zero permission guards. | rls | `server.ts:428-429,452-453` | Add `requirePermission` |
| 13 | **HIGH** | `/api/v1/audit` and `/api/v1/intelligence/*` claimed `implemented` but **no such routes exist**. | docs/capability | `capabilities.ts:78,83,105,110`; grep server.ts | Fix capabilities.ts; wire `/api/v1/ai/answers/:id` + intelligence routes or mark not_implemented |
| 14 | **HIGH** | i18n `/§2.3`: zero `ar.json`/`en.json`; Arabic-first not met on any shipped page; `action.newAgent` missing in `enDict` → renders raw key. | i18n | `src/lib/i18n/index.tsx:57,122`, 44 routes English-only | Convert dict → JSON; port pages through `t()`; fix key parity |
| 15 | **HIGH** | RTL physical `left`/`right` in shipped components (`Table.tsx`, `FirebaseAuthModal`, `kinetic/primitives`) + raw hex / arbitrary Tailwind systemic. | i18n | `Table.tsx:73-75`, `FirebaseAuthModal.tsx:157`, `kinetic/primitives.tsx:159,230`, 100+ arbitrary-value hits | Logical props + route through tokens |
| 16 | **HIGH** | Direct provider SDK imports in live agent code; 3 competing abstractions, `LlmProvider` dead. Token/cost hardcoded 0; `ai_queries` never written in prod. | llm-ops | `server.ts:7,112-123,467`, `ingestionService.ts:4,48,76`, `agents/*.agent.ts:1`, `server.ts:439`, `gemini.ts:41-49` (dead) | Chase all LLM calls through one abstraction; capture `usageMetadata`; write `ai_queries` |
| 17 | **MEDIUM** | Ingestion holds a pooled client across N sequential LLM embeddings (pool starvation); `ai/run` awaited inline (no queue). InMemoryJobQueue is dead code. | performance | `ingestionService.ts:32-69`, `server.ts:438,467`, `jobQueue.ts` | Split embedding loop outside tx; enqueue long work |
| 18 | **MEDIUM** | `agent_registry` RLS enabled with no policy → deny-all for non-owner or bypass for owner; docs claim wrong. | rls | `rls.sql:8`, `rls.sql:12-15` | Remove RLS enable or add a global-read policy |
| 19 | **MEDIUM** | `capabilities.ts` stale since `779a5a2`; new observability routes undocumented; `monitoring` lists old analytics route. | docs | `capabilities.ts:124-128` | Reconcile (this report §3) |
| 20 | **MEDIUM** | `agent_executions` writes bypass `withTenantContext` (raw db). | rls | `databaseTool.ts:33-129`, `runtime.ts:64` | Wrap in tenant tx |
| 21 | **MEDIUM** | `/health/ready` builds a new Pool per request; bimodal p95 tail from per-request OTel/log. | performance | `healthCheck.ts:30-39`, load test p95 388-721ms | Reuse pool; keep OTel tuned |
| 22 | **LOW** | `auditLog.records` mutable; `Math.random()` in dev-fallback `getAgentPerformance` (501 in prod — acceptable but grep-flagged for stage 18-20). | docs/llm-ops | `auditLog.ts:17`, `server.ts:230` | Replace with deterministic; document |

## 3. capabilities.ts diff (entries to correct)

| Key | Claimed | Actual | Correction |
|---|---|---|---|
| `auth` | implemented | refresh doesn't validate presented token; in-memory plaintext store | keep `implemented`, notice refresh + in-memory caveat |
| `decisions` | implemented | simulate writes non-existent column + fabricated $ figures in prod | `partial` or note; simulate honest-fail/501 |
| `agents` | partial ("registry list is real") | GET /agents 501 in prod; no listing endpoint | `not_implemented` for listing; keep execute real |
| `knowledgeGraph` | implemented | `/api/v1/graph/cypher` 501 in prod; no API | `not_implemented`, endpoints `[]` |
| `memory` | partial ("memory endpoints exist") | both endpoints 501 in prod; UI fully fabricated | `not_implemented`, endpoints `[]` |
| `analytics` | partial | all 3 endpoints 501 in prod (dev-fallback only) | `not_implemented`, endpoints `[]` |
| `arabicIntelligence` | implemented | no HTTP routes; client-side lib only | `not_implemented`, endpoints `[]` |
| `menaMarkets` | implemented | no HTTP routes (`/api/v1/intelligence/markets` absent) | `not_implemented`, endpoints `[]` |
| `governance` | partial | `/api/v1/audit` route doesn't exist | `not_implemented` or point to real audit endpoint |
| `audit` | implemented | MemorySink only, prod paths unlogged; reconstruction flag-gated | `partial` + note |
| `monitoring` | partial | lists old analytics route; `/api/slo`+`/metrics/render` real but undocumented | keep `partial`, update endpoints |
| `aiPipeline` | implemented | guardrail unreachable; deterministic fallbacks synthesize content | `partial` + note until guardrail wired |

## 4. Prioritized action list

**BLOCKERS (fix before anything ships):**
1. RLS deploy path: `db-migrate.sh` + DEPLOYMENT.md must apply `src/db/rls.sql` (add `0004` migration first for `organization_intelligence_profiles` so `rls.sql` succeeds).
2. Durable audit trail: add `audit_log` table + middleware; log prod actions, not just dev approve/reject.
3. Wire guardrails into the real request: emit real `answerText` + retrieval `sources` from the pipeline; route `escalate` → `REVIEW_REQUIRED`.
4. Kill prompt-injection surface: `isolateRetrievedContent` in all agent prompts.
5. Stop recording fabricated provenance: real modelId/promptVersion/tokens/cost/confidence from the executing agent state.

**HIGH (same round):**
6. fix `simulateDecision` (column + no fabrication) · 7. migration `0004` (org_profiles + chunk index) · 8. complete RLS tests · 9. tenant-scoped sockets + provenance · 10. RBAC gaps on PATCH/DELETE/pipeline/agents · 11. correct capabilities.ts (below) · 12. provider abstraction chokepoint + i18n/RTL sweep.

**DoD note:** `npx tsc --noEmit` exit 0; 122 lib tests (119 pass, 3 RLS skipped-no-DB); `npm test` 24/24; E2E 3/3; prod build boots 5s with honest degraded readiness; eval 2/2-2/2-2/2. The report's fix items are tracked for the human/agent to apply in dependency order.

## 5. Resolution log (applied after this report)

| # | Severity | Status | Verified by | Commit(s) |
|---|---|---|---|---|
| 1 | BLOCKER | ✅ Resolved | `scripts/db-migrate.sh` now applies `src/db/rls.sql` after drizzle push; DEPLOYMENT.md documents it | `b87e4f5` |
| 2 | BLOCKER | ✅ Resolved | Durable `audit_log` table (migration `0005_audit_log.sql`) + middleware; prod decision/ai actions logged | `923bc65`, `18722dc` |
| 3 | BLOCKER | ✅ Resolved | All 4 agents wrap retrieved content via `isolateRetrievedContent` / prompt templates | `923bc65` |
| 4 | BLOCKER | ✅ Resolved | Pipeline emits real answer string + retrieval sources; guardrail feeds real sources; escalate → REVIEW_REQUIRED | `923bc65` |
| 5 | BLOCKER | ✅ Resolved | Agents return real modelId/promptVersion; confidence from retrieval overlap only; `Math.random()` gone | `923bc65` |
| 6 | HIGH | ✅ Resolved | `simulateDecision` returns honest 501 in prod; fabricated figures removed | `b87e4f5` |
| 7 | HIGH | ✅ Resolved | Migration `0004_org_intelligence_profiles.sql` creates the table; `rls.sql` applies clean | `b87e4f5`, `f28da4f` |
| 8 | HIGH | ✅ Resolved | RLS integration suite runs against real Postgres (embedded PG18): 8/8 pass, covers 9/9 tables incl. write-side WITH CHECK rejection + silent-no-op UPDATE tamper | `f28da4f` |
| 9 | HIGH | ✅ Resolved | `(document_id, chunk_index)` index added in `0004` | `b87e4f5` |
| 10 | HIGH | ✅ Resolved | Socket.IO broadcasts tenant-scoped (`tenant:<id>` rooms); room joins validated | `923bc65` |
| 11 | HIGH | ✅ Resolved | Provenance reconstruction/outcome reads tenant-filtered by `req.tenantId` | `923bc65` |
| 12 | HIGH | ✅ Resolved | `requirePermission` guards on PATCH/DELETE projects + `ai/pipeline/run` + `agents/execute` | `923bc65` |
| 13 | HIGH | ✅ Resolved | `capabilities.ts` reconciled: claims now match real routes | `0b97885` |
| 14 | HIGH | ✅ Resolved | `ar.json` + `en.json` with matching key sets; dev key-parity check; never renders raw keys | `18722dc` |
| 16 | HIGH | ✅ Resolved | All LLM calls through provider adapter; real model/tokens/cost recorded; `ai_queries` written in prod path | `923bc65`, `18722dc` |
| 17 | MEDIUM | ✅ Resolved | Ingestion splits embedding LLM calls outside the DB tx; batched chunk insert | `18722dc` |
| 18 | MEDIUM | ✅ Resolved | `agent_registry` RLS policy added (global-read for `cerefy_app`) | `923bc65` |
| 20 | MEDIUM | ✅ Resolved | `databaseTool.ts` threads `tenantId` through `withTenantContext` for all agent_executions writes | `923bc65` |
| 21 | MEDIUM | ✅ Resolved | `/health/ready` reuses shared pool from `src/db/index.ts` | `18722dc` |

**Still open (out of this round's scope):** #15 RTL physical `left/right` sweep in shipping components (stage 17), #19 `capabilities.ts` was reconciled in `0b97885` but should be re-verified by a fresh `/audit`, #22 `auditLog.records` mutability + dev-only `getAgentPerformance`.