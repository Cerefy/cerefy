# ─── Stage 1: Dependency Install ─────────────────────────────────────────
FROM node:22-alpine AS deps

WORKDIR /app/sporanova-functional

RUN apk add --no-cache python3 make g++

COPY sporanova-functional/package*.json ./
RUN npm ci --ignore-scripts

# ─── Stage 2: Frontend Build (Vite) ─────────────────────────────────────
FROM node:22-alpine AS frontend-builder

WORKDIR /app

COPY --from=deps /app/sporanova-functional/node_modules ./sporanova-functional/node_modules
COPY sporanova-functional/ ./sporanova-functional/

WORKDIR /app/sporanova-functional
RUN npx vite build

# ─── Stage 3: Backend Bundle (esbuild) ───────────────────────────────────
FROM node:22-alpine AS backend-builder

WORKDIR /app

COPY --from=deps /app/sporanova-functional/node_modules ./sporanova-functional/node_modules
COPY sporanova-functional/ ./sporanova-functional/
COPY --from=frontend-builder /app/sporanova-functional/dist ./sporanova-functional/dist

WORKDIR /app/sporanova-functional
RUN npx esbuild server/_core/index.ts \
  --bundle \
  --platform=node \
  --format=esm \
  --packages=external \
  --outfile=dist/index.js

# ─── Stage 4: Production Runner ───────────────────────────────────────────
FROM node:22-alpine AS runner

WORKDIR /app

RUN addgroup --system --gid 1001 sopranova \
  && adduser --system --uid 1001 --ingroup sopranova sopranova

ENV NODE_ENV=production
ENV PORT=3000

COPY sporanova-functional/package*.json ./sporanova-functional/
WORKDIR /app/sporanova-functional
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

COPY --from=backend-builder /app/sporanova-functional/dist ./dist
COPY --chown=sopranova:sopranova --from=backend-builder /app/sporanova-functional/dist ./dist

USER sopranova

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))" || exit 1

CMD ["node", "dist/index.js"]
