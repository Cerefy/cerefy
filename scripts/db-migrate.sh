#!/bin/sh
# scripts/db-migrate.sh
# Run database migrations safely in production

set -eu

echo "📦 Running Cerefy Database Migrations..."

if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL environment variable is not set"
  exit 1
fi

echo "✅ DATABASE_URL configured"

echo "🔎 Checking PostgreSQL connectivity..."
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -Atqc "SELECT current_database() || ' / ' || current_user"
echo "✅ PostgreSQL connectivity verified"

echo "🔎 Ensuring pgvector extension is enabled..."
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c "CREATE EXTENSION IF NOT EXISTS vector;"
echo "✅ pgvector extension verified"

# Run Drizzle ORM's direct PostgreSQL migrator instead of the drizzle-kit CLI.
# This preserves the generated migration journal while avoiding CLI spinner/process
# behavior that has been non-diagnostic on Render's constrained Free runtime.
APP_DIR="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
MIGRATION_RUNNER="$APP_DIR/scripts/run-drizzle-migrations.cjs"
if [ ! -f "$MIGRATION_RUNNER" ]; then
  echo "❌ ERROR: direct Drizzle migration runner is required for release-time migrations" >&2
  exit 1
fi

echo "🔄 Running Drizzle migrations..."
node "$MIGRATION_RUNNER"

# Apply Row Level Security policies. RLS must run AFTER generated migrations so every
# table referenced by src/db/rls.sql exists (audit BLOCKER-1: previously no
# deploy path ever enabled RLS — production was effectively wide-open).
echo "🔄 Enabling Row Level Security..."
if command -v psql > /dev/null 2>&1; then
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f src/db/rls.sql
  echo "✅ RLS enabled on all tenant tables"
else
  echo "⚠️  psql not found, skipping RLS enforcement"
  echo "⚠️  WARNING: RLS will NOT be enabled — do not deploy without RLS"
fi

echo "✅ Database migration complete"
