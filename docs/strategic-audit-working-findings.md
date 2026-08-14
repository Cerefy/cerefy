# Cerefy Strategic Audit — Working Findings

This document separates verified repository/live facts from recommendations. It is an intermediate evidence log for the final strategic report.

## Verified current production state

| Area | Evidence | Status |
|---|---|---|
| Live health | `2026-08-14`: `GET /health/live` returned HTTP 200. `GET /health/ready` returned HTTP 200 and `status=healthy`; database and Gemini were `up`. | Verified working |
| Release integrity | Workflow migration `0008` initially failed because its Drizzle journal entry was absent, then had an older timestamp that caused the runner to skip it. Commits `1231c31` and `b9fe382` repaired these two defects. | Resolved, but reveals fragile migration-journal handling |
| Workflow end-to-end | Authenticated live smoke passed: registration 200, create 201, publish 200, run 202, approval `APPROVED`, final run `SUCCEEDED`, with `AI_ANALYSIS`, `APPROVAL`, `CREATE_DECISION`, and `NOTIFY` steps. | Verified working, limited runtime |
| Tenant data model | Projects, documents/chunks, decisions, organizations/users/sessions, AI records, audit logs, graph entities, and workflow tables have tenant fields. `rls.sql` enables and forces RLS for tenant tables, including workflow tables. | Implemented; live test previously verified cross-tenant isolation |
| AI availability | Health probe makes a live Gemini request. The current deployed model is `gemini-3.6-flash`; a real authenticated AI run previously reported that provenance. | Verified working |

## High-priority verified gaps

| Severity | Finding | Evidence | Why it matters |
|---|---|---|---|
| High | **Shipped Agent Studio is simulated.** | `src/App.tsx` routes `/workspace/studio` to `AIStudioWorkflowView`. `src/components/AIStudioWorkflowView.tsx` contains fixed agent messages, false "Inference Power Score: 98.4", non-existent models (`Cerefy-Elite-X`, `Cerefy-Large-v4.2`), simulated chat, `alert()` actions, and a claimed production deploy. | Directly violates the repository's no-fabrication rule and can mislead a pilot user. Must be replaced with the real Workflow view or an honest unavailable state. |
| High | **AI Workflow execution is not durable.** | `workflowRuntime.executeWorkflowRun()` is launched with `void` from the HTTP process and executes steps in-process. No queue, scheduler, retry/backoff, lease, worker, or dead-letter mechanism exists. | Runs can be interrupted by a restart or Render free-tier sleep. The current smoke proves happy-path behavior, not reliable automation. |
| High | **Input validation is uneven.** | Many active routes destructure `req.body` directly; a generic validator library exists but is not consistently used at route boundaries. | Unbounded/unknown input increases reliability and security risk, particularly in AI/ingestion endpoints. |
| High | **CI gates are incomplete.** | `.github/workflows/ci-cd.yml` runs only lint and build before image build. It does not run `npm test`, security tests, RLS integration tests, public smoke tests, live workflow smoke, secret scan, or an AI evaluation suite. Trivy sets `exit-code: '0'`, so critical/high findings do not block. | Broken production behavior can merge and deploy without objective gates. |
| High | **Render Free is not production-stable.** | `render.yaml` explicitly uses `plan: free`; the public service has returned observed 502/503 during deployment/cold-start incidents. | A human pilot can see outages/cold starts even if the code is correct. |
| Medium | **Dependency remediation is outstanding.** | `npm audit --omit=dev --audit-level=high` reported 11 vulnerabilities: 1 high (`nanoid`) and 10 moderate, including transitive `esbuild` and `uuid` advisories. | Requires an intentional dependency upgrade/compatibility pass; do not use blind forced remediation. |
| Medium | **Arabic/RTL readiness is not complete.** | `ar.json` and `en.json` exist, but routed components contain numerous physical `left/right` classes and raw positional styles. | The product cannot yet claim full Arabic-first RTL parity. |
| Medium | **Capability registry was stale after workflow delivery.** | `workflows` still said executor and approval endpoints were missing; `auth` incorrectly said refresh did not validate tokens. Both were corrected locally in this audit and await validation/commit. | Capability flags are product-trust controls; stale notes are misleading. |
| Medium | **Socket subscription authorization needs review.** | `server.ts` permits authenticated sockets to join arbitrary client-supplied `room` and `execution:<id>` strings after joining a tenant room. | Potential disclosure risk if event producers use unscoped execution rooms; requires explicit authorization and tenant-scoped event routing. |

## Existing competitive reality

Cerefy faces broad enterprise decision-intelligence providers such as Aily and Arabic-first enterprise platforms such as Arabic.AI/Tarjama. Aily markets deep functional modules and enterprise security controls. Arabic.AI markets Arabic-native models, many assistants, RAG, governance controls, and cloud/VPC/on-prem/air-gapped deployment. Cerefy should not compete on generic AI breadth. See `docs/strategic-research-sources.md` for links and source-specific details.

## Audit discipline

- Facts in this document are repository or live-test findings.
- Market observations are sourced in `strategic-research-sources.md`.
- Recommendations will be separated from facts in the final report.
- No market size, customer, ROI, accuracy, or benchmark value has been invented.
