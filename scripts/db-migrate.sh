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

# Prefer Prisma migrations in the consolidated repository
if npx prisma --version > /dev/null 2>&1; then
  echo "🔄 Running Prisma migrate deploy..."
  npx prisma migrate deploy
  echo "✅ Prisma migrations deployed"
else
  echo "⚠️  Prisma CLI not found, falling back to drizzle if available"
  if npx drizzle-kit --version > /dev/null 2>&1; then
    echo "🔄 Running Drizzle migrations..."
    npx drizzle-kit push --config=drizzle.config.ts
    echo "✅ Drizzle migrations complete"
  else
    echo "⚠️  No migration tool found; please install Prisma CLI or drizzle-kit"
    exit 1
  fi
fi

echo "✅ Database migration complete"
