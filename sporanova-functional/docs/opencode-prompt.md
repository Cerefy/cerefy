# OpenCode Prompt — SOPRANOVA

You are taking over the private repository `SOPRANOVA/sporanova-functional` on the `main` branch. Treat the repository as the source of truth and preserve the existing Figma-exported visual language exactly. Do not redesign, simplify, replace real APIs with mocks, or introduce placeholder customer reviews, ratings, testimonials, or fabricated business data.

## Product context

SOPRANOVA is a production-oriented, multi-tenant enterprise intelligence application. It combines enterprise data sources, documents, AI intelligence, agents, analytics, decisions, memory, automations, notifications, audit logs, workspace management, authentication, and RBAC.

The public website uses a warm ivory background, navy/periwinkle/teal accents, `Instrument Serif` for display headings, and `Inter` for body copy, navigation, labels, and controls. Preserve the existing spacing, typography, rounded cards, restrained borders, subtle network motion, glow, rings, and page transitions from the Figma reference. The Hero currently includes a generated intelligence-network video, canvas motion, reduced-motion handling, and optional cinematic controls for play/pause, mute/unmute, and keyboard-accessible progress seeking.

## Technical stack

- React 19 with TypeScript
- Vite and Tailwind CSS 4
- Express server
- tRPC 11
- Drizzle ORM with MySQL/TiDB-compatible schema
- Vitest
- Standalone password/session authentication, optional provider-configured OAuth, RBAC, and multi-tenant workspace isolation
- Standalone queue and worker in `server/worker.ts`

The production build must continue to emit `dist/public`, `dist/index.js`, and `dist/worker.js`. Never hardcode the production port; use `PORT` and `HOST` environment variables. Do not restore Manus OAuth, Manus heartbeat, Manus runtime assumptions, or development-only seed-login routes.

## Important files

- `client/src/App.tsx`: route tree and public/protected shells
- `client/src/pages/Home.tsx`: public landing page, Hero video, canvas motion, cinematic controls
- `client/src/index.css`: global tokens, typography, animations, reduced-motion rules
- `client/src/components/PageTransition.tsx`: shared page transition
- `client/src/components/AnimatedSection.tsx`: viewport reveal animations
- `server/_core/index.ts`: Express entrypoint and storage proxy
- `server/routers.ts` and `server/routers/*`: typed API procedures
- `server/db.ts`: database helpers
- `server/worker.ts`: background processing for agents, documents, data sources, and workflows
- `drizzle/schema.ts`: database schema
- `docs/standalone-deployment.md`: independent deployment guide
- `docs/runtime-dependency-audit.md`: runtime independence audit
- `docs/visual-audit-evidence.md`: visual verification record
- `todo.md`: historical and active implementation checklist

## Required commands

Run these before proposing completion:

```bash
pnpm check
pnpm test
pnpm build
git diff --check
```

The current baseline is 9 Vitest files and 32 passing tests. Keep or improve this coverage. Add tests for every new API behavior, worker behavior, failure path, or security boundary. For database schema changes, update `drizzle/schema.ts`, generate the migration, inspect it, and apply SQL through the project’s database migration workflow. Never use destructive SQL casually.

## Current outstanding work

The generated Platform and Intelligence explainer videos are intentionally deferred because the video-generation quota was exhausted. Do not silently substitute fabricated videos or external copyrighted footage. When the quota is available, create two original, silent, loop-friendly, web-optimized videos: one showing enterprise data streams becoming an organized operating layer for Platform, and one showing contextual reasoning, pattern discovery, insight generation, and recommendations for Intelligence. Store assets outside the repository’s deploy bundle, upload them through the project’s approved web asset workflow, use permanent returned URLs, add poster/fallback/lazy-loading behavior, and verify desktop/mobile performance.

Do not mark the deferred video items complete until the actual assets are generated, uploaded, integrated, and tested.

## Implementation rules

1. Preserve the Figma layout and copy. Make only the requested changes.
2. Keep all tenant and workspace authorization checks server-side. Never trust a workspace ID supplied by the client without resolving it against the authenticated membership.
3. Keep credentials encrypted and never log secrets or tokens.
4. Use real tRPC procedures and database-backed behavior. Do not add mock arrays to represent customer data or testimonials.
5. Keep Hero controls keyboard reachable with visible focus states, correct ARIA labels, and graceful behavior when the video fails or reduced motion is enabled.
6. Use `prefers-reduced-motion` for canvas, video autoplay, CSS animations, and page transitions.
7. Verify responsive behavior at desktop and mobile widths.
8. Before checkpointing, read `todo.md`, mark only truly completed items as `[x]`, and ensure all tests/builds pass.
9. Do not add a Dockerfile unless production requires a system binary or another runtime; if needed, read the project Dockerfile skill first.
10. Keep documentation honest about what is implemented, deferred, provider-dependent, or only visually verified.

## First task

Inspect the current repository and git status. Run the required commands. Then review the active unchecked items in `todo.md`. Continue only with changes that are explicitly requested, and report changed files, tests, build status, and any remaining blockers at the end.
