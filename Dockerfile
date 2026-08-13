# ─── Stage 1: Dependency Install ─────────────────────────────────────────
FROM node:22-alpine AS deps

WORKDIR /app

# Install build tools for native modules
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci --ignore-scripts --audit=false

# ─── Stage 2: Frontend Build (Vite) ─────────────────────────────────────
FROM node:22-alpine AS frontend-builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build Vite frontend
RUN npx vite build

# ─── Stage 3: Backend Bundle (esbuild) ───────────────────────────────────
FROM node:22-alpine AS backend-builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .
COPY --from=frontend-builder /app/dist ./dist

# Bundle server.ts into a single CJS file
RUN npx esbuild server.ts \
  --bundle \
  --platform=node \
  --format=cjs \
  --packages=external \
  --sourcemap \
  --outfile=dist/server.cjs

# ─── Stage 4: Production Runner ───────────────────────────────────────────
FROM node:22-alpine AS runner

WORKDIR /app

# Security: run as non-root user
RUN addgroup --system --gid 1001 cerefy \
  && adduser --system --uid 1001 --ingroup cerefy cerefy

ENV NODE_ENV=production
ENV PORT=3000

# Install psql for release-time Drizzle/RLS migrations and production dependencies
RUN apk add --no-cache postgresql-client
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts --audit=false && npm cache clean --force

# Copy built artifacts and release-time migration assets
COPY --from=backend-builder /app/dist ./dist
COPY --chown=cerefy:cerefy --from=backend-builder /app/dist ./dist
COPY --from=backend-builder /app/drizzle ./drizzle
COPY --from=backend-builder /app/src/db/schema.ts ./src/db/schema.ts
COPY --from=backend-builder /app/src/db/rls.sql ./src/db/rls.sql
COPY --from=backend-builder /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=backend-builder /app/scripts/db-migrate.sh ./scripts/db-migrate.sh
COPY --from=backend-builder /app/scripts/release-migrate-and-start.sh ./scripts/release-migrate-and-start.sh
COPY --from=backend-builder /app/scripts/migration-bootstrap.cjs ./scripts/migration-bootstrap.cjs

# Create logs directory
RUN mkdir -p logs && chown cerefy:cerefy logs

# Make the release entrypoint executable and switch to non-root user
RUN chmod +x /app/scripts/release-migrate-and-start.sh
USER cerefy

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health/live', (r) => process.exit(r.statusCode === 200 ? 0 : 1))" || exit 1

CMD ["/app/scripts/release-migrate-and-start.sh"]
