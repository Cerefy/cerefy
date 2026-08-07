---
name: Kinetic Precision
colors:
  surface: '#f9f9f9'
  surface-dim: '#dadada'
  surface-bright: '#f9f9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f3'
  surface-container: '#eeeeee'
  surface-container-high: '#e8e8e8'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1b1b1b'
  on-surface-variant: '#444748'
  inverse-surface: '#303030'
  inverse-on-surface: '#f1f1f1'
  outline: '#747879'
  outline-variant: '#c4c7c8'
  surface-tint: '#5e5e5f'
  primary: '#5e5e5f'
  on-primary: '#ffffff'
  primary-container: '#fdfcfc'
  on-primary-container: '#737474'
  inverse-primary: '#c7c6c6'
  secondary: '#5e5e5d'
  on-secondary: '#ffffff'
  secondary-container: '#e1dfdd'
  on-secondary-container: '#636361'
  tertiary: '#5e6141'
  on-tertiary: '#ffffff'
  tertiary-container: '#feffd7'
  on-tertiary-container: '#747655'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e3e2e2'
  primary-fixed-dim: '#c7c6c6'
  on-primary-fixed: '#1a1c1c'
  on-primary-fixed-variant: '#464747'
  secondary-fixed: '#e4e2e0'
  secondary-fixed-dim: '#c8c6c4'
  on-secondary-fixed: '#1b1c1b'
  on-secondary-fixed-variant: '#474746'
  tertiary-fixed: '#e4e5bd'
  tertiary-fixed-dim: '#c8c9a3'
  on-tertiary-fixed: '#1b1d05'
  on-tertiary-fixed-variant: '#47492c'
  background: '#f9f9f9'
  on-background: '#1b1b1b'
  surface-variant: '#e2e2e2'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 72px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.04em
  display-lg-mobile:
    fontFamily: Inter
    fontSize: 40px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.3'
    letterSpacing: -0.02em
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: 0em
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
    letterSpacing: 0em
  label-mono:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.2'
    letterSpacing: 0.05em
  caption:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: 0.01em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 24px
  margin-site: 64px
  margin-mobile: 20px
  container-max: 1280px
---

## Brand & Style

The design system is engineered for a sophisticated, high-performance AI technology environment. It targets a professional audience of creators, developers, and enterprise leaders who require tools that feel both powerful and invisible. 

The aesthetic is **Modern Corporate with Glassmorphic accents**, now optimized for a **Light Mode** environment. It balances the raw, technical efficiency of a developer tool with the refined elegance of a luxury hardware brand. Visual interest is generated not through heavy decoration, but through the precise orchestration of subtle depth, soft atmospheric glows, and razor-sharp typography. The emotional response is one of absolute reliability, futuristic innovation, and quiet authority.

## Colors

The palette is anchored in a pure neutral foundation to provide maximum clarity for high-fidelity text and media. 

- **Primary & Secondary:** These are reserved for typography and structural UI elements. We utilize refined off-whites (`#FDFCFC` and `#F5F3F1`) to create a layered, premium feel while maintaining a crisp, professional aesthetic.
- **Surface Strategy:** Backgrounds use a tiered approach: The clean primary surface of `#FDFCFC`, with elevated cards using white or very subtle greys to define hierarchy.
- **Accent Philosophy:** Chromatic color is used sparingly as a "kinetic" highlight. Subtle indigo and violet gradients appear in hover states or as soft background blurs behind bento-style cards to signify active AI processing, appearing as gentle "auroras" against the light theme.

## Typography

Typography is the primary vehicle for the brand’s "Precision" narrative. 

- **Headlines:** We use **Inter** with heavy weights and tight tracking for a locked-in, architectural feel. High-scale displays (Display LG) utilize optical kerning to ensure characters feel intentionally packed.
- **Body:** **Inter** provides high legibility at standard sizes. Line heights are kept generous (1.5–1.6) to ensure the content remains readable and airy in the light UI.
- **Technical Accents:** **Geist** is employed for small labels, metadata, and code snippets. This introduces a "pro-tool" aesthetic, signaling technical accuracy and data-driven features with a cleaner, modern sans-serif execution.

## Layout & Spacing

This design system utilizes a **12-column Fluid Grid** that transitions into a **Bento-style layout** for feature showcases. 

- **Bento Philosophy:** Content is grouped into modular containers of varying sizes (spans of 4, 6, or 8 columns). Each container has a consistent inner padding of 32px to ensure a sense of "breathable density."
- **Rhythm:** All spacing (margins, padding, gaps) follows a 4px baseline grid. 
- **Breakpoints:**
  - **Desktop:** 1200px+ (12 columns, 24px gutter, 64px site margins).
  - **Tablet:** 768px - 1199px (8 columns, 20px gutter, 32px site margins).
  - **Mobile:** <767px (4 columns, 16px gutter, 20px site margins). Headlines scale down to mobile variants defined in Typography.

## Elevation & Depth

Depth is achieved through **Tonal Layering** and **Glassmorphism**, emphasizing clarity and soft shadows over heavy dark gradients.

- **The Base:** Background is `#FDFCFC`.
- **Level 1 (Cards):** Surfaces use a combination of white and `#F5F3F1` with a very subtle 1px border of `#E5E5E5`.
- **Level 2 (Overlays):** Modals and dropdowns use a semi-transparent blur (`backdrop-filter: blur(12px)`) with a high-transparency dark border (5-10% opacity) to define edges against the light background.
- **Atmospheric Glows:** For "Hero" or "Premium" bento cards, a soft radial gradient (Indigo/Violet) is placed *behind* the card at 10% opacity to create a subtle halo effect, suggesting the "energy" of the AI.

## Shapes

The shape language is **Rounded**, favoring a modern, approachable geometry that contrasts with the technical precision of the layouts.

- **Standard Elements:** Buttons and input fields use a `0.5rem` (8px) radius.
- **Bento Cards:** Larger containers use `rounded-lg` (16px) or `rounded-xl` (24px) to create a soft, "encapsulated" feel for information clusters.
- **Interactive States:** High-action items like "Play" buttons or "Tags" may utilize a fully rounded (pill-shaped) radius to distinguish them from structural layout elements.

## Components

- **Buttons:** 
  - **Primary:** Background `#000000`, text `#FDFCFC`. High contrast, 8px radius.
  - **Secondary:** Transparent background, 1px border `#000000` (15% opacity), text `#000000`.
- **Bento Cards:** High-density containers with light fill. Content inside should be strictly aligned to a sub-grid.
- **Inputs:** Clean white fields (`#FFFFFF`) with subtle `#E5E5E5` borders. On focus, the border darkens to `#000000` and adds a subtle soft-focus glow.
- **Glass Chips:** Small labels used for categorization. 40% white background blur, 1px dark border at 5% opacity, text in `label-mono`.
- **Navigation:** A high-density minimalist bar. Links are `caption` or `body-md` in `text-muted`, shifting to absolute black on hover.
- **Progress Indicators:** Linear gradients (Indigo to Violet) used for active AI generation states, adjusted for visibility against light surfaces.