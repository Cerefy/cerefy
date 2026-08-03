#!/bin/sh
# scripts/backup-db.sh
# PostgreSQL backup strategy

set -e

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="${BACKUP_DIR:-/backups}"
DB_NAME="${DB_NAME:-cerefy}"
DB_USER="${DB_USER:-cerefy}"

mkdir -p "$BACKUP_DIR"

echo "📦 Starting backup: $TIMESTAMP"

pg_dump \
  --dbname="$DATABASE_URL" \
  --format=custom \
  --no-password \
  --verbose \
  --file="$BACKUP_DIR/cerefy_backup_$TIMESTAMP.dump"

# Compress the backup
gzip "$BACKUP_DIR/cerefy_backup_$TIMESTAMP.dump"

echo "✅ Backup saved: $BACKUP_DIR/cerefy_backup_$TIMESTAMP.dump.gz"

# Prune backups older than 30 days
find "$BACKUP_DIR" -name "cerefy_backup_*.dump.gz" -mtime +30 -delete
echo "🧹 Old backups pruned (>30 days)"
