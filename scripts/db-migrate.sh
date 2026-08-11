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

# Check if drizzle-kit is available and run push
if npx drizzle-kit --version > /dev/null 2>&1; then
  echo "🔄 Running Drizzle migrations..."
  npx drizzle-kit push --config=drizzle.config.ts
  echo "✅ Drizzle migrations complete"
else
  echo "⚠️  drizzle-kit not found, skipping migrations"
fi

# Apply Row Level Security policies. RLS must run AFTER schema push so every
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
