# EyeX Technologies — AI Backend

# Python project scaffold for multi-agent LangGraph workflows.

## Tech Stack

- **Python 3.12**
- **FastAPI** — async REST framework
- **LangGraph** — multi-agent DAG orchestration
- **LangChain** — LLM integration
- **πX AI Control Plane** — model-independent provider adapter layer
- **OpenAI / Anthropic / Gemini / Ollama** — supported LLM providers
- **PostgreSQL 16** — primary database (async via asyncpg)
- **Redis 7** — caching and checkpoint storage
- **Docker Compose** — local development
- **Alembic** — schema migrations

## Quick Start

```bash
# 1. Environment
cp .env.example .env
# Edit .env with your settings

# 2. Docker
docker compose up -d

# 3. Run migrations
alembic upgrade head

# 4. Seed data
python scripts/seed.py

# 5. Open API docs
open http://localhost:8000/docs
```

## Project Structure

```
eyex-backend/
├── app/
│   ├── agents/              # LangGraph agent nodes
│   ├── ai_control_plane/    # πX AI Control Plane provider adapters
│   ├── api/                 # REST endpoints (v1)
│   ├── core/                # Security, exceptions, middleware
│   ├── db/                  # Database session & migrations
│   ├── models/              # SQLAlchemy ORM models
│   ├── schemas/             # Pydantic request/response schemas
│   ├── services/            # Business logic layer
│   ├── config.py            # Settings via pydantic-settings
│   ├── database.py          # Async engine & session factory
│   ├── dependencies.py      # FastAPI dependency injection
│   └── main.py              # FastAPI application factory
├── tests/                   # pytest test suite
├── scripts/                 # Database init & seed scripts
├── alembic/                 # Database migrations
├── Dockerfile
├── docker-compose.yml
└── pyproject.toml
```

## AI Control Plane

The πX AI Control Plane lives in `app/ai_control_plane/` and provides a
provider-agnostic adapter layer for OpenAI, Anthropic, Gemini, Ollama, and any
future OpenAI-compatible endpoint.

See `docs/AI_CONTROL_PLANE.md` for architecture and usage details.

## API Endpoints

| Method | Path                  | Description       |
| ------ | --------------------- | ----------------- |
| GET    | /api/v1/health        | Health check      |
| POST   | /api/v1/auth/register | User registration |
| POST   | /api/v1/auth/login    | Login             |
| POST   | /api/v1/auth/refresh  | Refresh token     |

## Environment Variables

See `.env.example` for the full list. Key variables:

- `DATABASE_URL` — PostgreSQL connection string
- `REDIS_URL` — Redis connection string
- `OPENAI_API_KEY` — OpenAI / LangChain API key
- `APP_SECRET_KEY` — JWT signing key (64+ random chars)

## Development

```bash
# Install dependencies
pip install -r requirements.txt

# Run locally
uvicorn app.main:app --reload --port 8000

# Run tests
pytest

# Lint
ruff check .

# Type check
mypy app/
```
