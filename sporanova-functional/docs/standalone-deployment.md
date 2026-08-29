# SOPRANOVA — Esecuzione e deployment indipendenti

## Principio operativo

SOPRANOVA è un’applicazione Node.js composta da un client React/Vite, una API Express+tRPC e un worker Node separato. Il codice non richiede un account Manus, API Manus, database gestito Manus o storage Manus per essere eseguito. Le integrazioni esterne sono controllate dalle variabili d’ambiente dell’organizzazione.

| Componente | Responsabilità | Scelta autonoma prevista |
|---|---|---|
| API | Autenticazione, RBAC, tenant isolation, business logic e file metadata | Qualsiasi host Node/container compatibile |
| Database | Utenti, sessioni, tenant, audit, metriche e coda job | MySQL 8 o MariaDB 11 gestiti da SOPRANOVA |
| Worker | Esecuzioni agenti, sincronizzazioni, elaborazione documenti e workflow | Processo Node separato, con replica scalabile |
| Storage | Byte dei documenti e URL temporanei | AWS S3, Cloudflare R2, MinIO o altro endpoint S3-compatible |
| AI gateway | Adapter per endpoint OpenAI-compatible | OpenAI, OpenRouter, gateway interno o provider compatibile |
| Email | Conferme, reset e notifiche | Console locale o Resend; adattatori aggiuntivi possibili |

## Configurazione

Il file [`config/environment.template`](../config/environment.template) contiene tutte le chiavi di configurazione senza credenziali effettive. Copiarlo localmente in un file `.env` non versionato e sostituire i valori indicati. In produzione, configurare gli stessi valori nel secret manager del provider scelto; non inserire segreti nel repository, negli argomenti CLI o nel frontend.

| Gruppo | Variabili |
|---|---|
| Applicazione e CORS | `NODE_ENV`, `PORT`, `HOST`, `APP_URL`, `APP_ORIGIN` |
| Database | `DATABASE_URL` |
| Autenticazione e cifratura | `SESSION_SECRET`, `SESSION_DAYS`, `DATA_ENCRYPTION_KEY` |
| AI | `AI_PROVIDER`, `AI_BASE_URL`, `AI_API_KEY`, `AI_MODEL` |
| Storage | `S3_BUCKET`, `S3_REGION`, `S3_ENDPOINT`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_FORCE_PATH_STYLE` |
| Email | `EMAIL_PROVIDER`, `EMAIL_FROM`, `EMAIL_API_KEY` |
| Pagamenti futuri | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` |
| Worker e monitoring | `WORKER_ID`, `WORKER_POLL_MS`, `OTEL_EXPORTER_OTLP_ENDPOINT`, `SENTRY_DSN` |

## Sviluppo locale

```bash
git clone <your-sopranova-repository>
cd sporanova-functional
corepack enable
pnpm install
cp config/environment.template .env
docker compose -f compose.dev.yml up -d database
pnpm drizzle-kit migrate
pnpm seed:dev
pnpm dev
# In a second terminal:
pnpm worker:dev
```

L’API e il client saranno disponibili su `APP_URL`. Il worker reclama job persistiti nella tabella `jobs`; può quindi essere riavviato senza perdere la coda. Per la prima esecuzione AI, impostare un endpoint compatibile e una chiave in `AI_BASE_URL` e `AI_API_KEY`. Senza questi valori, le esecuzioni AI vengono registrate come fallite e sono idonee a retry, senza ricorrere a un provider implicito.

## Produzione

```bash
pnpm install --frozen-lockfile
pnpm drizzle-kit migrate
pnpm build
pnpm start
# Separatamente, nello stesso ambiente o in un servizio worker dedicato:
pnpm worker
```

L’API serve gli asset statici costruiti e ascolta la porta assegnata da `PORT`. Il worker deve essere distribuito come processo separato con le stesse variabili database, AI, storage e monitoring; non va eseguito all’interno di una richiesta HTTP. Per le integrazioni OAuth di terze parti, registrare un’app OAuth controllata da SOPRANOVA e persistire token cifrati in `oauth_accounts`; nessun token dell’ambiente di sviluppo viene trasferito automaticamente.

## Database, migrazioni e backup

Le migrazioni Drizzle versionate sono nella directory `drizzle/`. Applicarle una sola volta per ambiente con `pnpm drizzle-kit migrate`; usare `pnpm drizzle-kit generate` dopo una modifica allo schema. Il seed `pnpm seed:dev` è esclusivamente per sviluppo: non deve essere eseguito sul database di produzione.

La strategia minima di backup deve comprendere snapshot giornalieri del database, conservazione multi-giorno in storage cifrato controllato da SOPRANOVA e una prova periodica di restore su un database isolato. Prima di un aggiornamento dello schema, acquisire un backup verificato e registrare l’operazione. Il bucket documenti necessita di versioning o retention coerente con la politica di cancellazione dell’organizzazione.

## Controlli di rilascio

```bash
pnpm check
pnpm test
pnpm build
```

Il health check pubblico è disponibile tramite `system.health` sotto `/api/trpc`. Il processo di deploy deve eseguire queste verifiche, applicare migrazioni e avviare API e worker con un account di servizio a privilegi minimi.
