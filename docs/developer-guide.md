# Developer Guide

## Getting Started

### Prerequisites

- Node.js 22+
- npm 10+
- Supabase account with a project

### Setup

```bash
# Clone the repository
git clone https://github.com/Cerefy/cerefy.git
cd cerefy

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Start development
npm run dev
```

## Project Structure

```
cerefy/
├── src/                    # Frontend application
│   ├── components/         # UI components
│   │   ├── layout/         # Shell, sidebar, header
│   │   └── ui/             # Primitives
│   ├── lib/                # Utilities
│   │   └── supabase/       # Client, types, helpers
│   ├── pages/              # Route pages
│   ├── routes/             # Route definitions
│   ├── services/           # Backend API service layer
│   └── main.tsx            # Entry point
├── eyex-backend/           # Python FastAPI backend
│   ├── app/
│   │   ├── agents/         # 17 AI agents + LangGraph orchestration
│   │   ├── api/            # API routes
│   │   ├── cognitive_data_layer/  # Data import/parsing
│   │   ├── memory/         # Vector memory service
│   │   └── services/       # Business logic
│   └── tests/              # 392+ tests
├── supabase/               # Database setup
├── docs/                   # Documentation
└── .github/workflows/      # CI/CD
```

## Key Scripts

| Command               | Description                        |
| --------------------- | ---------------------------------- |
| `npm run dev`         | Start frontend dev server          |
| `npm run build`       | Build frontend for production      |
| `npm run build:all`   | Build all workspace packages       |
| `npm test`            | Run all tests                      |
| `npm run typecheck`   | TypeScript type checking           |
| `npm run lint`        | Lint with oxlint                   |
| `npm run db:generate` | Regenerate Supabase types          |
| `npm run deploy`      | Build + deploy to Cloudflare Pages |

## Adding a Page

1. Create a component in `src/pages/`
2. Add route in `src/routeTree.tsx`
3. Add navigation item in `src/components/layout/Sidebar.tsx`

## Adding a Database Method

1. Add the method to `src/services/database.service.ts` using the `supabase` client
2. The method automatically uses the current organization context via `getCurrentOrgId()`

## Working with Agents

```typescript
// Create a new agent
import { BaseAgent } from "./base";

export class MyAgent extends BaseAgent {
  getName(): string {
    return "my-agent";
  }
  async run(context: AgentContext): Promise<AgentOutput> {
    // Implementation
    return { type: "my-type", data: {} };
  }
}
```

Register the agent in `AgentOrchestrator.registerAgents()` in `orchestrator.ts`.

## Testing

```bash
# Run all tests
npm test

# Run specific package tests
npm run test -w packages/agents
npm run test -w packages/services
```

## Docker

```bash
# Build and start all services
docker compose up --build

# Or run frontend only
docker build -t eyex-frontend -f Dockerfile .
docker run -p 80:80 eyex-frontend
```
