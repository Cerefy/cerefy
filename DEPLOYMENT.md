# Cerefy Enterprise AI — Deployment Guide

> Complete deployment guide for Cerefy Enterprise AI Operating System on production infrastructure.

---

## Architecture Overview

```
Internet → Nginx (port 80/443) → cerefy-app (Node.js :3000) → PostgreSQL + Neo4j
```

**Services:**
| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| `cerefy-app` | Custom (Dockerfile) | 3000 | Monolithic Express + Vite SPA |
| `cerefy-db` | `pgvector/pgvector:pg16` | 5432 | PostgreSQL + Vector Search |
| `cerefy-graph` | `neo4j:5.20.0` | 7687 / 7474 | Knowledge Graph |
| `cerefy-proxy` | `nginx:alpine` | 80 / 443 | Reverse Proxy + TLS |

---

## Prerequisites

- Linux server: Ubuntu 22.04 LTS (minimum 4 CPU, 8GB RAM)
- Docker ≥ 24.x and Docker Compose ≥ 2.x
- A domain name pointing to your server IP
- SSL certificate (Let's Encrypt recommended)
- GitHub Container Registry access (or Docker Hub)

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
