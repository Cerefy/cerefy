# SOPRANOVA — Audit del frontend e mappa delle funzionalità

## Obiettivo e metodo

Il frontend esportato da Figma Make è stato analizzato come **fonte di verità dell’esperienza di prodotto**. L’audit ha ricostruito route, superfici di interazione, stati locali, dataset simulati e controlli che non hanno ancora una controparte server. La conversione nel progetto full-stack manterrà la grammatica visiva esistente — avorio, indaco profondo, lavanda attenuata, superfici leggere e animazioni brevi — mentre sostituirà dati hardcoded e comportamenti simulati con procedure tRPC e stato persistente.

## Inventario delle route

| Gruppo | Route | Schermata | Stato attuale | Destinazione funzionale |
|---|---|---|---|---|
| Pubblico | `/` | Home | Landing con CTA | Marketing statico con CTA verso registrazione/contatto |
| Pubblico | `/platform`, `/intelligence`, `/agents`, `/solutions`, `/enterprise`, `/about`, `/contact` | Pagine informative | Contenuto statico | Conservate come pagine informative; nessun dato sensibile |
| Accesso | `/login` | Sign in | Form e ritardi simulati | Avvio del flusso OAuth configurato, sessione reale e reindirizzamento protetto |
| Accesso | `/signup` | Registrazione e workspace | Wizard locale simulato | Onboarding di organizzazione/workspace dopo autenticazione verificata |
| Accesso | `/forgot-password` | Recupero password | Messaggio locale simulato | Interfaccia conservata; dipende dall’identity provider per reset email/password |
| Applicazione | `/app/dashboard` | Dashboard | KPI, grafici, segnali e attività hardcoded | Query aggregate e feed di attività per workspace |
| Applicazione | `/app/intelligence` | Intelligence | Chat, conversazioni e risposta AI simulate | Conversazioni persistenti, retrieval per workspace e provider AI astratto |
| Applicazione | `/app/agents` | AI Agents | Elenchi, filtri e comandi locali | CRUD autorizzato, esecuzioni, stati e metriche reali |
| Applicazione | `/app/data` | Data | Sorgenti e documenti hardcoded; drop zone inattiva | Data source, upload S3, metadati, stati e cancellazione sicura |
| Applicazione | `/app/analytics` | Analytics | KPI e tabelle hardcoded | Aggregazioni lato server, filtri, ordinamento, paginazione ed export |
| Applicazione | `/app/automations` | Automations | Workflow e canvas dimostrativi | Workflow persistenti, manual run e cronologia esecuzioni |
| Applicazione | `/app/settings` | Settings | Profilo, toggle e sezioni placeholder | Preferenze e configurazioni persistenti, controllate da RBAC |

## Mappa verificabile: schermata → comportamento

