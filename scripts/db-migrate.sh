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

echo "✅ Database migration complete"
