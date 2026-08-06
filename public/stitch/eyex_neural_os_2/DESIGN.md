---
name: EyeX Neural OS
colors:
  surface: "#0d1516"
  surface-dim: "#0d1516"
  surface-bright: "#333a3c"
  surface-container-lowest: "#080f11"
  surface-container-low: "#151d1e"
  surface-container: "#192122"
  surface-container-high: "#242b2d"
  surface-container-highest: "#2e3638"
  on-surface: "#dce4e5"
  on-surface-variant: "#bac9cc"
  inverse-surface: "#dce4e5"
  inverse-on-surface: "#2a3233"
  outline: "#849396"
  outline-variant: "#3b494c"
  surface-tint: "#00daf3"
  primary: "#c3f5ff"
  on-primary: "#00363d"
  primary-container: "#00e5ff"
  on-primary-container: "#00626e"
  inverse-primary: "#006875"
  secondary: "#bec2ff"
  on-secondary: "#0003aa"
  secondary-container: "#1820d9"
  on-secondary-container: "#a9afff"
  tertiary: "#ffeac0"
  on-tertiary: "#3e2e00"
  tertiary-container: "#fec931"
  on-tertiary-container: "#6f5500"
  error: "#ffb4ab"
  on-error: "#690005"
  error-container: "#93000a"
  on-error-container: "#ffdad6"
  primary-fixed: "#9cf0ff"
  primary-fixed-dim: "#00daf3"
  on-primary-fixed: "#001f24"
  on-primary-fixed-variant: "#004f58"
  secondary-fixed: "#e0e0ff"
  secondary-fixed-dim: "#bec2ff"
  on-secondary-fixed: "#00016d"
  on-secondary-fixed-variant: "#1820d9"
  tertiary-fixed: "#ffdf96"
  tertiary-fixed-dim: "#f3bf26"
  on-tertiary-fixed: "#251a00"
  on-tertiary-fixed-variant: "#594400"
  background: "#0d1516"
  on-background: "#dce4e5"
  surface-variant: "#2e3638"
typography:
  display-lg:
    fontFamily: Geist
    fontSize: 48px
    fontWeight: "700"
    lineHeight: 56px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: "700"
    lineHeight: 40px
  headline-md:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: "600"
    lineHeight: 32px
  body-lg:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: "400"
    lineHeight: 24px
  body-sm:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: "400"
    lineHeight: 20px
  mono-label:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: "500"
    lineHeight: 16px
    letterSpacing: 0.05em
  mono-data:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: "400"
    lineHeight: 18px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 16px
  margin: 24px
  container-max: 1440px
---

## Brand & Style

This design system embodies the "EyeX Neural OS"—a high-performance internal AI operating system designed for cognitive speed and data density. The brand personality is clinical, ultra-precise, and forward-looking, bridging the gap between raw machine intelligence and human intuition.

The aesthetic follows a **Modern / Technical Minimalist** style. It prioritizes clarity through high-contrast typography, subtle "flowing" transitions, and a rigorous adherence to a carbon-dark palette. The UI should evoke a sense of deep focus, functioning as an invisible but powerful substrate for complex AI operations and agentic workflows.

## Colors

The palette is engineered for prolonged usage in low-light environments, emphasizing "Neural Carbon" as the fundamental base.

- **Primary (Tech Cyan):** Reserved for active neural states, primary actions, and critical data highlights.
- **Secondary (Agent Blue):** Specifically utilized for multi-agent identification and distinct AI-generated suggestions.
- **Surface & Surface-Bright:** Used to create hierarchical depth without relying on heavy borders.
- **On-Surface-Variant:** A muted slate blue used for secondary metadata and inactive UI states to reduce visual noise.

## Typography

This design system utilizes **Geist** for its structural and interface elements, leveraging its tight apertures and technical precision. For all data-heavy readouts, code snippets, and system logs, **JetBrains Mono** provides the necessary tabular clarity.

- **Headlines:** Should be set with tight letter-spacing to emphasize the "engineered" feel.
- **Labels:** Use uppercase JetBrains Mono for system-level headers (e.g., "CPU LOAD," "AGENT STATUS") to differentiate from user-facing content.
- **Body:** Prioritize legibility with generous line-heights to ensure high-density information remains scannable.

## Layout & Spacing

The layout is a **High-Density Enterprise Grid** based on a 4px baseline.

- **Grid:** A 12-column fluid grid for desktop, transitioning to an 8-column grid for tablets and a 4-column grid for mobile.
- **Density:** Elements are tightly packed with minimal padding to maximize information throughput. Use `12px` (3 units) for internal component padding and `16px` (4 units) for container gutters.
- **Structure:** Content is organized into modular "blades" or panes that can be resized and collapsed, reflecting the modular nature of neural processing.

## Elevation & Depth

Hierarchy is established through **Tonal Layering** and **Subtle Outlines** rather than traditional shadows.

- **Level 0 (Base):** #0d0d16 (The deep background).
- **Level 1 (Panels):** #1b1b24 with a 1px border of #ffffff (10% opacity).
- **Level 2 (Popovers/Modals):** #1b1b24 with a subtle Tech Cyan (#00e5ff) outer glow (5px blur, 15% opacity).
- **Depth Metaphor:** Surfaces closer to the user appear slightly lighter and may feature a faint backdrop blur to suggest focus over the underlying data stream.

## Shapes

The design system employs a **Soft (rounded-md)** shape language. A standard radius of `8px` is used for primary containers and buttons. This provides a balance between the clinical sharpness of an OS and the approachability required for an internal tool.

- **Small elements (Checkboxes, Tooltips):** 4px radius.
- **Standard elements (Buttons, Cards, Inputs):** 8px radius.
- **Large elements (Modals, Sidebars):** 12px radius.

## Components

### Buttons

- **Primary:** Background #00e5ff, Text #0d0d16, 8px radius. Bold Geist font.
- **Secondary:** Border 1px #00e5ff (30% opacity), Text #00e5ff.
- **Ghost:** No background, Text #94a3b8, hover state shifts text to #ffffff.

### Inputs

- **Field:** Background #1b1b24, 1px border #ffffff (10% opacity), 8px radius. Focus state utilizes a #00e5ff 1px border.
- **Mono-Inputs:** Use JetBrains Mono for technical entry fields.

### Chips & Tags

- **Status Chips:** Small, 4px radius. Use #00e5ff for "Active," #4b56fe for "Agent-Processing," and #94a3b8 for "Idle."

### Cards

- **Neural Card:** Background #1b1b24. Use a subtle gradient header (Primary to Secondary at 5% opacity) to denote active AI involvement.

### Motion System

- **Flowing Intelligence:** Use `cubic-bezier(0.4, 0, 0.2, 1)` for all transitions. Transitions should feel instantaneous but smooth, like data pulses. Avoid heavy bounces; prioritize linear-out-slow-in movements.
