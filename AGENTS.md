# Cerefy — Development Guidelines

## Project Overview

Cerefy is an enterprise-grade AI Startup Builder Platform platform with AI-powered agents, business intelligence, and comprehensive business management tools.

## Current UI/UX State (Commit 0b24e6f)

### Design System & Branding

- **Brand Name**: Cerefy
- **Tagline**: "AI Startup Builder Platform"
- **Color Scheme**: Dark theme with Cerefy-specific color tokens
  - Background: `bg-eye-bg` (dark #050505)
  - Text: `text-eye-text` (light gray)
  - White: `text-eye-white` (primary white)
  - Surface: `bg-eye-surface` (elevated surfaces)
  - Border: `border-eye-border` (subtle borders)
  - Primary: `text-primary` (accent color)
- **Typography**:
  - Font: Geist (display) and Geist Mono (code/technical)
  - Tracking: Tight for headings, wide for labels
  - Sizes: 10px-13px for UI elements, larger for headings
- **Visual Style**: Glass-panel effects, luminous buttons, minimal borders

### Layout Architecture

- **App Shell**: Fixed sidebar navigation with main content area
- **Sidebar Width**: 240px (desktop), hidden on mobile with toggle
- **Header**: Page title with optional subtitle and action buttons
- **Content Area**: Max-width 1400px, centered with padding
- **Mobile**: Responsive sidebar with hamburger menu

### Navigation Structure

The application uses a grouped navigation system with four main categories:

#### Overview

- Dashboard
- Analytics
- Data Sources
- AI Copilot
- Reports

#### Business

- CRM
- Sales
- Marketing
- Finance
- Inventory
- HR
- Projects
- Documents

#### Agents

- Agents
- Task History

#### Platform

- Integrations
- Notifications
- Billing
- Settings

### Component Patterns

#### BrandMark Component

- Eye icon in rounded container with border
- "Cerefy" text with styling
- Used in headers and branding elements

#### AppShell Component

- Fixed sidebar with navigation groups
- User profile section at bottom of sidebar
- Mobile-responsive with toggle
- Header with title, subtitle, and action buttons
- Default actions: Refresh and "New" button

#### Authentication

- Supabase-based authentication
- Session management with loading states
- Sign in, sign up, password reset functionality
- User context available throughout app

#### API Integration

- Backend API service with typed interfaces
- Token-based authentication via Supabase
- Comprehensive API coverage for:
  - Chat and AI operations
  - Workspaces and members
  - Agents and tasks
  - Billing and subscriptions
  - Memory and analytics

### Technical Stack

- **Frontend**: React 19, TanStack Router, TanStack Query
- **Styling**: Tailwind CSS 4.x with custom EyeX tokens
- **UI Components**: Radix UI primitives
- **Backend Integration**: Supabase (auth/data) + Python FastAPI
- **Build**: Vite with Nitro for SSR
- **Deployment**: Cloudflare Workers

### Key Files (Source of Truth)

- `src/components/layout/AppShell.tsx` - Main layout shell
- `src/components/layout/BrandMark.tsx` - Brand component
- `src/components/providers/auth-provider.tsx` - Authentication context
- `src/routes/__root.tsx` - Root route with app detection
- `src/services/backend-api.service.ts` - API integration layer
- `public/logo.svg` - Official EyeX logo

### Development Guidelines

#### UI/UX Preservation

- **DO NOT** redesign the layout, navigation, or component structure
- **DO NOT** change the branding, colors, or typography
- **DO NOT** modify the user flows or interaction patterns
- **DO** preserve the glass-panel effects and visual style
- **DO** maintain the responsive design patterns

#### Allowed Changes

- **DO** add new pages following existing patterns
- **DO** extend API services with new endpoints
- **DO** add new components using existing design system
- **DO** improve functionality while preserving UI
- **DO** fix bugs without changing visual design

#### Implementation Approach

1. Use existing AppShell for all app pages
2. Follow navigation group structure for new sections
3. Use Cerefy color tokens (eye-bg, eye-text, etc.)
4. Maintain typography scale and spacing
5. Preserve responsive behavior
6. Use Radix UI components for interactive elements

### Build & Verification

- **Build Command**: `npm run build`
- **Test Command**: `npm run test` (backend: `pytest tests/`)
- **Current Status**:
  - Frontend builds successfully (commit 0b24e6f)
  - Backend tests: 392 passing
  - All core functionality verified

### Git Guidelines

- **IMPORTANT**: This project is connected to Lovable
- **DO NOT** rewrite published git history
- **DO NOT** force push, rebase, amend, or squash pushed commits
- **DO** keep the connected branch in working state
- Commits sync back to Lovable and appear in the editor

## Backend Architecture

- **Framework**: FastAPI with Python 3.12
- **AI Framework**: LangGraph for agent orchestration
- **Database**: PostgreSQL with Alembic migrations
- **Testing**: 392 tests covering all major functionality
- **Agents**: 17 total agents (13 original + 4 executive)

## Enterprise Features

- Multi-tenant architecture with organization scoping
- AI Executive Team (CEO, CFO, COO, Risk agents)
- Vector memory with semantic search
- Knowledge graph with typed relationships
- Proactive intelligence and alerts
- Data connectors (CSV, JSON, API, Database)
- Enterprise API with comprehensive endpoints

## Next Development Steps

When continuing development:

1. Use restored frontend as foundation
2. Preserve all UI/UX elements exactly as-is
3. Extend functionality using existing patterns
4. Test thoroughly before committing
5. Maintain backward compatibility
