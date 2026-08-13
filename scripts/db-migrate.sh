#!/bin/sh
# scripts/db-migrate.sh
# Run database migrations safely in production

set -e

echo "📦 Running Cerefy Database Migrations..."

if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL environment variable is not set"
  exit 1
fi

echo "✅ DATABASE_URL configured"

# Drizzle-kit is a release-time requirement: never skip or swallow a migration failure.
# Use the generated SQL journal in ./drizzle. `push` performs live schema
# introspection and can fail or hang on a constrained hosted database.
DRIZZLE_KIT="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)/node_modules/.bin/drizzle-kit"
if [ ! -x "$DRIZZLE_KIT" ]; then
  echo "❌ ERROR: drizzle-kit is required for release-time migrations"
  exit 1
fi

echo "🔄 Running Drizzle migrations..."
CI=1 "$DRIZZLE_KIT" migrate --config="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)/drizzle.config.ts"
echo "✅ Drizzle migrations complete"

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
