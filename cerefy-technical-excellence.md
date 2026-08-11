# Cerefy — Technical Excellence Standard

> The architecture doc says *what* to build. The build plan says *when*. This
> document says *how well* — the engineering bar that separates a demo that
> impresses a prospect from a system that survives an enterprise security review,
> a load spike, and three years of feature growth without collapsing under its
> own weight. Every section below is enforceable, not aspirational — each has a
> concrete check you can run or a number you can measure.

---

## 1. API Design Standard

### 1.1 Contract shape
- REST over `/api/v1/<domain>` — version in the URL, not a header. Breaking
  changes get `/v2`; the old version stays live for a documented deprecation
  window (minimum 90 days for anything a paying customer's integration touches).
- Every response body follows one envelope:
  ```json
  { "data": { ... }, "meta": { "requestId": "...", "tenantId": "..." } }
  ```
  Errors follow one shape too:
  ```json
  { "error": { "code": "DECISION_NOT_FOUND", "message": "...", "requestId": "..." } }
  ```
  Never let two endpoints disagree on this — a client should never need a
  per-endpoint parser.
- Idempotency keys required on every POST that creates a resource with real-world
  side effects (submitting an AI query, creating a workflow run). Client sends
  `Idempotency-Key` header; server dedupes on it for at least 24h.

### 1.2 Pagination, filtering, sorting
- Cursor-based pagination only (`?cursor=...&limit=...`) — never offset-based
  past the first page; offset pagination silently breaks under concurrent writes
  and is a real bug class, not a style preference.
- Filtering via explicit query params (`?status=running`), not a generic
  query-language param, until there's a proven need for one.

### 1.3 Rate limiting
- Per-tenant, per-endpoint-class limits (e.g. AI query submission limited tighter
  than read endpoints) enforced at the API gateway, not in application code —
  gateway-level enforcement can't be bypassed by a code path someone forgot.
- Return `429` with `Retry-After`; document the limits in the API reference so
  enterprise integrators can build against them, not discover them by failing.

### 1.4 Backward compatibility discipline
- Adding a field to a response: safe, no version bump.
- Removing or renaming a field, changing a type, changing error semantics:
  requires a version bump. Treat this as absolute — "just this once" backward
  breaks are how integration partners lose trust in the platform, and trust is
  the entire product thesis (see market playbook).

---

## 2. Testing Strategy

Testing an AI-driven product needs a layer beyond conventional unit/integration/e2e — deterministic tests for deterministic code, **evaluation-based tests for the parts that are inherently non-deterministic.**

| Layer | What it covers | Tooling pattern | Gate |
|---|---|---|---|
| Unit | Pure functions, business logic, RLS policy SQL | Standard test runner, run on every commit | 100% of new logic covered before merge |
| Integration | API endpoints against a real (test) DB, RLS actually enforced | Spin up a real Postgres in CI, never mock the DB layer for RLS tests specifically | Every new endpoint has a test proving tenant isolation, not just happy-path |
| E2E | Critical user flows (login → AI query → answer with citation) | Headless browser against a staging deploy | Runs on every deploy to staging, blocks promotion to prod on failure |
| **AI eval suite** | Answer quality, citation accuracy, confidence calibration, agent selection correctness | Golden-set of real (anonymized) queries with human-graded expected answers; run the current model/prompt version against the set, score, compare to baseline | **No prompt or model change ships without a diff on this suite** — a regression here is a production incident even if all other tests pass |

### 2.1 The AI eval suite in detail
This is the piece most teams skip and the piece that matters most for an
enterprise buyer who will test your claims directly:
- Maintain a versioned golden set (minimum 100 real-shaped queries per domain
  the product serves, growing as customers use the product — see §3 for how
  production feedback feeds this).
- Score on: factual accuracy against source documents, citation correctness
  (does the cited source actually support the claim), confidence calibration
  (does a stated 90% confidence answer turn out right ~90% of the time over the
  set, not just look confident), and refusal correctness (does it decline when
  it should rather than fabricate).
- Every prompt template and every model swap runs against this suite before
  merge. Track the score over time as a first-class metric next to uptime —
  a silent quality regression from a "helpful" prompt tweak is exactly the kind
  of thing that erodes the trust moat without ever showing up in an uptime
  dashboard.

### 2.2 What NOT to test with brittle assertions
Don't assert exact AI output strings in tests — model/prompt updates will break
these constantly for no real reason. Assert structure (citation present, source
count > 0, confidence in valid range) and run content quality through the eval
suite, not string-equality tests.

---

## 3. LLM Operations

### 3.1 Prompt & model versioning
- Every prompt template lives in version control, not a database row edited
  from an admin panel — prompt changes go through the same review + eval-suite
  gate as code changes.
- Tag every AI answer in the database with the exact model ID and prompt
  version that produced it (`ai_answers.model_version`, `ai_answers.prompt_version`).
  Without this, you cannot debug a quality complaint from three months ago, and
  you cannot correlate a quality dip with a specific change.

### 3.2 Cost and token governance
- Track token cost per query, per tenant, from week one (already called out in
  the build plan's risk list — this section is the "how"):
  ```
  ai_queries.tokens_input, ai_queries.tokens_output, ai_queries.cost_usd
  ```
- Alert when a tenant's daily cost crosses an anomaly threshold (not just a hard
  cap) — a runaway agent loop is a cost incident and a reliability incident at
  once.
- Cache aggressively at the retrieval layer (embedding cache, common-query
  cache) — never at the answer layer for anything that claims real-time
  analysis, or you're back to fabricating freshness.

### 3.3 Provider abstraction in practice
- One internal interface (`LLMProvider.complete()`, `LLMProvider.embed()`)
  that every feature calls — never a direct SDK import from feature code. This
  is what makes a provider swap (cost, latency, data-residency reasons) a
  config change instead of a rewrite.
- Maintain at least a tested fallback provider path for the core AI Workspace
  loop — a single-provider outage should degrade the product (slower, or a
  clear "AI temporarily limited" state), never take it fully down for every
  tenant simultaneously.

### 3.4 Human-feedback loop → retraining pipeline
- The `human_review_status` capture (already in the schema) needs an actual
  consuming pipeline, not just a column that fills up: a scheduled job that
  pulls edited/rejected answers, structures them into fine-tuning or
  retrieval-ranking training data, and feeds the eval golden-set additions.
  A capture field nobody reads is not a moat, it's a database column.

---

## 4. Observability & SLOs

### 4.1 The three pillars, correctly separated
- **Structured logs** — every log line JSON, tagged with `requestId`,
  `tenantId`, `userId`. Never log raw PII or full document contents at info
  level; log references (document IDs), not payloads.
- **Metrics** — RED method per service (Rate, Errors, Duration) plus AI-specific
  metrics: tokens/query, confidence distribution, human-override rate.
- **Traces** — distributed tracing across the full AI Workspace pipeline
  (Understand → Retrieve → Plan → Agents → Analyze → Answer) with each stage as
  its own span. This is what makes the "no fabricated intermediate steps" rule
  enforceable in production, not just in code review — if a stage has no trace
  span with real duration, it isn't real.

### 4.2 SLOs (define before you need them, not after an incident)
| Service | SLI | Target (Phase 1 pilot-scale) | Target (Phase 2, 15-30 customers) |
|---|---|---|---|
| API availability | successful requests / total | 99.5% | 99.9% |
| AI Workspace p95 latency | end-to-end query to answer | < 15s | < 8s |
| Auth/session | successful logins / attempts | 99.9% | 99.95% |
| Data durability | RPO for tenant data | < 1h | < 15min |

Publish these once they're real, self-reported, in the audit/governance surface
(§9 of the architecture doc) — this is what turns "enterprise-grade" from a
marketing word into a claim a security team can independently verify against
your own dashboard.

### 4.3 Alerting discipline
- Alert on symptoms (SLO burn rate), not causes (CPU%) — causes are for
  debugging after the page fires, not the page itself.
- Every alert has a runbook link. An alert with no documented response is noise
  that trains the on-call engineer to ignore pages.

---

## 5. Security Hardening (beyond RLS)

RLS (already in the schema, §2.2 of the build brief) is necessary but not
sufficient. Layer these on top:

### 5.1 Secrets & credentials
- No secret ever committed to the repo — enforce with a pre-commit hook and a
  CI scan (gitleaks or equivalent) on every PR, not just periodically.
- Secrets live in a managed secrets store (cloud provider's secrets manager),
  injected at runtime, rotated on a schedule (90 days minimum for API keys,
  immediately on any suspected exposure).

### 5.2 Dependency & supply chain
- Automated dependency vulnerability scanning on every PR (Dependabot/Snyk or
  equivalent) — block merge on critical/high severity findings unless
  explicitly waived with a documented reason and expiry date.
- Pin dependency versions; review the diff on every major-version bump, don't
  auto-merge them.

### 5.3 Application-layer security
- Every input validated at the API boundary against an explicit schema — reject
  unknown fields, don't silently drop them (silent-drop hides bugs).
- RBAC enforced server-side on every mutating endpoint, independently of the UI
  hiding disabled actions (§9 of the architecture doc already states this — the
  concrete check: write a test per role that asserts a 403 on every action that
  role shouldn't have, not just a UI snapshot test).
- Full request/response audit logging for anything touching the audit_log
  table's covered actions — write-once, never editable from the application
  layer (enforce with DB-level permissions, not just app-level convention).

### 5.4 Penetration testing & threat modeling cadence
- Third-party penetration test before the SOC 2 / ISO 27001 process begins in
  earnest (Phase 1, per the market playbook) — findings feed the readiness
  assessment rather than surprising it.
- Re-test after any architecture change that touches auth, tenant isolation, or
  data flow — not just annually on a fixed calendar.
- Lightweight threat model (STRIDE or equivalent) for every new major feature
  before build starts, not retrofitted after — five minutes of "how could this
  leak across tenants" in design review is cheaper than a retrofit.

---

## 6. Performance & Scalability Engineering

### 6.1 Database
- Index every foreign key and every column used in a `WHERE`/`ORDER BY` on a
  hot path — verify with `EXPLAIN ANALYZE` on real query shapes, don't guess.
- Connection pooling (PgBouncer or equivalent) from day one — a Postgres
  instance that's fine at 1 tenant falls over at 30 without this, and it's a
  config addition now vs. an incident later.
- Partition high-volume tables (`ai_queries`, `audit_log`) by time once volume
  justifies it — plan the partition key at table-creation time even if you
  don't activate partitioning until the volume is real.

### 6.2 Caching layers
- Embedding cache for repeated/similar retrieval queries.
- HTTP-layer caching for genuinely static reference data (not for anything
  claiming live analysis — see §3.2 on not caching answers).
- Cache invalidation tied to explicit events (document re-ingested, workflow
  updated), never time-based-only for anything where staleness would look like
  fabricated freshness to a user.

### 6.3 Horizontal scaling readiness
- Application layer stateless by design — session state in the DB/cache, never
  in-process memory, so any instance can serve any request.
- Background job processing (knowledge ingestion, agent execution) on a real
  queue (not an in-process cron) from the point where a single pilot customer's
  ingestion volume could block the request path — don't wait until it actually
  blocks something to build this.

---

## 7. CI/CD & Environments

- Three environments minimum: `dev` (ephemeral, per-branch or per-PR), `staging`
  (persistent, mirrors prod config, where E2E + eval suite run pre-promotion),
  `production`.
- Every merge to main auto-deploys to staging; production deploy is a deliberate
  action gated on staging's E2E + eval suite passing green.
- Infrastructure as code (Terraform or equivalent) for everything — no manual
  console changes to production infra; if it's not in code, it doesn't exist
  as far as disaster recovery is concerned.
- Feature flags for anything that ships incomplete to production code but isn't
  yet customer-visible — this is a different mechanism from `capabilities.ts`
  (which gates UI/data honesty for customers) but the same discipline: don't
  half-ship silently.

---

## 8. Disaster Recovery

- Automated daily backups minimum, with point-in-time recovery enabled on the
  primary database — RPO target from §4.2's SLO table, not "we have backups
  somewhere."
- **Actually test a restore** on a schedule (quarterly minimum) — an untested
  backup is a hypothesis, not a recovery plan. Document the actual measured
  RTO from the last real test, not the theoretical one.
- Multi-region failover plan documented before it's needed for the first
  enterprise/government deal that asks about it (data residency §3 of the
  build plan intersects here — failover region must respect the same residency
  commitments as primary).

---

## 9. Code Quality & Technical Debt Discipline

- Every PR reviewed by at least one other engineer before merge — no exceptions
  for "small" changes; small changes are where tenant-isolation bugs hide.
- Track technical debt explicitly (a labeled backlog, not tribal knowledge) —
  every deliberate shortcut (§ "Aфق 0" note on conscious debt in the vision doc)
  gets a ticket with the reason it was taken and the condition under which it
  must be repaid (e.g. "revisit pgvector→dedicated vector store at 10M+
  embeddings").
- Static analysis (linter + type checker) blocking in CI — already in the
  Definition of Done in `AGENTS.md`; this document is the reason why: a type
  error caught at merge time is free, caught in production is an incident.

---

## 10. Continuous Learning Loop — the system improves itself, safely

Everything in §3.4 (human-feedback capture) and §2.1 (the eval suite) exists to
feed this loop. Without it, "the AI learns from corrections" is a sentence in a
pitch deck. With it, it's a scheduled, auditable pipeline with the same
gate-before-ship discipline as human-authored code — **never a live system
quietly rewriting its own behavior with no review step.**

### 10.1 What actually "learns," concretely
- **Retrieval/ranking** — every human edit or rejection of an answer is a
  learning-to-rank signal: which sources should have ranked higher, which
  shouldn't have been retrieved at all. A scheduled job (weekly, not real-time)
  retrains the ranking layer on accumulated corrections and evaluates the new
  ranker against the golden set before it replaces the live one.
- **Agent selection** — when a human overrides which agent handled a task, that
  correction feeds the Plan-stage's selection logic the same way, on the same
  cadence.
- **Confidence calibration** — track predicted confidence vs. actual correctness
  over the corrected/approved answer history; recalibrate the confidence-scoring
  function when the two drift apart, not just leave a static formula shipped at
  launch.
- **Prompt optimization** — treat prompt variants as experiments, not manual
  edits: run challenger prompts against the eval suite plus a held-out slice of
  real (anonymized) queries, promote a challenger only when it beats the
  incumbent on the full eval suite, not a cherry-picked sample.

### 10.2 The non-negotiable safety gate
Every one of the above is **auto-*proposed*, never auto-*deployed*:**
1. Scheduled job produces a candidate (new ranker weights, new prompt variant,
   recalibrated confidence function).
2. Candidate runs against the full eval suite from §2.1 — same gate a human
   engineer's prompt change would need to pass.
3. A named human approves the promotion, with the eval diff attached — same
   review discipline as §9's code review requirement.
4. The promotion is itself an audit-logged event (`model_version`/
   `prompt_version` bump, tied to the specific eval run that justified it) — so
   any answer produced afterward is traceable to exactly why the system behaved
   differently.

This gate exists because an AI system that silently self-modifies in production
is the single fastest way to violate the "never fabricate, always explainable"
principle the whole product is built on (§0 of `AGENTS.md`) — a security
reviewer's next question after "does it learn?" is always "can you prove
exactly what it learned and when," and an ungated auto-deploy loop cannot
answer that.

### 10.3 What NOT to automate yet
Do not let the system automatically expand its own scope — e.g., auto-adding a
new knowledge source, auto-enabling a new agent type, or auto-relaxing a
confidence threshold. Those are product/capability decisions gated by
`capabilities.ts` (§2.1 of `AGENTS.md`), not learning-loop outputs. The learning
loop improves how well the system does the things it's already scoped to do —
it does not decide to do new things.

---

## 11. Success-Critical Additions (beyond the standard bar)

The sections above are the floor — what a well-run engineering team should have
regardless of product. These six are specific to what makes *this* product
succeed or fail: an AI system enterprises trust with real decisions.

### 11.1 Hallucination firewall — runtime verification, not just offline eval
The eval suite (§2.1) catches quality regressions before deploy. It does not
catch a single bad answer in production. Add a second, runtime pass: before an
answer reaches the user, verify every factual claim against the retrieved
sources it cites — a lightweight entailment/verification check, not a second
full LLM call if latency doesn't allow it. A claim with no supporting source
gets stripped, downgraded in confidence, or the answer is withheld — never
shipped as-is. This is the difference between "we test for quality" and "we
guarantee it live."

### 11.2 Prompt-injection isolation for ingested content
The single most overlooked vulnerability in RAG systems: any document ingested
from a customer's system of record can contain hidden instructions designed to
hijack agent behavior (a PDF with white-text instructions, a field in a CRM
record shaped like a system prompt). Retrieved content must be structurally
isolated as **data, never instructions** — the model's system/instruction
channel and the retrieved-content channel are never concatenated as
indistinguishable text. Add this to the threat model in §5.4 for every feature
that ingests customer content, not just at launch.

### 11.3 Confidence-gated escalation, not just confidence display
Showing a confidence score is necessary but insufficient. Below a defined
threshold, the answer must not be presented as a normal confident result — it
routes to an explicit "needs human review" state (tied into the human-review
capture in §3.4/§10) rather than being displayed with equal visual weight to a
high-confidence answer. This is what prevents a real business decision being
made on an answer the system itself wasn't sure of.

### 11.4 Model Risk Management framework
Borrowed from banking/regulatory practice, and a genuine differentiator versus
competitors who stop at an eval suite: maintain a formal model inventory (every
model/prompt version in production, what it's used for, its known limitations),
periodic independent validation (not just the same eval suite that gates
deploys — a separate, less frequent, more adversarial review), and documented
usage boundaries per model. Build this before a banking or government customer
asks for it — for those buyers, it is often the single artifact that decides
whether procurement proceeds at all.

### 11.5 Outcome-linked metrics, not just quality metrics
Everything in §2.1 and §10 measures whether an answer was *good*. Go one layer
further: track, with the customer's own confirmation where available, whether
the business decision made on an answer led to the outcome expected. This is a
harder, slower signal to collect than a thumbs-up/down, but it's a data moat no
competitor stopping at "our AI is accurate" can replicate — it's evidence the
product changes real outcomes, not just that it answers well.

### 11.6 Chaos engineering on the AI pipeline specifically
Standard chaos engineering targets infrastructure (kill a node, saturate a
network link). Extend it to the AI pipeline: deliberately degrade the Retrieve
stage, inject LLM API latency or errors, and verify the resulting UI state is
honest about the degradation — a slower or partial answer clearly marked as
such — never a silently stale or fabricated-looking result. This is §0 of
`AGENTS.md`'s anti-fabrication rule, stress-tested under failure conditions
instead of just the happy path.

---

## 12. The one metric that matters more than the rest

If you can only instrument one thing well before a pilot converts to a real
customer base, instrument this: **for every AI answer, can you reconstruct
exactly what data it retrieved, what model/prompt version produced it, what
confidence it reported, and what a human did with it afterward — end to end,
for any single answer, on demand?**

That reconstruction is simultaneously your debugging tool, your eval-suite data
source, your audit-log answer to a security review, and your data moat. Every
section above exists to make that one question answerable in minutes, not
"we'd have to check."
