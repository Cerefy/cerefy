# SOPRANOVA

SOPRANOVA è una piattaforma enterprise multi-tenant per intelligence, agenti, dati, analytics, automazioni e notifiche. Il repository contiene un client React, un’API Express+tRPC, un database MySQL/MariaDB gestito dall’organizzazione, storage S3-compatible, un AI gateway configurabile e un worker Node separato.

## Architettura indipendente

| Componente | Implementazione |
|---|---|
| Client | React, Vite e tRPC client |
| API | Express, tRPC, Zod e RBAC server-side |
| Identità | Password hashate, sessioni HttpOnly e Google OAuth configurato dall’organizzazione |
| Dati | Drizzle con MySQL/MariaDB, migrazioni versionate e isolamento per workspace |
| Storage | AWS S3 SDK e provider S3-compatible configurabili |
| AI | Gateway OpenAI-compatible configurato da `AI_BASE_URL`, `AI_API_KEY` e `AI_MODEL` |
| Lavoro asincrono | Coda `jobs` persistita nel database e worker Node autonomo |

Nessun componente di produzione richiede servizi, API, account o credenziali Manus. Per l’architettura, i contratti e l’audit, consultare [docs/architecture.md](docs/architecture.md), [docs/frontend-audit.md](docs/frontend-audit.md), [docs/api.md](docs/api.md), [docs/runtime-dependency-audit.md](docs/runtime-dependency-audit.md) e [docs/standalone-deployment.md](docs/standalone-deployment.md).

## Avvio locale

```bash
pnpm install
cp config/environment.template .env
docker compose -f compose.dev.yml up -d database
pnpm drizzle-kit migrate
pnpm seed:dev
pnpm dev
```

In un secondo terminale, avviare il worker con `pnpm worker:dev`. Per utilizzare AI, storage o email reali, configurare le rispettive variabili in `.env` locale o nel secret manager dell’infrastruttura di produzione.

| Comando | Scopo |
|---|---|
| `pnpm dev` | Avvia API Express e frontend Vite in sviluppo. |
| `pnpm worker:dev` | Avvia il worker di sviluppo per la coda persistente. |
| `pnpm check` | Verifica TypeScript. |
| `pnpm test` | Esegue Vitest. |
| `pnpm build` | Compila client, API e worker. |
| `pnpm start` | Avvia l’API compilata. |
| `pnpm worker` | Avvia il worker compilato. |
| `pnpm drizzle-kit generate` | Genera una nuova migrazione. |
| `pnpm drizzle-kit migrate` | Applica le migrazioni versionate. |

## Sicurezza e operatività

Le azioni del workspace sono autorizzate sul server in base alla membership e ai ruoli Owner, Admin, Member e Viewer. I file vengono validati e gestiti con chiavi storage, metadata e URL firmati; i byte non vengono archiviati nel database. Il seed è bloccato fuori da `NODE_ENV=development` e non deve essere eseguito in produzione.

Prima di distribuire, eseguire `pnpm check`, `pnpm test` e `pnpm build`, quindi avviare API e worker come processi separati. Il piano di backup, restore e migrazione è documentato in [docs/standalone-deployment.md](docs/standalone-deployment.md).
