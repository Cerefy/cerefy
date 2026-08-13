#!/bin/sh
# Render release-time database migration and server entrypoint.
# The server must not start if schema migration or RLS application fails.
set -eu

APP_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)

if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL is required before starting Cerefy" >&2
  exit 1
fi

if ! command -v psql >/dev/null 2>&1; then
  echo "ERROR: psql is required for release-time RLS enforcement" >&2
  exit 1
fi

if [ ! -x "$APP_DIR/node_modules/.bin/drizzle-kit" ]; then
  echo "ERROR: drizzle-kit is required for release-time migrations" >&2
  exit 1
fi

if [ ! -f "$APP_DIR/scripts/db-migrate.sh" ]; then
  echo "ERROR: scripts/db-migrate.sh is required for release-time migrations" >&2
  exit 1
fi

if [ ! -f "$APP_DIR/scripts/migration-bootstrap.cjs" ]; then
  echo "ERROR: scripts/migration-bootstrap.cjs is required for release-time migrations" >&2
  exit 1
fi

# Render Free expects the container to answer its liveness probe while a cold
# database connection and migrations are starting. This bootstrap is not the
# application: it exposes only /health/live and is killed before server start.
node "$APP_DIR/scripts/migration-bootstrap.cjs" &
BOOTSTRAP_PID=$!
cleanup() {
  kill "$BOOTSTRAP_PID" 2>/dev/null || true
  wait "$BOOTSTRAP_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

# Any migration or RLS failure exits non-zero; the real server is never started.
echo "Running release-time database migration before server start..."
sh "$APP_DIR/scripts/db-migrate.sh"
echo "Release-time database migration complete."

cleanup
trap - EXIT INT TERM
exec node "$APP_DIR/dist/server.cjs"
