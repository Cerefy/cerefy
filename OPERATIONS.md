# Cerefy Enterprise AI — Operations Runbook

Operational guide for maintaining and monitoring the Cerefy platform in production.

---

## Autonomous Engineering Loop

When operating Cerefy as an autonomous engineering organization, follow this cycle continuously:

1. Inspect the repository and identify weaknesses.
2. Detect the highest-priority improvement opportunities.
3. Create implementation tasks and assign specialized workstreams.
4. Execute changes.
5. Test with the standard validation commands.
6. Commit and open or update the pull request.
7. Deploy when safe and appropriate.
8. Monitor LangSmith, Sentry, and platform health.
9. Learn from the results and repeat.

### Stop Conditions

Only pause the loop for:
- Missing secrets
- Irreversible destructive database operations
- Security-critical decisions

### Required Validation After Every Change

```bash
npm run lint
npm run typecheck
npm run build
```

### Branching and PR Conventions

- Use `feature/<name>` branches for all work.
- Keep commits focused and descriptive.
- Include a summary with:
  - Changes
  - Tests
  - Risks
  - Deployment notes

---

## Health Monitoring

### Endpoints

| Endpoint | Purpose | Expected Response |
|----------|---------|------------------|
| `GET /health/live` | Liveness probe | `{"status":"alive"}` |
| `GET /health/ready` | Readiness probe | `{"status":"healthy","checks":{...}}` |
| `GET /api/health` | Simple health check | `{"status":"ok"}` |
| `GET /api/metrics` | Node.js process metrics | `{"uptime":...,"memory":{...}}` |

### Monitoring Commands

```bash
# Check all containers are running
docker compose -f docker-compose.production.yml ps

# View application logs (last 100 lines)
docker logs --tail=100 -f cerefy-app

# Check readiness
curl -s http://localhost/health/ready | python3 -m json.tool

# Check Neo4j
docker exec cerefy-graph cypher-shell -u neo4j -p $NEO4J_PASSWORD "RETURN 'OK' AS status"

# Check PostgreSQL
docker exec cerefy-db psql -U cerefy -c "\l"
```

---

## Common Operations

### Restart Application (Zero-Downtime)

```bash
docker compose -f docker-compose.production.yml restart cerefy-app
```

### Apply Environment Variable Change

```bash
nano /opt/cerefy/.env
docker compose -f docker-compose.production.yml up -d --no-deps cerefy-app
```

### Scale Application

```bash
docker compose -f docker-compose.production.yml up -d --scale cerefy-app=3
```

### View Nginx Access Logs

```bash
docker logs -f cerefy-proxy
```

---

## Log Management

Logs are structured JSON in production. Use `jq` to parse:

```bash
# View recent errors
docker logs cerefy-app 2>&1 | grep '\"level\":\"error\"' | jq .

# View HTTP 5xx errors
docker logs cerefy-app 2>&1 | jq 'select(.statusCode >= 500)'

# Count requests by endpoint
docker logs cerefy-app 2>&1 | jq -r '.url' | sort | uniq -c | sort -rn | head -20
```

---

## Database Operations

### Connect to PostgreSQL

```bash
docker exec -it cerefy-db psql -U cerefy -d cerefy_production
```

### Manual Backup

```bash
docker exec cerefy-db pg_dump -U cerefy cerefy_production | gzip > /opt/backups/manual_$(date +%Y%m%d_%H%M%S).sql.gz
```

### Restore from Backup

```bash
gunzip -c /opt/backups/cerefy_backup_YYYYMMDD.sql.gz | docker exec -i cerefy-db psql -U cerefy -d cerefy_production
```

---

## Incident Response

### High Memory Usage

```bash
# Check memory
curl -s http://localhost/api/metrics | jq .memory

# Restart if needed
docker compose -f docker-compose.production.yml restart cerefy-app
```

### Database Connection Pool Exhausted

```bash
# Check active connections
docker exec cerefy-db psql -U cerefy -c "SELECT count(*) FROM pg_stat_activity WHERE state = 'active';"

# Kill idle connections
docker exec cerefy-db psql -U cerefy -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle' AND state_change < NOW() - INTERVAL '10 minutes';"
```

### Certificate Renewal

```bash
sudo certbot renew --nginx
docker compose -f docker-compose.production.yml restart cerefy-proxy
```

---

## Maintenance Windows

1. Announce downtime in Slack/Teams
2. Take a database backup: `docker exec cerefy-db pg_dump -U cerefy cerefy_production > pre_maintenance.sql`
3. Perform maintenance
4. Verify health: `curl -s http://localhost/health/ready`
5. Confirm with team

---

## Emergency Contacts & Escalation

- **Level 1 (On-Call):** Check logs → restart container → verify health
- **Level 2 (Senior Eng):** Database issues, persistent 5xx errors
- **Level 3 (Architect):** Data loss, security incidents, full outages
