# AGENTS.md — Cerefy Build Brief

> Read this whole file before writing any code. This is the operating spec for an
> autonomous coding agent working on the Cerefy repo. It compresses four source
> documents (architecture, technical build plan, market-leadership playbook,
> implementation guide) into an execution-ready brief. When this file and your own
> judgment disagree, this file wins — it encodes hard constraints the human has
> already decided on, not suggestions.

---

## 0. Mission (read this first, refer back when scope drifts)

Cerefy is an Arabic-first enterprise AI decision-intelligence platform for MENA.
The wedge is **one thing done honestly**: a user asks a business question, the
system retrieves real knowledge, runs it through agent(s), and returns an answer
with citations and a confidence score — on real data, with no fabricated UI states.

**The single rule that overrides every other instruction in this file:**
> Never render a UI state, number, or "AI capability" that isn't backed by a real
> API call. If the backend can't do it yet, build the honest empty state instead.
> This is not a style preference — it is the product's entire trust model with
> enterprise/government buyers. Violating it is a worse outcome than shipping
> slower.

If you (the agent) ever find yourself about to hardcode a plausible-looking number,
mock a "3 agents running" animation, or fake a status the backend hasn't reported —
stop, and build the capability-flag-gated empty state instead. See §2.

---

## 1. Starting point

A scaffold already exists (or should be created first if missing) implementing:
- `lib/capabilities.ts` — capability flag registry
- `db/migrations/0001_init_tenant_rls.sql` — tenant_id + RLS pattern
- `design-system/tokens/`, `design-system/patterns/{EmptyState,ErrorState,LoadingState}.tsx`
- `shell/{AppShell,AuthGuard,Sidebar,Header}.tsx`
- `lib/api/client.ts`, `lib/i18n/{ar,en}.json`
- `app/login/page.tsx`, `app/dashboard/page.tsx`

**Your first task, before any feature work:** run a full repo audit and reconcile
`lib/capabilities.ts` against what's actually implemented vs. this scaffold's
placeholders. Every entry currently marked `not_implemented` or `planned` is a
guess — verify it against the real repo and real backend, and correct it. This
audit output IS the deliverable for Stage 1 below. Do not proceed to Stage 2 until
every capability entry reflects reality.

---

## 2. Non-negotiable mechanisms (apply these in every task, every phase)

### 2.1 Capability flags
Every page/component checks `lib/capabilities.ts` before choosing between real
data-fetching and empty-state rendering. When you build a new feature area:
1. Add its entry to `CAPABILITIES` first, as `not_implemented`.
2. Build the empty state.
3. Wire the real API.
4. Only then flip the flag to `partial` or `implemented` — as its own commit.
Never skip step 2 to "save time." The empty state is the deliverable when the
backend isn't ready, not a placeholder to delete later.

### 2.2 Multi-tenant RLS
Every new table gets `tenant_id` + a `tenant_isolation_<table>` RLS policy in the
same migration that creates it - see `0001_init_tenant_rls.sql` for the pattern.
Application code must call `set_config('app.current_tenant_id', $1, true)` at the
start of every request. Never ship a table without RLS "to add later."
RLS changes must pass `src/db/__tests__/rls-integration.test.ts` against a real
Postgres (`pgvector/pgvector:pg16`, CI uses this image; local dev uses
`embedded-postgres`, see `scripts/rls-integration-test.ps1`), not skip-on-missing-DB.

### 2.3 i18n/RTL
Every new page ships `ar.json` + `en.json` in the same PR, built and tested in
Arabic first. Use logical CSS properties (`ms-`/`me-`/`ps-`/`pe-` in Tailwind, or
`margin-inline-start` etc. in raw CSS) — never `left`/`right`. Number formatting
goes through `Intl.NumberFormat`, never manual digit substitution.

### 2.4 Design tokens
No component may contain a raw hex color, arbitrary Tailwind value (`bg-[#...]`),
or hardcoded pixel spacing. Everything routes through `design-system/tokens/`.
If a value you need doesn't exist as a token, add it to the token file first, in
its own small commit, then use it — don't inline it "just this once."

### 2.5 Human-feedback capture
Any table that stores an AI-generated answer (`ai_answers` and anything like it)
must have `human_review_status | human_review_note | reviewed_by | reviewed_at`
columns from the migration that creates it. This is the data moat from §7 of the
playbook — it cannot be reconstructed retroactively, so it is never optional.

