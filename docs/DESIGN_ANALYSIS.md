# Cerefy Design System Analysis

**Source:** Stitch Reference ZIP
**Date:** 2026-08-06

---

## Design Language

### Typography
| Role | Family | Weight | Usage |
|------|--------|--------|-------|
| Display | Inter | 700-800 | Hero headings, large numbers |
| Headline | Inter | 600-700 | Section titles, card titles |
| Body | Inter | 400-500 | Paragraphs, descriptions |
| Label | Geist | 400-600 | Badges, tags, metadata |

### Color System (Material Design 3)
| Token | Hex | Usage |
|-------|-----|-------|
| `--background` | #f9f9f9 | Page background |
| `--surface` | #f9f9f9 | Card backgrounds |
| `--surface-container-lowest` | #ffffff | Elevated surfaces |
| `--surface-container-low` | #f3f3f3 | Subtle containers |
| `--surface-container` | #eeeeee | Default containers |
| `--surface-container-high` | #e8e8e8 | Hover states |
| `--surface-container-highest` | #e2e2e2 | Active states |
| `--on-surface` | #1b1b1b | Primary text |
| `--on-surface-variant` | #444748 | Secondary text |
| `--primary` | #5e5e5f | Brand/accent color |
| `--on-primary` | #ffffff | Text on primary |
| `--outline` | #747879 | Borders |
| `--outline-variant` | #c4c7c8 | Subtle borders |
| `--error` | #ba1a1a | Error states

### Spacing & Layout
- Max width: 7xl (1280px)
- Grid: 12-column bento grid
- Gaps: 6 (24px) standard
- Padding: 8 (32px) sections, 6 (24px) cards

### Border Radius
- sm: 0.25rem (4px)
- DEFAULT: 0.5rem (8px)
- md: 0.75rem (12px)
- lg: 1rem (16px)
- xl: 1.5rem (24px)
- full: 9999px (pill)

### Effects
- Glass panel: `rgba(255, 255, 255, 0.7)` + `backdrop-filter: blur(12px)`
- Shadows: sm, md, lg for elevation
- Animations: pulse-slow (8s), liquid-reveal (1s)

### Components
1. **Glass Panel** - Frosted glass card effect
2. **Top Nav** - Fixed, blur backdrop, logo + links + CTA
3. **Hero Section** - Large headline + subtext + CTA buttons + visual
4. **Bento Grid** - Asymmetric card layout (8/4 spans)
5. **Metric Cards** - Large number + label + description
6. **Agent Cards** - Status indicator + name + description + actions
7. **Sidebar** - Fixed navigation with icons

### Page Types Analyzed
1. Landing Page - Hero + metrics + features + pricing
2. Dashboard - Sidebar + top bar + bento grid metrics
3. Agent Studio - Agent list + configuration + monitoring
4. Analytics - Charts + KPIs + data tables
5. Compliance - Security status + audit logs
6. Connectors - Integration marketplace
7. 404 Page - Error state with navigation

### Key Patterns
- Fixed sidebar navigation (left 64px)
- Top app bar with search and user menu
- Main content area with padding
- Bento grid for dashboard metrics
- Glass panels for cards
- Consistent spacing and typography
