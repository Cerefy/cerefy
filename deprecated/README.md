# Deprecated backend stacks

These directories are preserved for historical reference only. They are **not deployed, built, linted, tested, or imported by the active Cerefy runtime**.

## `deprecated/apps-api`

This was the alternative NestJS/Prisma API backend. It contained a separate authentication module, including the JWT strategy in `deprecated/apps-api/src/auth/jwt.strategy.ts`, plus its own application modules and persistence assumptions. The canonical deployed backend is the root `server.ts` + Drizzle runtime built by the root `Dockerfile`, so this stack is quarantined rather than deleted until the historical reference review is complete.

## `deprecated/eyex-backend`

This was the alternative Python/FastAPI backend and its associated tests, migrations, and package metadata. It is not part of the root Node.js Docker build or start command and is quarantined to prevent its findings and dependencies from affecting the active application.

## `deprecated/enterprise`

This was the unused root enterprise architecture branch, including `enterprise/api` and `enterprise/identity`. The unsigned identity-token implementation is preserved here for historical reference. It is not imported by the canonical `server.ts` runtime and is excluded from active TypeScript and Docker analysis.

## Import policy

None of these directories may be imported, required, copied into a runtime bundle, or included in active CI/build/lint/test commands. The unsigned JWT fallback and unsigned identity-token implementation remain preserved inside their quarantined historical locations where applicable. Their deletion is intentionally deferred to a later task after a separate historical-reference decision.
