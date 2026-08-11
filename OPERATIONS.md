# Cerefy Enterprise AI — Operations Runbook

Operational guide for maintaining and monitoring the Cerefy platform in production.

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
docker logs cerefy-app 2>&1 | grep '"level":"error"' | jq .

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

## Disaster Recovery (DR)

RPO/RTO are verified in practice, not assumed.

### Backup & Restore Scripts (doc §8)

| Script | Purpose |
|--------|---------|
| `scripts/backup-db.sh` | PostgreSQL custom-format dump to `$BACKUP_DIR`, gzip, 30-day prune |
| `scripts/restore-db.sh` | Point-in-time restore: terminate sessions, `pg_restore --clean --single-transaction`, verify, print RPO estimate |
| `scripts/dr-drill.sh` | Non-destructive DR drill: restore latest backup into a scratch DB, assert `ai_answers`/`ai_queries` are queryable, drop scratch |

### DR Drill (quarterly, and before any breaking migration)

```bash
BACKUP_DIR=/opt/backups DR_DATABASE_URL=postgres://cerefy:...@localhost:5433/cerefy_dr_drill \
  DR_HOST=postgres://cerefy:...@localhost:5433/postgres \
  sh scripts/dr-drill.sh
```

### RPO / RTO

- **RPO target**: ≤ 24h (backup policy in `backup-db.sh` with 30-day retention).
- **RTO target**: ≤ 4h (restore verified by `dr-drill.sh`).
- Every drill run must return `DR drill PASSED` before a major schema migration is approved in CI/CD.

### Multi-Region Failover (doc §8)

Planned before it is needed for the first enterprise/government deal:

| Aspect | Plan |
|--------|------|
| Primary | Current region (data residency: MENA default per `organization_intelligence_profiles.data_residency`) |
| Failover region | Secondary region in the SAME residency jurisdiction — a failover that moves data across a legal border is not a recovery plan, it is a compliance incident |
| State | App layer stateless (in-memory dev stores only in `DEV_LOCAL_FALLBACK`); runtimes + agents stateless — any region can serve any request |
| Data plane | PostgreSQL streaming replication (≥1 standby in the failover region); backups already daily + PITR (§8) |
| Traffic | DNS-based failover (no LB pinned to one region); runbook `rb-failover` with run order: verify standby → promote → repoint DNS → verify `/health/ready` → notify on-call |
| Verification | Failover exercised during the quarterly `dr-drill.sh`, not only after an incident |

**Rule**: a failover region must honour the same data-residency commitment as primary. Never fail over into a jurisdiction the tenant's data is not allowed to reside in.

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