### 2.6 Backend contract for the AI Workspace loop
The Understand → Retrieve → Plan → Agents → Analyze → Answer pipeline must expose
real per-stage status (`queued|running|done|failed` + timing + sources touched +
confidence) — never raw model reasoning traces, never synthesized/fake intermediate
steps. If the backend only supports coarse status today, render fewer, honest
steps rather than inventing granularity that doesn't exist. Wire the two easiest
real stages first (Retrieve, Answer), then add Plan/Agents/Validate as the backend
actually supports them — do not build all six stages in the UI ahead of backend
support.

---

## 3. Build order — follow this sequence, do not reorder

Each stage has a **gate**. Do not start the next stage until the current stage's
gate is objectively true (you can point to the commit/test/screen that proves it).

| Stage | Task | Gate to move on |
|---|---|---|
| 1 | Repo audit → correct `capabilities.ts` for real | Every capability entry matches actual repo/backend state |
| 2 | Design system + tokens finalized | All primitives render from tokens only, no raw values |
| 3 | App shell + auth persistence | Refresh never logs the user out; verified by manual reload test on an authenticated session |
| 4–6 | Landing, auth pages, dashboard wired to real API | No mocked data anywhere in these pages; empty states render correctly when backend returns nothing |
| 7–9 | AI Workspace, Agents, Knowledge | Execution states map 1:1 to real backend states — no synthesized steps |
| 10–16 | Decisions, MENA, Business, Governance, Org, Observability, Settings | Each page's capability flag matches reality; nothing renders past its flag |
| 17 | RTL + responsive pass | Full Arabic/English parity and mobile parity on every shipped route |
| 18–20 | Cleanup + validation | `grep -rEi "mock|fixture|Math.random\(\)|TODO.*fake" src/` returns nothing in shipped code; lint/typecheck/build/test all green; no secrets in repo (grep for API keys, `.env` committed) |

**Explicitly out of scope until a paying pilot exists (do not build these even if
asked to "get ahead"):** workflow builder UI (drag/drop — v1 workflows are
backend-configured), agent marketplace/builder, billing system (invoice manually),
observability dashboards (internal logging is enough), deep governance/RBAC UI.
Building any of these before Stage 20 gate is scope creep — flag it back to the
human instead of building it silently.

---

## 4. Stack decisions (already made — do not re-litigate without a stated reason)

| Layer | Decision |
|---|---|
| Frontend | Next.js (App Router) + TypeScript + Tailwind |
| Backend | Node (NestJS or Fastify), or the team's existing strongest stack — confirm in Stage 1 audit, don't assume |
| Database | Postgres, RLS from day one, even single-tenant |
| Vector store | pgvector — do not introduce a dedicated vector DB until real scale data justifies it |
| LLM layer | Provider-abstracted — never hardcode a single vendor's SDK directly into feature code; go through an adapter |
| Auth | Managed provider, unless a real auth backend already exists — do not build auth in-house |
| Billing | Stripe or regional equivalent, only when actually needed — not before |

If you believe a stack decision here is wrong, say so explicitly to the human with
your reasoning — do not silently substitute a different choice.

---

## 5. Definition of Done (applies to every task you complete, not just phase gates)

A task is done only when all of the following are true:
- [ ] No fabricated data, mocked API responses, or `Math.random()`-driven UI states remain in the shipped code
- [ ] Every new table has `tenant_id` + RLS in its migration
- [ ] Every new page ships with both `ar.json` and `en.json`, tested in RTL
- [ ] Every new component uses tokens only — zero raw hex/pixel/arbitrary Tailwind values
- [ ] Every new feature area has a `capabilities.ts` entry that reflects its real status
- [ ] `npm run lint && npm run typecheck && npm run build` all pass
- [ ] If the task touched an AI-answer-producing table, human-review columns exist
- [ ] No secrets/keys/credentials added to committed files

---

## 6. What to do when you're uncertain

- If the real backend can't yet support a stage/feature the spec describes: build
  the honest coarser version, mark the capability `partial` with a `note` in
  `capabilities.ts` explaining the gap, and move on. Do not block waiting for
  backend work you can't do yourself unless explicitly instructed to also build
  the backend piece.
- If a request from the human conflicts with §2 (the non-negotiable mechanisms):
  implement it, but flag the conflict explicitly in your response — don't silently
  comply or silently refuse.
- If you're about to skip a step in §5's Definition of Done "to move faster": don't.
  Flag the tradeoff to the human instead and let them decide.

---

## 7. First commands

```bash
npm install
cp .env.example .env.local   # fill in real values before running
npm run dev
```

Then start Stage 1: open `lib/capabilities.ts` and begin the audit.
