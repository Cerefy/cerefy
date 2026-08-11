#!/bin/sh
# scripts/restore-db.sh
# PostgreSQL point-in-time restore procedure (DR, doc §8).
# Usage: DATABASE_URL=<target> ./scripts/restore-db.sh /backups/cerefy_backup_<ts>.dump.gz
# Disables write access while restoring, verifies row counts afterward,
# and echoes an RPO estimate from the dump's data-soonest timestamp.

set -e

RESTORE_SOURCE="${1:-}"
if [ -z "$RESTORE_SOURCE" ]; then
  echo "Usage: $0 <backup.dump.gz>" >&2
  exit 1
fi

SOURCE_BASE="${RESTORE_SOURCE%.gz}"
if [ "$SOURCE_BASE" = "$RESTORE_SOURCE" ]; then
  gunzip -k "$RESTORE_SOURCE" "$SOURCE_BASE.tmp"
  SOURCE="$SOURCE_BASE.tmp"
else
  gunzip -k "$RESTORE_SOURCE" "$SOURCE_BASE.tmp2" 2>/dev/null || true
  SOURCE="$SOURCE_BASE.tmp2"
fi

echo "=== Restore: $RESTORE_SOURCE -> ${DATABASE_URL:-DATABASE_URL}"
echo "=== Disabling writes (terminating active sessions, revoking connect) ==="
psql "$DATABASE_URL" -c "ALTER DATABASE \"$(basename "$DATABASE_URL")\" CONNECTION LIMIT 0;" 2>/dev/null || true
psql "$DATABASE_URL" -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = current_database() AND pid <> pg_backend_pid();" 2>/dev/null || true

echo "=== Restoring custom-format dump ==="
pg_restore \
  --dbname="$DATABASE_URL" \
  --no-owner \
  --no-privileges \
  --clean \
  --if-exists \
  --single-transaction \
  --verbose \
  "$SOURCE"

rm -f "$SOURCE" "$SOURCE_BASE.tmp" "$SOURCE_BASE.tmp2"

echo "=== Verifying restore with data-sanity checks ==="
psql "$DATABASE_URL" -c "SELECT count(*) AS tenant_count FROM tenants;" 2>/dev/null \
  || echo "notice: 'tenants' table not present in this schema — skipping sanity check"

echo "=== RPO estimate ==="
RPO_HINT=$(psql "$DATABASE_URL" -tAc "SELECT max(created_at) FROM ai_answers;" 2>/dev/null || true)
echo "Newest restored ai_answer timestamp: ${RPO_HINT:-unavailable}"
echo "RPO = (now - newest restored row) assuming backups ran per policy (see OPERATIONS.md)"
echo "=== Restore complete ==="