# SOPRANOVA — Audit iniziale delle dipendenze runtime

## Esito

Lo scaffold iniziale contiene dipendenze runtime dirette da Manus per identità, storage, AI, notifiche, analytics del preview e strumenti di sviluppo. Queste dipendenze non sono compatibili con il requisito **zero Manus runtime dependency**. Il refactoring sostituirà il runtime con adapter configurabili e con un processo Node.js avviabile da un repository clonato.

| Area | Riferimento attuale | Classificazione | Intervento necessario |
|---|---|---|---|
| Autenticazione | `server/_core/sdk.ts`, `oauth.ts`, `client/src/const.ts`, `useAuth.ts` | Produzione | Sessioni SOPRANOVA firmate, password hashate, rotte auth proprietarie e adapter OAuth opzionale. |
| Database | `DATABASE_URL` fornito dal template | Configurazione gestita | Conservare Drizzle ma collegarlo a MySQL/MariaDB controllato da SOPRANOVA; documentare backup, ambienti e migrazioni. |
| AI | `server/_core/llm.ts` e `BUILT_IN_FORGE_*` | Produzione | AI gateway interno con endpoint OpenAI-compatible configurabile e adapter provider. |
| Storage | `server/storage.ts`, `/manus-storage/*`, Forge presign | Produzione | Storage S3-compatible tramite SDK AWS e URL firmati, controllato da variabili SOPRANOVA. |
| Notifiche | `server/_core/notification.ts` | Produzione | Service email/in-app indipendente con provider configurabile. |
| Job e schedulazioni | `server/jobs.ts`, `server/worker.ts` | Produzione | Coda persistita nel database più worker Node separato e polling idempotente; eventuali trigger periodici sono affidati a un provider HTTP esterno configurato dall’organizzazione. |
| Vite / preview | `vite-plugin-manus-runtime`, collector `__manus__`, allowlist preview | Sviluppo | Rimuovere dal manifest e dalla configurazione; mantenere una configurazione Vite standard. |
| UI | `ManusDialog`, cookie/session storage preview | Produzione | Rimuovere riferimenti e usare la UI auth SOPRANOVA. |
| Log e analytics preview | `.manus-logs`, script analytics in `client/index.html` | Sviluppo/produzione | Rimuovere dalla build di produzione; adottare monitoring configurabile. |

## Architettura di destinazione

```text
React/Vite client
        ↓
SOPRANOVA Express + tRPC API
        ↓
MySQL/MariaDB controllato da SOPRANOVA
        ↓
S3-compatible object storage / AI gateway / email provider
        ↓
Database-backed queue → worker Node indipendente
```

L’implementazione non dipenderà da connettori dell’ambiente di sviluppo. Ogni integrazione provider avrà credenziali e endpoint in variabili d’ambiente SOPRANOVA. Il prodotto potrà essere distribuito su Docker, un server Node, un container service oppure infrastruttura cloud scelta successivamente.

## Criterio di portabilità

La build di produzione non deve importare plugin, environment variable, endpoint, middleware, cookie o package con riferimenti Manus. Gli artefatti di sviluppo eventualmente ancora presenti saranno esclusi dall’entrypoint, dalla build e dalla documentazione di deployment. Un audit conclusivo cercherà le occorrenze residue e le classificherà prima della consegna.

## Audit conclusivo

Una ricerca sui file di runtime e build — `client`, `server`, `shared`, `package.json`, `vite.config.ts` e `tsconfig.json` — per `manus`, `BUILT_IN_FORGE`, `VITE_APP_ID`, `OAUTH_SERVER_URL`, `VITE_OAUTH` e `manus-` non ha restituito alcuna occorrenza. Il pacchetto `vite-plugin-manus-runtime`, gli endpoint OAuth del template, proxy storage, Forge AI, heartbeat e notifiche del template sono assenti dalla build; rimangono soltanto gli adapter SOPRANOVA e i provider esterni configurabili.

| Classe | Esito |
|---|---|
| Codice e dipendenze di produzione | Nessun riferimento Manus rilevato. |
| Client compilato | Nessuno script analytics, cookie preview o endpoint Manus incluso. |
| API e worker compilati | Usano solo configurazione SOPRANOVA, database diretto, S3-compatible storage e provider AI/email esterni configurabili. |
| Artefatti non tracciati dell’ambiente di sviluppo | File di configurazione e log locali possono contenere metadata dell’ambiente, ma non sono inclusi nel repository o nell’artefatto di produzione. |
| Documentazione | I riferimenti a Manus servono esclusivamente a spiegare la migrazione e l’assenza di dipendenza runtime. |

La verifica di portabilità ha inoltre compilato il progetto e avviato l’artefatto con un ambiente vuoto, eccetto `PATH`, `NODE_ENV` e `PORT`: la home della build ha risposto con HTTP 200. Le integrazioni database, AI, storage, email e OAuth richiedono naturalmente le credenziali proprie dell’ambiente di destinazione indicate nel template di configurazione.