| Schermata | Azione utente | Regola di business | Dati e modello | Procedura tRPC prevista | Permesso lato server | Stato UI atteso |
|---|---|---|---|---|---|---|
| Accesso | Accede dall’interfaccia di login | L’identità è verificata dall’identity provider; la sessione è HttpOnly e il profilo viene idratato | `users`, `memberships`, sessione OAuth | `auth.me`, callback OAuth, `workspace.bootstrap` | Pubblica per avvio; sessione valida per proseguire | Loading, errore sicuro, utente non autenticato, redirect al workspace |
| Registrazione | Completa i due passi dell’onboarding | Un nuovo utente crea o seleziona una singola organizzazione iniziale e un workspace con ruolo Owner | `organizations`, `workspaces`, `memberships`, preferenze iniziali | `onboarding.complete`, `workspace.list` | Utente autenticato senza membership | Validazione campo, avanzamento, errore, completamento |
| Dashboard | Cambia periodo, seleziona un segnale, apre agenti | I KPI sono calcolati solo su eventi e risorse del workspace attivo; confronto con periodo precedente | aggregati di `agentRuns`, `dataSources`, `insights`, `auditLogs` | `dashboard.overview` | Member o superiore nel workspace | Loading a blocchi, empty state, errore con riprova, dati aggiornati |
| Intelligence | Crea/rinomina/seleziona conversazione e invia una query | I messaggi sono isolati per workspace; retrieval e AI usano solo fonti autorizzate; azioni proposte richiedono conferma | `conversations`, `messages`, `messageSources`, `documents`, `dataSources` | `conversations.*`, `intelligence.ask`, `intelligence.executeAction` | Member per conversare; Admin per azioni che modificano risorse | Streaming/thinking, risposta con fonti, stato vuoto, errore recuperabile |
| Agenti | Filtra, distribuisce, sospende/riprende, configura o consulta attività | Le mutazioni aggiornano stato e audit log; le esecuzioni sono eventi separati e non bloccano la richiesta HTTP | `agents`, `agentRuns`, `auditLogs` | `agents.list`, `agents.create`, `agents.update`, `agents.setStatus`, `agents.runs` | Viewer legge; Member esegue; Admin/Owner modifica e distribuisce | Filtro, loading, conferma mutazione, errore, dettaglio con dati reali |
| Data source | Connette, sincronizza, configura o disconnette una sorgente | Connessioni e segreti restano server-side; una sincronizzazione produce un’esecuzione tracciabile | `dataSources`, `dataSourceRuns`, riferimenti a segreti | `dataSources.list`, `create`, `sync`, `update`, `disconnect` | Admin/Owner per mutazioni; Member/Viewer solo lettura autorizzata | Stato ready/syncing/failed/disconnected, errore esplicativo, riprova |
| Documenti | Carica, visualizza o elimina un file | Sono ammessi solo MIME, dimensione e ownership verificati; i byte restano nello storage e il DB conserva metadati | `documents`, `documentChunks`, chiavi S3 | `documents.createUpload`, `completeUpload`, `list`, `getAccessUrl`, `delete` | Member carica; Admin/Owner elimina; lettura per membri del workspace | Drop state, upload/progress, processing/ready/failed, empty state |
| Enterprise Memory | Visualizza statistiche indicizzazione | Le metriche derivano dai documenti e dalle sorgenti realmente processati nel workspace | `documents`, `documentChunks`, `dataSources` | `memory.summary` | Member o superiore | Skeleton, zero state, statistiche reali |
| Analytics | Seleziona periodo, applica filtri, consulta segmenti o esporta | Le aggregazioni e i confronti vengono calcolati nel database; risultati limitati al workspace | tabelle aggregate/metriche derivate da fonti connesse | `analytics.overview`, `analytics.segments`, `analytics.export` | Member o superiore; export tracciato | Filtro applicato, loading, tabella paginata, errore, download |
| Automations | Crea, modifica, seleziona o esegue un workflow | Un workflow contiene nodi validati; ogni esecuzione conserva transizioni e output; il run manuale è auditato | `workflows`, `workflowNodes`, `workflowRuns` | `workflows.list`, `create`, `update`, `runNow`, `runs` | Admin/Owner crea o modifica; Member può eseguire se autorizzato; Viewer legge | Canvas caricato, errore validazione, stato pending/running/completed/failed |
| Notifiche globali | Apre e contrassegna notifiche | Le notifiche sono persistenti e limitate all’utente/workspace corretto | `notifications` | `notifications.list`, `markRead`, `markAllRead` | Utente destinatario | Badge unread reale, elenco, optimistic update con rollback |
| Impostazioni profilo | Modifica nome, titolo e avatar | L’utente modifica solo il proprio profilo; avatar validato e archiviato in S3 | `users`, asset avatar | `profile.get`, `profile.update`, `profile.createAvatarUpload` | Utente proprietario del profilo | Form dirty/saving/success/error |
| Impostazioni workspace/team/security/integrations | Gestisce organizzazione, membri, ruoli, policy e integrazioni | Le mutazioni richiedono ruoli appropriati e producono audit log; le integrazioni custodiscono i segreti sul server | `organizations`, `workspaces`, `memberships`, `integrations`, `auditLogs` | `workspace.*`, `members.*`, `integrations.*` | Owner/Admin secondo l’azione | Caricamento, conferma, forbidden, empty state |
| Preferenze notifiche e AI | Attiva/disattiva canali, alert e tono | Preferenze persistenti per utente/workspace; update ottimistico reversibile | `userPreferences`, `notificationPreferences` | `preferences.get`, `preferences.update` | Utente proprietario | Toggle ottimistico con rollback e messaggio d’errore |

## Elementi simulati identificati

Tutte le metriche, gli elenchi, i segnali, i run count, i grafici e l’attività recente delle schermate autenticare sono oggi valori locali. La chat attende artificialmente e costruisce una risposta nel browser. I controlli di deploy, pausa/riprendi, configurazione, sincronizzazione, upload, modifica workflow, esecuzione manuale, filtro analytics, export, ricerca, notifiche e salvataggio impostazioni non eseguono chiamate di rete. Anche login, signup e recupero password hanno ritardi artificiali e non applicano alcuna protezione delle route.

## Assunzioni esplicite

| Tema | Assunzione applicata |
|---|---|
| Identità | Il template fornisce già OAuth e gestione della sessione. Verrà mantenuto come flusso di identità reale. I campi email/password e gli SSO Google/Microsoft dell’export saranno mantenuti visivamente, ma non verranno implementati come credenziali locali senza un provider d’identità, invio email e configurazione approvati. |
| Multi-tenancy | Ogni risorsa operativa appartiene a un workspace, a sua volta appartenente a un’organizzazione. Ogni query sensibile riceve il workspace attivo e verifica membership lato server prima di leggere o mutare dati. |
| AI e file | La base dati conterrà contratti, metadati e flussi di stato. L’invocazione di un modello e il recupero semantico saranno astratti; nessuna chiave di provider viene esposta al client. I file risiedono nello storage S3, non in colonne database. |
| Background work | Il runtime è autoscalabile e non supporta worker persistenti. Le procedure creeranno esecuzioni tracciabili e saranno progettate per essere completate o delegate in modo idempotente; attività schedulate reali richiederanno una configurazione esplicita del meccanismo previsto dal progetto. |
| Dati demo | Nessun dataset utente fittizio sarà incluso come comportamento di produzione. Il seed è riservato allo sviluppo e separato dai flussi reali. |

## Decisioni di preservazione UX

L’implementazione mantiene la gerarchia esistente: navigazione laterale, top bar, composizione delle card, palette e densità informativa. I soli adattamenti necessari saranno tecnici e di accessibilità: dialoghi reali, controlli da tastiera, aria-label, stati loading/empty/error, conferme per mutazioni rilevanti e protezione delle route. I controlli temporaneamente non realizzabili verranno esposti in modo onesto come funzioni future documentate, non come azioni simulate.
