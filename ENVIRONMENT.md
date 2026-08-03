# Cerefy Enterprise AI — Environment Variables Reference

All required and optional environment variables for running the Cerefy platform.

---

## Required Variables

| Variable | Example | Description |
|----------|---------|-------------|
| `NODE_ENV` | `production` | Runtime environment (`development` / `production`) |
| `PORT` | `3000` | HTTP port the server listens on |
| `GEMINI_API_KEY` | `AIza...` | Google Gemini API Key for AI features |
| `DATABASE_URL` | `postgresql://user:pass@host:5432/db` | Full Postgres connection string |

---

## Authentication

| Variable | Example | Description |
|----------|---------|-------------|
| `JWT_SECRET` | *(random 64-char string)* | Secret for signing JWT access tokens |
| `JWT_REFRESH_SECRET` | *(random 64-char string)* | Secret for refresh tokens |
| `FRONTEND_URL` | `https://cerefy.yourcompany.com` | Allowed CORS origin |

> **Generate secrets with:** `openssl rand -base64 48`

---

## Firebase

| Variable | Example | Description |
|----------|---------|-------------|
| `GOOGLE_APPLICATION_CREDENTIALS` | `/secrets/firebase-sa.json` | Path to Firebase service account JSON |
| `FIREBASE_PROJECT_ID` | `cerefy-prod` | Firebase project ID |

---

## Database (PostgreSQL)

| Variable | Example | Description |
|----------|---------|-------------|
| `DB_USER` | `cerefy` | Postgres username |
| `DB_PASSWORD` | *(strong password)* | Postgres password |
| `DB_NAME` | `cerefy_production` | Database name |
| `DB_HOST` | `cerefy-db` | Host (use Docker service name) |
| `DB_PORT` | `5432` | Postgres port |

---

## Neo4j Graph Database

| Variable | Example | Description |
|----------|---------|-------------|
| `NEO4J_URI` | `bolt://cerefy-graph:7687` | Neo4j Bolt connection URI |
| `NEO4J_USER` | `neo4j` | Neo4j username |
| `NEO4J_PASSWORD` | *(strong password)* | Neo4j password |

---

## Optional / Advanced

| Variable | Default | Description |
|----------|---------|-------------|
| `LOG_LEVEL` | `info` | Logging verbosity (`debug`, `info`, `warn`, `error`) |
| `MAX_REQUEST_BODY_MB` | `10` | Max body size in megabytes |
| `REDIS_HOST` | — | Redis host for session caching (optional) |
| `REDIS_PORT` | `6379` | Redis port |
| `VITE_API_URL` | `` (empty) | Frontend API base URL (empty = same origin) |

---

## Security Best Practices

1. **Never commit `.env` files** — they are `.gitignore`d by default.
2. **Use a secrets manager** (GitHub Secrets, AWS Secrets Manager, HashiCorp Vault) for production.
3. **Rotate JWT secrets** every 90 days.
4. **Use strong passwords** — minimum 32 characters with mixed case and symbols.
5. **Set `FRONTEND_URL`** exactly to your domain — this enforces strict CORS.
