# Render deploy verification — 2026-08-14

## Commit `7994366`

Render dashboard reported deployment `dep-d9vq7d8ae00c73f816ng` as live at approximately 23:25 UTC.

The public endpoint then returned Render **502 Bad Gateway** during the authenticated workflow smoke test and direct health checks.

## Application log evidence

The current Render application log showed that release-time database work completed successfully:

```text
✅ RLS enabled on all tenant tables
✅ Database migration complete
Release-time database migration complete.
OpenTelemetry instrumentation started
```

Immediately afterward, Node emitted a CommonJS module-loader failure beginning with:

```text
node:internal/modules/cjs/loader:1433
throw err;
^
```

The exact missing module/error text has not yet been captured and must be retrieved from the next log lines.

## Earlier deploy failure

The two preceding deployments (`fcc68c1`, `8ec1106`) failed before migrations because the release entrypoint incorrectly required the development-only `drizzle-kit` CLI. Commit `7994366` replaced that check with a direct `drizzle-orm` migrator resolution check.

## CI state

GitHub Actions run `31849909937` for commit `8ec1106` completed successfully: lint/typecheck/unit tests, PostgreSQL RLS integration, build, Docker build/push, and Trivy all passed. CI for `7994366` is still pending at this point.

## Important distinction

The deployment’s migration and RLS paths are verified as successful. The remaining production failure is an application runtime module-resolution failure after migration completion, not a database connectivity or RLS failure.

## Log retrieval note

A subsequent direct log-panel view confirmed the migration/RLS success lines and the beginning of the Node CommonJS loader stack trace. The browser’s virtualized log viewport could not be scrolled through the generic container control and the follow-up DOM query found no retained log-option nodes after the page context reset. No additional error text has been inferred from those failed retrieval attempts.

## Root cause of the post-migration 502

The first production-only local reproduction, following the runner sequence (build with development dependencies, then `npm ci --omit=dev`), reproduced the Render stack trace exactly:

```text
OpenTelemetry instrumentation started
Error: Cannot find module 'vite'
Require stack:
- /home/ubuntu/cerefy/dist/server.cjs
```

`server.ts` had a top-level `import { createServer as createViteServer } from 'vite'`. Esbuild preserved the package as an external runtime resolution, so the production-only runner crashed even though the Vite branch was conditional. Commit `94def77` removes that top-level import and dynamically imports Vite only when `NODE_ENV !== 'production'`.

The same production-only reproduction after the correction ran for the full 20-second timeout and emitted:

```text
OpenTelemetry instrumentation started
{"message":"🚀 Cerefy Enterprise AI running", ...}
```

The timeout exit code (`124`) was expected because the server remained healthy and listening until the test harness terminated it.

## Render event follow-up

The service dashboard subsequently reported repeated failures for instance `g86gb` after the `7994366` release, including a failed liveness probe (`connect: connection refused`) and `Exited with status 1`, interleaved with recovery notifications. This is consistent with the independently reproduced Vite module-resolution crash. Auto-deploy for corrective commit `94def77` started at approximately 23:31 UTC; its final Render status remains to be verified.

## Final live verification after commit `94def77`

At 2026-08-14T23:35:34Z, the public endpoints returned:

```json
{"status":"alive","uptime":190,"timestamp":"2026-08-14T23:35:34.808Z"}
```

```json
{"status":"healthy","timestamp":"2026-08-14T23:35:35.447Z","uptime":190,"version":"1.0.0","environment":"production","checks":{"database":{"status":"up","latencyMs":58},"neo4j":{"status":"not_configured","message":"NEO4J_URI not configured for the pilot"},"gemini":{"status":"up","latencyMs":879,"message":"Live Gemini API request succeeded"},"firebase":{"status":"not_configured","message":"Firebase Admin not configured for the pilot"}}}
```

The authenticated live workflow smoke test passed against `https://cerefy-web.onrender.com`:

```text
LIVE_WORKFLOW_SMOKE_PASS {"registrationStatus":200,"workflowCreateStatus":201,"workflowPublishStatus":200,"workflowRunStatus":202,"finalWorkflowStatus":"SUCCEEDED","completedStepTypes":["AI_ANALYSIS","APPROVAL","CREATE_DECISION","NOTIFY"],"approvalStatus":"APPROVED","runId":"9533ace0-457b-404f-b14f-8b205efd0d1b","workflowId":"aaf67bc0-8691-44a1-8029-d0988c95d625"}
```

This is a live, non-fabricated verification of registration, token issuance, AI analysis through Gemini, approval before decision creation, notification, and persistence in the Render PostgreSQL database.

## Workflow recovery worker verification — pending diagnosis

After commit `ce2fd83`, a live workflow smoke test created run `a34455d2-5790-4c1b-8d77-fbd0d2a75e9d` successfully but it remained `QUEUED` through the test timeout, with all workflow step rows still `QUEUED` and no approval created. This is an honest persistence state, not a false completion. The release health endpoint remained healthy; the worker log error is being diagnosed before any success claim is made.

The Render application-log filter for `Workflow recovery worker` returned no matching entries over the current one-hour window. Therefore the worker’s startup/claim path is not yet proven; no root cause is inferred from the absence of matching lines alone.

## Workflow recovery worker verification — resolved

The live root cause was the release-time application of `src/db/rls.sql`: it recreated `tenant_isolation_workflow_runs` with only `app.current_tenant`, overwriting the worker exception established by migration `0009`. The worker therefore saw no claimable rows and the test run remained honestly `QUEUED`.

Commit `4c48c1a` preserves the narrow `app.workflow_worker=true` exception in the canonical RLS file and adds a real-PostgreSQL regression test. GitHub Actions run `31873867865` completed successfully, including the PostgreSQL RLS integration, Docker build, and high/critical image-vulnerability gate.

The post-fix live smoke test passed against `https://cerefy-web.onrender.com` with workflow run `464b1146-af9a-45f7-8cf8-4f9ec1d66de5` and workflow `90838107-80a9-458a-8d8e-e0af0efd2a64`: registration 200, workflow creation 201, publish 200, run creation 202, final status `SUCCEEDED`, completed steps `AI_ANALYSIS`, `APPROVAL`, `CREATE_DECISION`, `NOTIFY`, and approval status `APPROVED`.

The final clean local verification passed lint, typecheck, 122 unit tests, and build. `npm audit --omit=dev --audit-level=high` passed the configured threshold; its report still lists six moderate transitive Firebase/Google Cloud `uuid` findings, requiring a breaking Firebase Admin dependency upgrade to remediate fully. CI Trivy has no high or critical findings in the production image.

## Production dependency surface hardening

The runner Docker stage now installs `npm ci --omit=dev --omit=optional`. Firebase Admin’s Google Cloud Storage and Firestore modules are optional dependencies and are not used by the current pilot, whose Firebase integration is informational-only. A production-only startup smoke test passed with both optional packages absent. `npm audit --omit=dev --omit=optional --audit-level=moderate` returned `found 0 vulnerabilities` for the runner-equivalent dependency tree.
