# EyeX — Hub71 Demo Day Guide

This guide explains how to run the EyeX Hub71 AI demo for investors, prospects, and partners.

## Demo Entry Point

- **Frontend route:** `/enterprise-demo`
- **Backend endpoints:**
  - `POST /api/v1/enterprise/demo/seed`
  - `POST /api/v1/enterprise/demo/scenario`
  - `POST /api/v1/enterprise/demo/run-all`
  - `GET /api/v1/enterprise/demo/status/{org_id}`

## Scenario

The demo follows **NovaPay Technologies**, a fictional Series A fintech operating in 7 markets.

### Stages

1. **Problem Detection** — Surface churn, compliance, and cash-flow risks.
2. **AI Analysis** — Read the knowledge graph and financial metrics.
3. **Executive Team** — Run CEO, CFO, COO, and Risk agents concurrently.
4. **Recommendations** — Generate prioritized, actionable insights.
5. **Business Impact** — Quantify problems detected, recommendations, and time saved.

## Running Locally

### Backend

```bash
cd eyex-backend
python -m venv .venv
. .venv/bin/activate
pip install -e ".[dev]"
export DATABASE_URL=postgresql+asyncpg://...
export OPENAI_API_KEY=...
alembic upgrade head
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Frontend

```bash
npm install
export VITE_PYTHON_BACKEND_URL=http://localhost:8000/api/v1
npm run dev
```

Open `http://localhost:3000/enterprise-demo` after logging in.

## Production Demo Deployment

1. Deploy backend (Docker / Cloud Run / AWS / etc.).
2. Set `VITE_PYTHON_BACKEND_URL` to the deployed backend.
3. Build and deploy the frontend:
   ```bash
   npm run build
   ```
4. Verify auth flow with Supabase.
5. Run one full demo end-to-end before showtime.

## Reliability Notes

- The demo seeds data into the knowledge graph and vector memory on start.
- If the LLM is slow or unavailable, the backend returns deterministic fallback content.
- All chat and intelligence endpoints enforce daily quotas; use a dedicated demo user if needed.

## Narration

See `docs/HUB71_DEMO_SCRIPT.md` for the 5-minute investor script.

## Troubleshooting

| Symptom                   | Fix                                                                                  |
| ------------------------- | ------------------------------------------------------------------------------------ |
| `401 Unauthorized`        | Ensure the user is logged in and Supabase token is valid.                            |
| `429 Daily limit reached` | Increase `CHAT_DAILY_MESSAGE_LIMIT` or use a fresh demo user.                        |
| Empty executive output    | Backend fallback data should still render; check backend logs for LLM errors.        |
| Demo step hangs           | The backend has 45s timeouts on the agent graph; fallback will return after timeout. |
