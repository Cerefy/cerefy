# EyeX Local Testing Checklist

Use this checklist after starting the local environment to confirm everything works.

## Environment

- [ ] Python 3.12+ is installed (`python --version`).
- [ ] Node.js 20+ and npm are installed (`node --version`, `npm --version`).
- [ ] Backend dependencies are installed (`pip install -r eyex-backend/requirements.txt`).
- [ ] Frontend dependencies are installed (`npm install`).
- [ ] `eyex-backend/.env` exists and is not the example file.
- [ ] `eyex-backend/.env` has a non-placeholder `APP_SECRET_KEY`.
- [ ] Root `.env` exists and contains `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

## Infrastructure

- [ ] Postgres is reachable via `DATABASE_URL` in `eyex-backend/.env`.
- [ ] Redis is reachable, or `RATE_LIMIT_ENABLED=false` is set so the `fakeredis` fallback is acceptable.
- [ ] `python scripts/check_local.py` (from `eyex-backend`) reports the database and backend are reachable.

## Database

- [ ] `python -m alembic upgrade head` completes without errors.
- [ ] `python scripts/seed_demo.py` creates the demo user and workspace.
- [ ] Demo user exists in the database (`demo@eyex.app`).

## Backend

- [ ] `python -m uvicorn app.main:app --host 0.0.0.0 --port 8000` starts without errors.
- [ ] `GET http://localhost:8000/api/v1/health` returns HTTP 200 and `status: ok`.
- [ ] Swagger UI loads at `http://localhost:8000/docs`.
- [ ] Login endpoint returns a token:
  ```bash
  curl -X POST http://localhost:8000/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"demo@eyex.app","password":"DemoPass123!"}'
  ```
- [ ] A protected endpoint responds with data for the demo workspace:
  ```bash
  curl -H "Authorization: Bearer <token>" http://localhost:8000/api/v1/workspaces
  ```
- [ ] Chat endpoint accepts messages (requires `OPENAI_API_KEY`).
- [ ] Enterprise demo endpoints return data (requires demo user and workspace).

## Frontend

- [ ] `npm run dev` starts without errors.
- [ ] `http://localhost:3000` loads the login page.
- [ ] Login works with the Supabase demo user (`demo@eyex.app` / `DemoPass123!`).
- [ ] With `VITE_DEMO_MODE=true`, the frontend auto-logs in the demo user and the Dashboard loads.
- [ ] Dashboard loads after authentication.
- [ ] `/enterprise-demo` route loads and displays NovaPay demo data.
- [ ] AI analysis button triggers a backend request and shows results.

## End-to-End Demo

- [ ] Sign in as demo user.
- [ ] Navigate through Dashboard, Data, Projects, Trust Intelligence, Reports.
- [ ] Open `/enterprise-demo` and run the AI analysis.
- [ ] Verify no 500 errors in the browser console or backend logs.
- [ ] Verify no CORS errors.
- [ ] Stop the environment cleanly using `.local-pids` and `docker compose down`.

## Known Limitations

- Some features (Supabase storage, email, Stripe, Slack, GitHub integrations) require real third-party credentials.
- AI features require a valid `OPENAI_API_KEY`.
- Redis is optional for local dev because `RATE_LIMIT_ENABLED=false` is recommended.
