---
name: Quantum OS
colors:
  surface: "#12131c"
  surface-dim: "#12131c"
  surface-bright: "#383843"
  surface-container-lowest: "#0d0d16"
  surface-container-low: "#1b1b24"
  surface-container: "#1f1f28"
  surface-container-high: "#292933"
  surface-container-highest: "#34343e"
  on-surface: "#e3e1ef"
  on-surface-variant: "#c6c5d9"
  inverse-surface: "#e3e1ef"
  inverse-on-surface: "#302f3a"
  outline: "#8f8fa2"
  outline-variant: "#454556"
  surface-tint: "#bec2ff"
  primary: "#bec2ff"
  on-primary: "#0003aa"
  primary-container: "#4b56fe"
  on-primary-container: "#f1efff"
  inverse-primary: "#3a44ef"
  secondary: "#bec2ff"
  on-secondary: "#212772"
  secondary-container: "#393f8a"
  on-secondary-container: "#a9afff"
  tertiary: "#ffb4a6"
  on-tertiary: "#660700"
  tertiary-container: "#c83923"
  on-tertiary-container: "#ffece9"
  error: "#ffb4ab"
  on-error: "#690005"
  error-container: "#93000a"
  on-error-container: "#ffdad6"
  primary-fixed: "#e0e0ff"
  primary-fixed-dim: "#bec2ff"
  on-primary-fixed: "#00016d"
  on-primary-fixed-variant: "#1820d9"
  secondary-fixed: "#e0e0ff"
  secondary-fixed-dim: "#bec2ff"
  on-secondary-fixed: "#080c5e"
  on-secondary-fixed-variant: "#393f8a"
  tertiary-fixed: "#ffdad4"
  tertiary-fixed-dim: "#ffb4a6"
  on-tertiary-fixed: "#3f0300"
  on-tertiary-fixed-variant: "#900e00"
  background: "#12131c"
  on-background: "#e3e1ef"
  surface-variant: "#34343e"
typography:
  display-lg:
    fontFamily: Geist
    fontSize: 64px
    fontWeight: "700"
    lineHeight: 72px
    letterSpacing: -0.04em
  headline-md:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: "600"
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md-mobile:
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
  data-mono:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: "500"
    lineHeight: 18px
    letterSpacing: 0.02em
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: "700"
    lineHeight: 16px
    letterSpacing: 0.1em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  grid-margin: 2rem
  grid-gutter: 1.5rem
  stack-xs: 0.25rem
  stack-sm: 0.5rem
  stack-md: 1rem
  stack-lg: 2rem
---

## Brand & Style

This design system establishes a premium, high-fidelity aesthetic for Enterprise AI Operating Systems. It is engineered to evoke a sense of absolute precision, computational power, and futuristic clarity. Moving away from light tones, the visual language now embraces a **High-Density Dark Mode** aesthetic that merges **Minimalism** with **Glassmorphism**, utilizing deep obsidian and cool gray surfaces punctuated by vibrant electric indigo and deep crimson accents.

The target audience consists of enterprise architects, data scientists, and technical leaders who require high-density information environments. The brand personality is authoritative yet visionary, characterized by sharp geometry, translucent layering, and micro-interactions that feel responsive and "intelligent." Every element is designed to feel like a high-performance instrument.

## Colors

The palette is optimized for dark-mode environments, providing a "command-center" technical feel that maintains clarity and focus in low-light professional settings.

- **Primary (Electric Indigo):** Used for critical CTAs, active states, and primary navigation. It represents stability, logic, and system-wide connectivity.
- **Surfaces (Deep Obsidian):** The foundation utilizes a range of dark, neutral surfaces to maintain a structured hierarchy without visual fatigue.
- **Overlays:** Semi-transparent grays and deep blues are used to create the glassmorphic depth required for complex enterprise hierarchies.
- **Functional Colors:** Success and Warning states are balanced against the Tertiary (Deep Crimson) for specific hardware alerts or low-level system notifications.

## Typography

The system utilizes **Geist** for its clean, technical sans-serif profile, ensuring legibility at any scale. For technical data, logs, and code-heavy interfaces, **JetBrains Mono** provides the necessary structural rhythm.

- **Display Hierarchy:** Use `display-lg` for impactful landing moments and dashboard summaries.
- **Technical Readouts:** All variable data, timestamps, and ID strings must use the Mono family to signal "system-generated" content.
- **Letter Spacing:** Headlines utilize tighter tracking for a compact, aggressive look, while small labels use expanded tracking for better readability against dark backgrounds.

## Layout & Spacing

This design system employs a strict **12-column fluid grid** for desktop, transitioning to a **6-column grid** for tablets and a **4-column grid** for mobile.

The layout philosophy is "High Density." Gutters are kept tight to maximize information real estate. Alignment is governed by a 4px base unit, ensuring every element—from the edge of a chart to the baseline of a label—feels mathematically locked. Margin safe-zones are used to separate global navigation from the core "operating area" of the interface.

## Elevation & Depth

Hierarchy is established through **Backdrop Blurs** and **Tonal Layering** to maintain a clean, technical feel without muddy shadows.

- **Level 0 (Base):** Deep, dark neutral background (#111318).
- **Level 1 (Panels):** Surface colors at high opacity with a subtle backdrop blur and a 1px `outline-variant` border.
- **Level 2 (Popovers/Modals):** Slight increase in elevation contrast and a very subtle glow or soft rim light to lift the element off the page.
- **Interactions:** Hovering over an interactive element triggers a sharpening of the border and a subtle shift in surface brightness, simulating a physical response.

## Shapes

The shape language is **Soft** but precise. We avoid the playfulness of fully rounded corners in favor of a "Machined" look.

- **Standard Elements:** Buttons, input fields, and small cards use a 0.25rem (4px) radius.
- **Container Elements:** Large dashboard tiles and panels use a 0.5rem (8px) radius.
- **Data Markers:** Points on a graph or status indicators may use 0px (Sharp) or 100% (Circle) geometry to contrast against the structured layout.

## Components

- **Buttons:** Primary buttons are solid Electric Indigo with white text. Ghost buttons use a 1px Electric Indigo border.
- **Inputs:** Dark backgrounds with a 1px bottom-only Primary highlight when focused. Labels always use the Mono font in `label-caps` style.
- **Cards:** Glassmorphic containers with 1px subtle borders. Content should be densely packed, using dividers sparingly.
- **Chips:** Small, rectangular indicators with Mono text. Used for status codes (e.g., `RUNNING`, `OFFLINE`).
- **Data Visualization:** Line charts must use clean, solid strokes. Heatmaps and grids should align perfectly with the 4px spacing unit.
- **Micro-interactions:** Transitions should be fast (150ms-200ms) with a linear-out "mechanical" easing function.
