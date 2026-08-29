# SOPRANOVA — Architettura applicativa

## Confini applicativi

SOPRANOVA è implementata come applicazione React con backend Express e tRPC. La UI è l’adattamento funzionale del frontend esportato: essa comunica esclusivamente con procedure tRPC tipizzate. Il server contiene autorizzazione, validazione, orchestrazione, aggregazioni e accesso a database, AI e storage. I segreti di integrazione e le credenziali di provider restano sul server.

| Livello | Responsabilità | Regola di sicurezza |
|---|---|---|
| Client | Route, rendering, form validation ergonomica, loading/empty/error state | Non decide mai autorizzazione, tenant o validità finale dei dati |
| API tRPC | Contratti Zod, controllo membership, rate limiting applicativo, errori coerenti | Ogni operazione workspace-scoped risolve il tenant sul server |
| Servizi di dominio | Agenti, intelligence, analytics, automazioni, documenti e notifiche | Nessun servizio opera senza `workspaceId` verificato |
| Database | Persistenza relazionale e aggregazioni | Foreign key, unique constraint e indici proteggono coerenza e prestazioni |
| Storage | Byte dei file e avatar | Database conserva solo chiave, URL e metadati; accesso mediato da membership |
| AI provider | Risposte generative e strutturate lato server | Provider intercambiabile; chiavi mai nel browser; fonti autorizzate incluse nel contesto |

## Identità, tenant e RBAC

Il flusso OAuth già fornito dal progetto rimane l’unico meccanismo di identità reale. Al primo accesso un utente completa l’onboarding creando organizzazione e workspace predefinito; riceve una membership `owner`. Il ruolo globale del template rimane disponibile solo per amministrazione dell’applicazione. Ogni autorizzazione di prodotto viene invece determinata dalla membership nel workspace selezionato.

> Una procedura non può accettare un `workspaceId` come prova di accesso. Deve verificare che l’utente autenticato disponga di una membership attiva in quel workspace e applicare il ruolo richiesto prima di qualsiasi lettura o mutazione.

| Ruolo workspace | Lettura | Creazione/esecuzione | Gestione configurazione | Gestione membri e sicurezza |
|---|---|---|---|---|
| Owner | Tutte le risorse del workspace | Sì | Sì | Sì |
| Admin | Tutte le risorse del workspace | Sì | Sì | Sì, esclusi trasferimento ownership e rimozione owner |
| Member | Risorse autorizzate del workspace | Conversazioni, upload e azioni operative consentite | No | No |
| Viewer | Risorse autorizzate in sola lettura | No | No | No |

Le procedure workspace-scoped useranno middleware composabili: `workspaceProcedure` per membership attiva, `memberProcedure` per operatività, `managerProcedure` per Admin/Owner e `ownerProcedure` per azioni di massimo privilegio. Le mutazioni sensibili creeranno una riga in `auditLogs` senza registrare password, token, contenuto file o segreti.

## Modello dati normalizzato

| Dominio | Tabelle | Vincoli e indici essenziali |
|---|---|---|
| Tenant e identità | `organizations`, `workspaces`, `memberships`, estensione `users` | `memberships(workspaceId,userId)` univoco; indice per `userId`; un’organizzazione possiede più workspace |
| Profilo e preferenze | `userPreferences`, `notificationPreferences` | una preferenza per utente/workspace; valori AI e canali validati |
| Agenti | `agents`, `agentRuns` | indice `(workspaceId,status)` e `(agentId,startedAt)`; gli stati run sono `pending/running/completed/failed/cancelled` |
| Intelligence | `conversations`, `messages`, `messageSources`, `insights` | conversazione unica per workspace e titolo; messaggi ordinati per timestamp; fonti normalizzate |
| Dati e memoria | `dataSources`, `dataSourceRuns`, `documents`, `documentChunks` | ogni tabella porta `workspaceId`; unique source name per workspace; nessun blob nel database |
| Analytics | `businessMetrics` | indice `(workspaceId,metricDate,metricKey,segment)` per aggregazioni e confronti efficienti |
| Automazioni | `workflows`, `workflowNodes`, `workflowRuns` | nodi ordinati, workflow univoco per nome/workspace; runs con stato e idempotency key |
| Comunicazioni e tracciabilità | `notifications`, `auditLogs`, `integrations` | notifiche indicizzate per destinatario/letto; audit index `(workspaceId,createdAt)` |

Ogni entità di dominio contiene `createdAt`, `updatedAt`, il relativo `workspaceId` e, quando rilevante, `createdById`. I modelli supportano soft delete solo per risorse utente ad alto valore, tramite `deletedAt`; le procedure escludono per impostazione predefinita i record eliminati.

