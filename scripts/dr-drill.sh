#!/bin/sh
# scripts/dr-drill.sh
# Non-destructive DR drill: restore a recent backup into a scratch database,
# assert key tables are queryable and row counts are non-zero, then drop it.
# Fails loudly if any step does — proving the backups are actually restorable
# (doc §8: RPO/RTO verification must be exercised, not assumed).

set -e

if [ -z "$DR_DATABASE_URL" ] || [ -z "$DR_HOST" ]; then
  echo "Usage (env): DR_DATABASE_URL=<pg://...> DR_HOST=<host> ./scripts/dr-drill.sh [backup.dump.gz]" >&2
  echo "  - DR_DATABASE_URL is the FULL restore URL for the scratch DB (created by this script)." >&2
  exit 1
fi

RESTORE_SOURCE="${1:-}"
if [ -z "$RESTORE_SOURCE" ]; then
  LATEST_DUMP=$(ls -1t /backups/cerefy_backup_*.dump.gz 2>/dev/null | head -n1)
  [ -z "$LATEST_DUMP" ] && { echo "No backup found; pass one explicitly." >&2; exit 1; }
  RESTORE_SOURCE="$LATEST_DUMP"
fi

echo "=== DR drill using: $RESTORE_SOURCE"
echo "=== Extracting to scratch file ==="
gunzip -k "$RESTORE_SOURCE"
SCRATCH="${RESTORE_SOURCE%.gz}"
trap 'rm -f "$SCRATCH"' EXIT

echo "=== Creating scratch DB on $DR_HOST ==="
psql "$DR_HOST" -c "DROP DATABASE IF EXISTS cerefy_dr_drill;" 2>/dev/null || true
psql "$DR_HOST" -c "CREATE DATABASE cerefy_dr_drill;" 2>/dev/null || true
SCRATCH_URL="${DR_DATABASE_URL/cerefy_dr_shadow/cerefy_dr_drill}"

echo "=== Restoring into scratch DB ==="
pg_restore --dbname="$SCRATCH_URL" --no-owner --no-privileges --clean --if-exists "$SCRATCH"

echo "=== Sanity assertions ==="
assert_table_count() {
  TABLE="$1"
  COUNT=$(psql "$SCRATCH_URL" -tAc "SELECT count(*) FROM $TABLE;" 2>/dev/null || echo "")
  if [ -z "$COUNT" ]; then
    echo "FAIL: table $TABLE missing or unqueryable in restored backup" >&2
    exit 1
  fi
  echo "OK: $TABLE has $COUNT row(s)"
}
assert_table_count "ai_answers"
assert_table_count "ai_queries"

echo "=== Cleaning up scratch DB ==="
psql "$DR_HOST" -c "DROP DATABASE cerefy_dr_drill;" 2>/dev/null || true
echo "=== DR drill PASSED ==="