# EyeX Technologies

EyeX is a Vite + React frontend, a FastAPI backend, and a Supabase-backed enterprise AI platform.

## Frontend

```bash
npm install
npm run build
npm run deploy
```

The frontend is configured for static deployment with `dist/` as the build output.

## Backend

```bash
cd eyex-backend
cp .env.example .env
docker compose -f docker-compose.prod.yml up --build
```

## Data layer

```bash
# Apply Supabase migrations
supabase db push
```

## Environment

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_PYTHON_BACKEND_URL`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `APP_SECRET_KEY`

See `.env.example` and `eyex-backend/.env.production.example` for the full configuration.
