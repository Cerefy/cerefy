# Cerefy Enterprise AI — Deployment Guide

> Complete deployment guide for Cerefy Enterprise AI Operating System on production infrastructure.

---

## Architecture Overview

```
Internet → Nginx (port 80/443) → cerefy-app (Node.js :3000) → PostgreSQL + Neo4j + Qdrant + Temporal
```

**Services:**
| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| `cerefy-app` | Custom (Dockerfile) | 3000 | Monolithic Express + Vite SPA |
| `cerefy-db` | `pgvector/pgvector:pg16` | 5432 | PostgreSQL + Vector Search |
| `cerefy-graph` | `neo4j:5.20.0` | 7687 / 7474 | Knowledge Graph |
| `cerefy-proxy` | `nginx:alpine` | 80 / 443 | Reverse Proxy + TLS |
| `cerefy-qdrant` | `qdrant/qdrant:latest` | 6333 / 6334 | Long-term vector memory |
| `cerefy-temporal` | `temporalio/auto-setup:latest` | 7233 | Durable workflow execution |

---

## Prerequisites

- Linux server: Ubuntu 22.04 LTS (minimum 4 CPU, 8GB RAM)
- Docker ≥ 24.x and Docker Compose ≥ 2.x
- A domain name pointing to your server IP
- SSL certificate (Let's Encrypt recommended)
- GitHub Container Registry access (or Docker Hub)

---

## Required Environment

Set these values before deployment:

- `DATABASE_URL`
- `GEMINI_API_KEY`
- `NEO4J_URI`
- `NEO4J_PASSWORD`
- `GITHUB_TOKEN`
- `QDRANT_URL`
- `QDRANT_API_KEY`
- `LANGSMITH_API_KEY`
- `SENTRY_DSN`
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_ZONE_ID`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `GOOGLE_APPLICATION_CREDENTIALS`
- `FIREBASE_PROJECT_ID`
- `TEMPORAL_ADDRESS`
- `TEMPORAL_NAMESPACE`
- `TEMPORAL_TASK_QUEUE`

---

## Step-by-Step Deployment

### 1. Prepare the server

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y docker.io docker-compose-v2 git curl
sudo systemctl enable docker && sudo systemctl start docker
sudo usermod -aG docker $USER
```

### 2. Clone the repository

```bash
git clone https://github.com/YOUR_ORG/cerefy.git /opt/cerefy
cd /opt/cerefy
```

### 3. Configure environment

```bash
cp .env.production .env
nano .env
```

**Required values to change:**
- `DB_PASSWORD` — strong random password
- `NEO4J_PASSWORD` — strong random password
- `JWT_SECRET` — generate with `openssl rand -base64 48`
- `GEMINI_API_KEY` — your Google Gemini API key
- `FRONTEND_URL` — your actual domain (`https://cerefy.yourcompany.com`)
- `QDRANT_API_KEY`, `LANGSMITH_API_KEY`, `SENTRY_DSN`, `CLOUDFLARE_API_TOKEN` — production credentials

### 4. Build the Docker image

```bash
docker build -t cerefy-app:latest .
```

### 5. Start all services

```bash
docker compose -f docker-compose.production.yml up -d
```

### 6. Verify all containers are healthy

```bash
docker compose -f docker-compose.production.yml ps
# All services should show: Up (healthy)
```

### 7. Run database migrations

```bash
docker exec cerefy-app sh scripts/db-migrate.sh
```

### 8. Verify the health endpoint

```bash
curl http://localhost/health/ready
# Expected: {"status":"healthy","checks":{...}}
```

### 9. Setup SSL with Let's Encrypt

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d cerefy.yourcompany.com
```

### 10. Configure Cloudflare

- Add the production domain to Cloudflare.
- Set DNS records to point at the Nginx reverse proxy.
- Enable proxying / edge caching / WAF rules as needed.
- Verify SSL mode is set to Full (strict).

### 11. Configure LangSmith and Sentry

- Set `LANGSMITH_API_KEY` and `LANGSMITH_PROJECT` for traces.
- Set `SENTRY_DSN` and `SENTRY_ENVIRONMENT` for error reporting.
- Confirm both systems receive events from runtime failures and agent executions.

### 12. Configure Temporal

- Provide `TEMPORAL_ADDRESS`, `TEMPORAL_NAMESPACE`, and `TEMPORAL_TASK_QUEUE`.
- Verify workflow orchestration is reachable before enabling durable jobs.

### 13. Verify external services

- PostgreSQL: migrations applied and connections healthy
- Neo4j: graph connection and query execution healthy
- Qdrant: vector search healthy
- GitHub: branch / PR automation operational
- Cloudflare: DNS and SSL active
- LangSmith: trace ingestion active
- Sentry: release / error ingestion active

---

## Updating to a New Version

```bash
cd /opt/cerefy
git pull origin main
docker build -t cerefy-app:latest .
docker compose -f docker-compose.production.yml up -d --no-deps cerefy-app
docker system prune -f
```

---

## Database Backup

Manual backup:
```bash
docker exec cerefy-db bash -c "pg_dump -U cerefy cerefy_production" > backup_$(date +%Y%m%d).sql
```

Automated backup (cron, daily at 2 AM):
```bash
echo "0 2 * * * docker exec cerefy-db bash -c 'pg_dump -U cerefy cerefy_production | gzip' > /opt/backups/cerefy_$(date +\%Y\%m\%d).sql.gz" | crontab -
```

---

## Rollback Procedure

```bash
# List recent images
docker images cerefy-app

# Redeploy a specific tag
docker tag cerefy-app:sha-PREVIOUS cerefy-app:latest
docker compose -f docker-compose.production.yml up -d --no-deps cerefy-app
```

---

## Common Issues

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| Container exits immediately | Bad env variable | `docker logs cerefy-app` |
| 502 Bad Gateway | App not started | Check `docker ps` and app logs |
| DB connection refused | DB not healthy | Wait for DB healthcheck to pass |
| Firebase auth fails | Service account missing | Set `GOOGLE_APPLICATION_CREDENTIALS` |
| Qdrant queries fail | Missing Qdrant credentials | Verify `QDRANT_URL` and `QDRANT_API_KEY` |
| Temporal workflows unavailable | Temporal not configured | Set `TEMPORAL_*` environment variables |
