---
name: EyeX Neural OS
colors:
  surface: "#f9f9fc"
  surface-dim: "#dadadc"
  surface-bright: "#f9f9fc"
  surface-container-lowest: "#ffffff"
  surface-container-low: "#f3f3f6"
  surface-container: "#eeeef0"
  surface-container-high: "#e8e8ea"
  surface-container-highest: "#e2e2e5"
  on-surface: "#1a1c1e"
  on-surface-variant: "#424753"
  inverse-surface: "#2f3133"
  inverse-on-surface: "#f0f0f3"
  outline: "#727785"
  outline-variant: "#c2c6d5"
  surface-tint: "#005ac1"
  primary: "#0058bd"
  on-primary: "#ffffff"
  primary-container: "#2771df"
  on-primary-container: "#fefcff"
  inverse-primary: "#adc6ff"
  secondary: "#006e2c"
  on-secondary: "#ffffff"
  secondary-container: "#86f898"
  on-secondary-container: "#00722f"
  tertiary: "#b51b15"
  on-tertiary: "#ffffff"
  tertiary-container: "#d9372b"
  on-tertiary-container: "#fffbff"
  error: "#ba1a1a"
  on-error: "#ffffff"
  error-container: "#ffdad6"
  on-error-container: "#93000a"
  primary-fixed: "#d8e2ff"
  primary-fixed-dim: "#adc6ff"
  on-primary-fixed: "#001a41"
  on-primary-fixed-variant: "#004494"
  secondary-fixed: "#89fa9b"
  secondary-fixed-dim: "#6ddd81"
  on-secondary-fixed: "#002108"
  on-secondary-fixed-variant: "#005320"
  tertiary-fixed: "#ffdad5"
  tertiary-fixed-dim: "#ffb4a9"
  on-tertiary-fixed: "#410001"
  on-tertiary-fixed-variant: "#930004"
  background: "#f9f9fc"
  on-background: "#1a1c1e"
  surface-variant: "#e2e2e5"
typography:
  display-lg:
    fontFamily: Geist
    fontSize: 48px
    fontWeight: "700"
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: "600"
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: "600"
    lineHeight: 32px
  title-md:
    fontFamily: Geist
    fontSize: 18px
    fontWeight: "500"
    lineHeight: 24px
  body-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: "400"
    lineHeight: 20px
  body-sm:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: "400"
    lineHeight: 16px
  code-label:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: "500"
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 32px
  max-width: 1440px
---

## Brand & Style

The design system for EyeX Technologies is built on a foundation of **Intelligent Precision** and **Dynamic Utility**. It bridges the gap between Google’s approachable, iconic color language and the high-density requirements of an AI Operating System. The brand personality is authoritative yet optimistic—designed to feel like a high-performance engine encased in a friendly, accessible shell.

The aesthetic follows a **Modern Enterprise** approach, blending the logic of Material Design with the sleekness of high-end developer tools. It prioritizes clarity and speed, utilizing ample white space in light mode and deep, atmospheric layering in dark mode to reduce cognitive load during complex AI workflows. The "Neural Motion" DNA is expressed through fluid transitions and microscopic feedback loops that make the interface feel alive and responsive to intent.

## Colors

The palette leverages the four iconic Google primaries to denote specific system states and functional domains within the AI OS:

- **Action Blue (#4285F4):** Primary interactions, focus states, and neutral AI suggestions.
- **Success Green (#34A853):** Completed computations, active neural nodes, and system health.
- **Warning Yellow (#FBBC05):** Attention-required states and data anomalies.
- **Critical Red (#EA4335):** Error states, stop commands, and destructive actions.

The **Light Mode** utilizes a "Google Gray 50" (#F8F9FA) for the base surface to minimize glare, while **Dark Mode** transitions to a Deep Navy (#0B1120) to maintain professional contrast without the harshness of pure black. High-density data tables should use subtle tonal shifts in background color rather than heavy borders to separate content.

## Typography

This design system utilizes **Geist** for its exceptional legibility in high-density environments and its "technical-yet-human" geometric structure.

- **Hierarchy:** Use bold weights sparingly for headlines to maintain an "Enterprise AI" look.
- **Readability:** Body text is set at 14px (md) for standard OS density, allowing for significant data visibility without sacrificing eye comfort.
- **Technical Accents:** **JetBrains Mono** is introduced for labels, metadata, and AI-generated code snippets to emphasize the "Neural" and "Tech" DNA of the product.
- **Scaling:** On mobile devices, headlines scale down significantly to ensure long AI-generated titles do not break the layout.

## Layout & Spacing

The layout philosophy is built on a **4px baseline grid** to ensure pixel-perfect alignment of complex data visualization components.

- **Grid Model:** A 12-column fluid grid is used for dashboard layouts, transitioning to a 4-column grid for mobile.
- **Density:** To achieve the "High-Density AI OS" feel, internal component padding (sm/md) is kept tight, while external section margins (lg/xl) are generous to provide visual breathing room.
- **Sidebar:** A fixed-width left navigation (256px) is standard for desktop, collapsing to an icon-only rail (64px) to maximize the workspace for AI canvas elements.

## Elevation & Depth

Hierarchy is established through **Tonal Layering** and **Soft Ambient Shadows**.

- **Surface Levels:** The background is the lowest level. Content cards sit at Level 1, while active modals or dropdowns sit at Level 2.
- **Shadows:** Shadows are highly diffused and use a slight blue tint (`rgba(66, 133, 244, 0.08)`) in light mode to reinforce the brand color. In dark mode, elevation is conveyed through lighter surface fills (tonal lifting) rather than shadows.
- **Interactions:** Upon hover, interactive elements should "lift" slightly (2px Y-offset increase) to provide tactile confirmation of the Neural Motion DNA.

## Shapes

The design system employs a **Rounded** (0.5rem) language to balance the technical nature of the OS with Google-inspired friendliness.

- **Core Elements:** Buttons, input fields, and standard cards use the base 8px (0.5rem) radius.
- **Large Containers:** Dashboard panels and main canvas areas use `rounded-xl` (1.5rem) to create a "containerized" look that feels modern and modular.
- **Selection States:** Use a fully pill-shaped (rounded-full) radius for chips and toggle switches to differentiate them from actionable buttons.

## Components

- **Buttons:** Primary buttons use a solid Google Blue fill with white text. Secondary buttons use a subtle gray stroke with an icon-prefix for quick recognition. All buttons feature a 200ms easing transition on hover.
- **AI Input Fields:** The central OS input is a large, `rounded-xl` field with a subtle gradient border using the primary brand colors to signify the "Neural" engine is active.
- **Cards:** Cards should be "Flat" with a 1px border (#E0E0E0) in light mode, switching to a subtle shadow on hover.
- **Chips:** Used for AI tags or status filters. They should follow the color logic (e.g., a "Processing" chip uses a light green background with dark green text).
- **Data Tables:** Highly condensed. Row height is set to 40px with `body-sm` typography to maximize information density.
- **Neural Nodes:** Custom components representing AI logic steps. These use circular shapes with glowing center points in the four brand colors to visualize active data flow.
