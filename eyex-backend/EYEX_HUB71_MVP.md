# EyeX Technologies — Hub71 MVP

## Executive Summary

EyeX Technologies delivers an **AI-powered business decision intelligence platform** purpose-built for the Hub71 ecosystem. Our MVP demonstrates a production-grade multi-agent system that ingests raw company data, performs multi-perspective analysis, and generates actionable strategic recommendations — all through an interactive dashboard.

**Value Proposition:** Replace weeks of manual business analysis with a 60-second automated intelligence pipeline that any founder, investor, or operator can trigger with one click.

**Demo Hero:** The **NovaPay fintech scenario** on `/enterprise-demo` runs end-to-end problem detection, AI analysis, CEO/CFO/COO/Risk agent reasoning, recommendations, and business impact — live and traceable.

---

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│   User clicks   │ →  │   Knowledge      │ →  │   Multi-Agent    │
│   “Start Demo”  │    │   Graph + Memory │    │   Executive Team │
└─────────────────┘    └──────────────────┘    └────────┬─────────┘
                                                        │
        ┌───────────────────────────────────────────────┼──────────┐
        │                                               │          │
        ▼                                               ▼          ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Problem    │ →  │   Analysis   │ →  │Recommendations│ → │   Impact     │
│  Detection   │    │   Engine     │    │   Engine      │    │  Metrics     │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
```

### Two Core Pipelines

| Pipeline            | Agents                                                                 | Purpose                                      |
| ------------------- | ---------------------------------------------------------------------- | -------------------------------------------- |
| **Intelligence** 🧠 | Analyst → Strategist → Decision                                        | Business analysis, strategic recommendations |
| **Engineering** 🛠️  | Planner → Researcher → Coder → Reviewer → Tester → Documenter → DevOps | Full-stack development automation            |

### Agent Count: **13 specialized agents**

---

## Key Features

### 1. Multi-Agent Intelligence Pipeline

- **Analyst Agent:** Financial metrics, trend detection, anomaly identification
- **Strategist Agent:** Strategic recommendations, risk assessment, opportunity mapping
- **Decision Agent:** Executive summaries, decision chains, confidence scoring

### 2. Company Memory System

- **5 memory layers:** conversation, long-term, agent, short-term, vector
- **Vector embeddings** for semantic search across company knowledge
- **Document understanding** with chunking and storage
- **Organization-scoped data isolation** so one company cannot see another's sessions

### 3. Decision Intelligence Demo

- Analyze → Detect patterns → Generate recommendations → Explain reasoning
- Full transparency: each agent's output and reasoning chain visible
- Deterministic fallback data ensures the demo never fails on stage

### 4. REST API

- `POST /api/v1/enterprise/demo/seed` — Seed NovaPay demo data
- `POST /api/v1/enterprise/demo/scenario` — Run a single demo step
- `POST /api/v1/enterprise/demo/run-all` — Run the full pipeline in one request
- `GET /api/v1/enterprise/demo/status/{org_id}` — Check seeded status
- `POST /api/v1/chat` — Natural-language chat with the agent graph
- `POST /api/v1/intelligence/analyze` — Submit business query
- `GET /api/v1/knowledge-graph/{org_id}` — Query company knowledge graph

---

## Tech Stack

| Layer         | Technology                                                            |
| ------------- | --------------------------------------------------------------------- |
| **Backend**   | Python 3.12, FastAPI, LangGraph, SQLAlchemy, PostgreSQL, Redis        |
| **AI Agents** | LangGraph AgentExecutor, structured Pydantic outputs                  |
| **Memory**    | PostgreSQL persistent memory + Redis short-term cache + vector memory |
| **Frontend**  | React 19, TypeScript, TanStack Router, Vite, Tailwind CSS, shadcn/ui  |
| **Design**    | Glass-morphism, dark theme, responsive                                |
| **DevOps**    | Docker, GitHub Actions CI/CD, Cloudflare Pages                        |

---

## Demo Scenario: NovaPay Technologies

NovaPay is a fictional Series A fintech building real-time cross-border payments for emerging markets.

- **Funding:** $8.5M raised, $42M valuation
- **Team:** 45 employees across UAE, Kenya, India
- **Traction:** $320K monthly revenue, 18 enterprise clients, 12,500 MAU
- **Markets:** 7 operating countries
- **Demo Risks:** 4.2% monthly churn, multi-jurisdiction compliance, $180K/month burn

The demo walks investors through the exact workflow a real customer would experience.

---

## Running the Demo

1. Ensure the backend is running and `VITE_PYTHON_BACKEND_URL` points to it.
2. Log in to the frontend (Supabase auth is required).
3. Navigate to **Enterprise Demo**.
4. Click **Start Demo**.
5. Narrate each stage using `docs/HUB71_DEMO_SCRIPT.md`.

The demo is designed to complete in **60–90 seconds** and includes backend fallbacks so it remains impressive even if LLM latency spikes.

---

## Recent Hardening for Demo Day

- ✅ Endpoint authentication and admin authorization
- ✅ Org/workspace-level session and memory isolation
- ✅ Memory pagination and bounded limits
- ✅ CPU-bound pipeline work moved to a thread pool
- ✅ Daily AI usage quotas (chat and intelligence endpoints)
- ✅ Full-stack GitHub Actions CI/CD with PostgreSQL and migrations
- ✅ Polished demo UI with progress bar, step timeline, and impact metrics
- ✅ Deterministic demo fallback data for reliability on stage

---

## Development Roadmap

### ✅ Phase 1 — AI Core (Complete)

- [x] 13 specialized LangGraph agents
- [x] Supervisor routing (intelligence + engineering)
- [x] Persistent memory and vector search
- [x] Knowledge graph construction

### ✅ Phase 2 — Enterprise Trust & Governance (Complete)

- [x] AI governance, risk scoring, and approval workflows
- [x] Audit log with integrity chain
- [x] Security hardening and secret hygiene

### ✅ Phase 3 — Demo Day Polish (Complete)

- [x] End-to-end NovaPay scenario
- [x] Real-time multi-agent executive team demo
- [x] Investor-facing UI/UX
- [x] 5-minute demo script and product documentation

### 🔄 Phase 4 — Pilot Growth (Next)

- [ ] Onboard 3–5 design-partner companies
- [ ] Add Stripe/subscription billing enforcement
- [ ] Usage-based cost tracking per organization
- [ ] SOC 2 readiness documentation

---

## Contact

For demo credentials, technical due diligence, or pilot terms, contact the EyeX team.
