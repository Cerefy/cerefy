# SOPRANOVA — Contratti API tRPC

Tutte le operazioni applicative sono esposte sotto `/api/trpc`. Gli input sono validati con Zod e i router workspace-scoped richiedono `workspaceId`; il server verifica membership attiva e ruolo prima di interrogare il database.

| Router | Procedure | Autorizzazione |
|---|---|---|
| `system` | `health` | Pubblica; restituisce `{ ok: true }` con un timestamp di controllo validato. |
| `workspaces` | `list`, `bootstrap`, `current`, `completeOnboarding`, `update` | Sessione valida; update/onboarding per Owner o Admin |
| `preferences` | `get`, `updateProfile`, `update` | Profilo proprietario; preferenze limitate a membership workspace |
| `dashboard` | `overview`, `runSummary` | Membership workspace |
| `conversations` | `list`, `create`, `rename`, `delete`, `messages`, `search` | Member; delete del proprietario o manager |
| `intelligence` | `ask` | Member; provider AI server-side e fonti del workspace |
| `agents` | `list`, `get`, `create`, `setStatus`, `runs`, `runNow` | Lettura per membership; gestione Admin/Owner; esecuzione Member |
| `dataSources` | `list`, `create`, `disconnect` | Lettura per membership; mutazioni Admin/Owner |
| `documents` | `list`, `upload`, `accessUrl`, `delete` | Upload Member; delete Admin/Owner |
| `memory` | `summary` | Membership workspace |
| `analytics` | `overview`, `segments` | Membership workspace |
| `workflows` | `list`, `get`, `create`, `update`, `runNow`, `runs` | Lettura per membership; gestione Admin/Owner; esecuzione Member |
| `notifications` | `list`, `markRead`, `markAllRead` | Solo destinatario autenticato |
| `audit` | `list` | Owner o Admin |

Le procedure usano gli errori tRPC standard: `UNAUTHORIZED` per sessioni assenti, `FORBIDDEN` per assenza di membership o ruolo, `NOT_FOUND` per risorse esterne al tenant, `BAD_REQUEST` per input non valido, `CONFLICT` per stati incompatibili e `INTERNAL_SERVER_ERROR` con messaggi privi di dettagli sensibili.
