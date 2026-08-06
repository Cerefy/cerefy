# EyeX Local Testing & Demo Guide

This guide explains how to run the EyeX Technologies platform fully on your local machine for testing, development, and demos.

> **Current setup:** The backend connects to the shared Supabase Postgres pooler, so you do **not** need Docker for the database. Redis is optional — the backend falls back to an in-memory `fakeredis` instance when Redis is not running.

## What You Need

- **Python 3.12+**
- **Node.js 20+** and **npm**
- A terminal with `git` (PowerShell on Windows, Bash on macOS/Linux)
- (Optional) **Docker Desktop** if you prefer to run Postgres/Redis locally instead of Supabase.

## Quick Start

From the repository root:

```powershell
# Windows
.\scripts\start-local.ps1

# macOS / Linux
bash scripts/start-local.sh
```

The script will:

1. Ensure the backend connects to the configured Postgres database (Supabase by default).
2. Run backend migrations.
3. Seed a demo user and workspace.
4. Start the Python backend on `http://localhost:8000`.
5. Start the Vite frontend on `http://localhost:3000`.

> If you are using local Docker Postgres/Redis, start them first with `docker compose -f docker-compose.yml up -d postgres redis`.

## Manual Start

If you prefer to start services manually:

### 1. Configure environment files

```bash
# Backend
cp eyex-backend/.env.example eyex-backend/.env
# Edit eyex-backend/.env and set real values for SUPABASE_URL, SUPABASE_ANON_KEY,
# SUPABASE_JWT_SECRET, and OPENAI_API_KEY if you want full AI features.

# Frontend
cp .env.example .env
# Edit .env and set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.
```

### 2. Install dependencies

```bash
cd eyex-backend
pip install -r requirements.txt

cd ..
npm install
```

### 3. Start Postgres and Redis

```bash
docker compose -f docker-compose.yml up -d postgres redis
```

### 4. Run migrations and seed demo data

```bash
cd eyex-backend
python -m alembic upgrade head
python scripts/seed_demo.py
```

### 5. Start backend

```bash
cd eyex-backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 6. Start frontend

In a new terminal:

```bash
npm run dev
```

## Verify Everything

Open these URLs in your browser or use `curl`:

| URL                                   | Expected Result                |
| ------------------------------------- | ------------------------------ |
| `http://localhost:8000/api/v1/health` | JSON with `status: ok`         |
| `http://localhost:8000/docs`          | Swagger UI for the backend API |
| `http://localhost:3000`               | EyeX frontend login page       |

Run the local check script:

```bash
cd eyex-backend
python scripts/check_local.py
```

## Demo Credentials

The seed script creates a demo account:

- **Email:** `demo@eyex.app`
- **Password:** `DemoPass123!`
- **Workspace slug:** `eyex-demo`

You can log in with the backend auth endpoint:

```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@eyex.app","password":"DemoPass123!"}'
```

The response includes an `access_token` you can use for API calls.

## Supabase Auth (Recommended)

The frontend uses Supabase Auth by default. A confirmed demo user has been created in the configured Supabase project:

- **Email:** `demo@eyex.app`
- **Password:** `DemoPass123!`

You can sign in through the UI at `http://localhost:3000/login`.

To use a different Supabase project, fill in:

- `eyex-backend/.env`: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_JWKS_URL`
- root `.env`: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

> If you use a fresh Supabase project, make sure the backend JWT verification supports the project's signing algorithm (RS256/ES256 via JWKS or HS256 via `SUPABASE_JWT_SECRET`).

### Local Demo Bypass

If you do not have a confirmed Supabase Auth user, set in root `.env`:

```bash
VITE_DEMO_MODE=true
```

With this enabled, the frontend automatically signs in through the backend demo account instead of Supabase. Protected pages become accessible, and backend API calls use the demo token. Supabase data pages may be empty if their tables are protected by Row Level Security.

## Generating a Test Token

To call protected backend endpoints without configuring Supabase:

```bash
cd eyex-backend
python scripts/generate_test_token.py
```

Use the printed token:

```bash
curl -H "Authorization: Bearer <token>" http://localhost:8000/api/v1/workspaces
```

## Hub71 Demo Scenario

The demo route `/enterprise-demo` showcases a full enterprise AI workflow:

1. Open `http://localhost:3000/enterprise-demo`.
2. Explore the tabs: **Trust Intelligence**, **Risk Scoring**, **Compliance**, and **Data Room**.
3. The scenario is based on NovaPay, a fictional fintech seeking investment readiness.
4. Click **Run AI Analysis** to trigger backend intelligence endpoints.

> Note: AI analysis requires a valid `OPENAI_API_KEY` in `eyex-backend/.env`.

## Stopping the Environment

If you used the start script, process IDs are saved in `.local-pids` at the repo root:

```powershell
# Windows
Get-Content .local-pids
Stop-Process -Id <backend_id>, <frontend_id>

# macOS / Linux
cat .local-pids
kill <backend_pid> <frontend_pid>
```

Stop Docker services:

```bash
docker compose -f docker-compose.yml down
```

## Troubleshooting

### Backend fails to start with a database error

Make sure Postgres is running:

```bash
docker compose -f docker-compose.yml ps
```

Check logs:

```bash
docker compose -f docker-compose.yml logs postgres
```

### Frontend cannot connect to backend

Ensure `VITE_PYTHON_BACKEND_URL` in root `.env` is set to `http://localhost:8000`.

### Supabase login fails with 401

`SUPABASE_JWT_SECRET` in `eyex-backend/.env` must match your Supabase project's JWT secret. The anon key alone is not enough for token verification on the backend.

### Redis is not installed

Redis is only required for rate limiting. For local development, `RATE_LIMIT_ENABLED=false` is already set in the example `.env`.

## Production Safety

- Never commit `.env` files. They are already in `.gitignore`.
- Never use the demo password or generated `APP_SECRET_KEY` in production.
- Always change the default database password before deploying.
