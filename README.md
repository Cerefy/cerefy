# Cerefy Enterprise AI Operating System

Cerefy is a production-oriented enterprise AI workspace built around an Express + Node.js backend (`server.ts`), a Vite/React frontend, Drizzle ORM, PostgreSQL, Neo4j knowledge graph support, and observability hooks for LangSmith and Sentry.

## Quick Start

1. Install dependencies:
   ```bash
   npm ci
   ```
2. Copy `.env.example` to `.env.local` (or `.env`) and set the required values:
   - `DATABASE_URL`
   - `NEO4J_URI`
   - `NEO4J_PASSWORD`
   - `GEMINI_API_KEY`
   - `JWT_SECRET`
3. Start the development server:
   ```bash
   npm run dev
   ```

## Validation

Run the production checks after any change:

```bash
npm run lint
npm run typecheck
npm run build
```

## Deployment

- Production deployment and rollback guidance: [`DEPLOYMENT.md`](./DEPLOYMENT.md)
- Container orchestration: [`docker-compose.production.yml`](./docker-compose.production.yml)
- Operational procedures: [`OPERATIONS.md`](./OPERATIONS.md)

## Architecture Guardrails

- Preserve the existing Express + Node.js `server.ts` backend.
- Keep Drizzle ORM and PostgreSQL as the production persistence layer.
- Do not migrate to NestJS or Prisma.
- Avoid changing frontend contracts unless a change is explicitly required and validated.
