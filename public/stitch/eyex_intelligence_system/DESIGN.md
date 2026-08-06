---
name: EyeX Intelligence System
colors:
  surface: "#f9f9f9"
  surface-dim: "#dadada"
  surface-bright: "#f9f9f9"
  surface-container-lowest: "#ffffff"
  surface-container-low: "#f3f3f3"
  surface-container: "#eeeeee"
  surface-container-high: "#e8e8e8"
  surface-container-highest: "#e2e2e2"
  on-surface: "#1b1b1b"
  on-surface-variant: "#3b494c"
  inverse-surface: "#303030"
  inverse-on-surface: "#f1f1f1"
  outline: "#6b7a7d"
  outline-variant: "#bac9cc"
  surface-tint: "#006874"
  primary: "#006874"
  on-primary: "#ffffff"
  primary-container: "#84deec"
  on-primary-container: "#00636d"
  inverse-primary: "#79d4e2"
  secondary: "#5d5f5f"
  on-secondary: "#ffffff"
  secondary-container: "#dfe0e0"
  on-secondary-container: "#616363"
  tertiary: "#765a00"
  on-tertiary: "#ffffff"
  tertiary-container: "#fec931"
  on-tertiary-container: "#6f5500"
  error: "#ba1a1a"
  on-error: "#ffffff"
  error-container: "#ffdad6"
  on-error-container: "#93000a"
  primary-fixed: "#96f0ff"
  primary-fixed-dim: "#79d4e2"
  on-primary-fixed: "#001f24"
  on-primary-fixed-variant: "#004f57"
  secondary-fixed: "#e2e2e2"
  secondary-fixed-dim: "#c6c6c7"
  on-secondary-fixed: "#1a1c1c"
  on-secondary-fixed-variant: "#454747"
  tertiary-fixed: "#ffdf96"
  tertiary-fixed-dim: "#f3bf26"
  on-tertiary-fixed: "#251a00"
  on-tertiary-fixed-variant: "#594400"
  background: "#f9f9f9"
  on-background: "#1b1b1b"
  surface-variant: "#e2e2e2"
typography:
  display-lg:
    fontFamily: Geist
    fontSize: 48px
    fontWeight: "700"
    lineHeight: 56px
    letterSpacing: -0.02em
  display-sm:
    fontFamily: Geist
    fontSize: 36px
    fontWeight: "700"
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: "600"
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Geist
    fontSize: 20px
    fontWeight: "600"
    lineHeight: 28px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: "400"
    lineHeight: 24px
    letterSpacing: 0em
  body-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: "400"
    lineHeight: 20px
    letterSpacing: 0em
  label-md:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: "500"
    lineHeight: 16px
    letterSpacing: 0.02em
  mono-label:
    fontFamily: Geist Mono
    fontSize: 11px
    fontWeight: "500"
    lineHeight: 14px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
  3xl: 64px
---

## Brand & Style

The design system is engineered for the high-stakes environment of an AI Operating System. It balances extreme technical density with a **Light Mode Professional** aesthetic, evoking a sense of intelligence, transparency, and clinical precision.

The visual style is **Corporate Modern with a Minimalist/Technical edge**. It draws on the architectural clarity of high-end developer tools while maintaining the executive polish required for large organizations. The aesthetic is defined by crisp white surfaces, sharp typography, and "Deep Teal" accents that represent the active flow of intelligence through the system.

**Design Principles:**

- **Information Density:** Prioritize data clarity and screen real estate for complex workflows.
- **Structured Hierarchy:** Use clear borders and white space to organize intelligence.
- **Kinetic Precision:** Every transition and interactive state should feel snappy and mathematically precise.

## Colors

The palette is built on a foundation of "Light Mode" values to ensure maximum legibility and reduced fatigue during data-heavy technical sessions.

- **Primary (Deep Teal):** Reserved for high-priority actions, active states, and AI-driven insights. It is the "active" element of the design system.
- **Secondary (White):** Used for the primary canvas and container surfaces to create a clean, modern workspace.
- **Neutrals:** A custom scale of blacks and cool grays that maintain legibility against the light background without creating vibrating contrast.
- **Gradients:** Data visualizations utilize a linear gradient from Deep Teal to soft neutrals, symbolizing the processing of raw data into intelligence.

## Typography

This design system utilizes **Geist** for its exceptional legibility in technical contexts. The typeface bridges the gap between a grotesque sans-serif and a monospaced font, providing the geometric precision required for an AI OS.

- **Scale:** A tight scale is used to support data density.
- **Labels:** Small labels use higher font weights (500-600) and increased letter spacing to ensure readability at small sizes.
- **Numeric Data:** For tabular data and timestamps, use the monospaced variants of Geist to ensure column alignment and vertical rhythm.

## Layout & Spacing

The layout is governed by a **fixed 8px grid system**, ensuring all components align with mathematical consistency.

- **Density:** The system defaults to "Compact" density to accommodate complex AI workflows.
- **Grid:** A 12-column fluid grid is used for main content areas, while sidebar navigation and detail panels use fixed widths (64px collapsed / 240px expanded).
- **Safe Zones:** Consistent 24px margins are maintained on the edges of the primary viewport to provide visual breathing room.

## Elevation & Depth

In this design system, depth is communicated through **tonal layering and subtle borders** rather than heavy shadows, ensuring a flat and technical look.

- **Surface Levels:**
  - Level 0: `#f5fafa` (App background)
  - Level 1: `#ffffff` (Sidebars and structural containers)
  - Level 2: `#ffffff` (Cards and floating elements)
- **Borders:** Use 1px borders with low opacity (`rgba(0, 0, 0, 0.08)`) to define edges. On hover, primary interactive elements should transition to a Deep Teal border (`#057d8a`).
- **Glows:** High-elevation elements (modals) utilize a very subtle, technical drop shadow to simulate a layered workspace.

## Shapes

The shape language is sophisticated and modern, using a consistent **8px (0.5rem) radius** for main containers and cards to soften the technical edge of the UI while maintaining professionalism.

- **Small Components:** Buttons and inputs utilize a half-radius (4px) to maintain a crisp look.
- **Tags/Chips:** Fully rounded (pill) shapes are reserved for status indicators and category chips to differentiate them from interactive buttons.
- **Active Indicators:** Vertical 2px bars with Deep Teal color are used on the left edge of navigation items to indicate the current active state.

## Components

### Buttons

- **Primary:** Solid Deep Teal background with white text.
- **Secondary:** White background with a 1px black (10% opacity) border.
- **Ghost:** No border or background. Deep Teal text.

### Input Fields

- **Default:** White background with a subtle 1px border.
- **Focus State:** Border color changes to Deep Teal with a 1px solid inset.
- **Icons:** Use Lucide icons at 16px size, set to 60% opacity unless in an active state.

### Cards

- **Structure:** Level 1 surface (`#ffffff`) with a 1px border.
- **Interaction:** On hover, the border color should subtly darken, indicating the element is ready for interaction.

### Status Indicators

- **AI Processing:** A subtle pulse animation using the Deep Teal primary color.
- **Semantic States:** Success, Warning, and Danger use small 6px circular dots alongside their respective text labels for a clean, professional look.

### Data Visualization

- **Line Charts:** 2px stroke width using the Deep Teal primary color.
- **Area Charts:** Deep Teal to Transparent vertical gradient fill.
- **Grid Lines:** Minimal, using neutral grays with 0.5px thickness.