## Contratti API tRPC

Le risposte riuscite sono oggetti tipizzati specifici della procedura; gli errori tRPC usano codici prevedibili (`UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `BAD_REQUEST`, `TOO_MANY_REQUESTS`, `INTERNAL_SERVER_ERROR`) e messaggi privi di dettagli interni. Gli input pagination assumono `page`, `pageSize`, `sortBy` e `sortDirection` dove necessario; i limiti massimi sono applicati sul server.

| Router | Procedure principali | Scopo |
|---|---|---|
| `auth` | `me`, `logout`, `bootstrap` | Sessione OAuth e bootstrap workspace dell’utente |
| `workspaces` | `list`, `current`, `select`, `update` | Selezione e configurazione tenant |
| `members` | `list`, `invite`, `updateRole`, `remove` | Gestione membership con RBAC |
| `dashboard` | `overview` | KPI, serie temporali, segnali, agenti attivi e activity feed |
| `conversations` | `list`, `create`, `rename`, `delete`, `messages`, `search` | Cronologia intelligence persistente |
| `intelligence` | `ask`, `executeAction` | Orchestrazione AI, fonti e azioni confermate |
| `agents` | `list`, `get`, `create`, `update`, `setStatus`, `runs`, `runNow` | Libreria agenti ed esecuzioni tracciabili |
| `dataSources` | `list`, `create`, `update`, `sync`, `disconnect`, `runs` | Connessioni e sincronizzazioni backend |
| `documents` | `list`, `createUpload`, `completeUpload`, `getAccessUrl`, `delete` | Validazione, storage e metadati file |
| `memory` | `summary` | Metriche dell’indicizzazione autorizzata |
| `analytics` | `overview`, `segments`, `export` | Aggregazioni, filtri e download CSV |
| `workflows` | `list`, `get`, `create`, `update`, `runNow`, `runs` | Automazioni ed esecuzioni manuali |
| `notifications` | `list`, `markRead`, `markAllRead` | Notifiche persistenti per utente |
| `preferences` | `get`, `update` | Profilo, notifiche e preferenze AI |
| `audit` | `list` | Audit log, filtrato e riservato ai ruoli di gestione |

## Architettura AI e operazioni asincrone

Il servizio intelligence usa un adapter provider-side. L’adapter riceve messaggi, contesto autorizzato e opzioni di risposta; restituisce contenuto e metadati. L’attuale provider integrato è invocabile esclusivamente dal server. Le conversazioni e i messaggi sono prima persistiti, quindi la risposta del provider viene salvata con le fonti. L’integrazione può essere sostituita senza modificare i router né la UI.

Le richieste brevi rimangono sincrone. Le esecuzioni potenzialmente lunghe vengono rappresentate da `agentRuns`, `dataSourceRuns` o `workflowRuns` con transizioni di stato. Il runtime non usa timer in memoria. Le pianificazioni periodiche non vengono create finché il progetto non è distribuito e l’utente non ha confermato frequenza e proprietà del job; il modello include il campo `scheduleCronTaskUid` per un collegamento sicuro e idempotente al servizio di pianificazione compatibile con l’ambiente.

## File, data source e segreti

I file vengono accettati tramite endpoint server che verifica dimensione, tipo effettivo, nome normalizzato, membership e quota. Il server scrive il contenuto nello storage gestito e persiste solo metadati: nome originale, MIME verificato, byte, chiave storage, URL, stato di elaborazione e utente responsabile. La cancellazione rende il file non referenziabile nel database. I segreti delle data source non sono inseriti nei campi JSON della UI: saranno riferimenti a una configurazione sicura lato server.

## Osservabilità e salute

Il progetto conserva il health check del sistema e aggiunge logging strutturato per contesto sicuro: request id, user id, workspace id, procedura, durata ed esito. Gli errori del provider AI e dello storage sono convertiti in errori applicativi sicuri. Le informazioni sensibili vengono omesse dai log. Un audit log di dominio integra, senza sostituire, i log tecnici.

## Limite attuale deliberato

La UI esportata mostra campi email/password e pulsanti Google/Microsoft, ma l’identity layer disponibile è OAuth configurato dal template. Implementare password locali, invio di reset email, SAML/SCIM o OAuth con fornitori esterni richiede provider, segreti e policy aziendali non presenti nel progetto. L’app conserverà il flusso OAuth reale, renderà le route protette e documenterà questi elementi come integrazioni future invece di simulare credenziali.
