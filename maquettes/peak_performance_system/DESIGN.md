---
name: Peak Performance System
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#404944'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#707974'
  outline-variant: '#bfc9c3'
  surface-tint: '#306855'
  primary: '#003426'
  on-primary: '#ffffff'
  primary-container: '#0f4c3a'
  on-primary-container: '#82bba4'
  inverse-primary: '#99d3ba'
  secondary: '#4e5e81'
  on-secondary: '#ffffff'
  secondary-container: '#c4d4fd'
  on-secondary-container: '#4b5b7e'
  tertiary: '#4d1f1b'
  on-tertiary: '#ffffff'
  tertiary-container: '#68342f'
  on-tertiary-container: '#e69e96'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#b4efd6'
  primary-fixed-dim: '#99d3ba'
  on-primary-fixed: '#002117'
  on-primary-fixed-variant: '#15503e'
  secondary-fixed: '#d8e2ff'
  secondary-fixed-dim: '#b6c6ef'
  on-secondary-fixed: '#081b3a'
  on-secondary-fixed-variant: '#364768'
  tertiary-fixed: '#ffdad6'
  tertiary-fixed-dim: '#ffb4ab'
  on-tertiary-fixed: '#370e0b'
  on-tertiary-fixed-variant: '#6c3832'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-metrics:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.5'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '700'
    lineHeight: '1'
    letterSpacing: 0.05em
  numeric-data:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1'
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  touch-target-min: 48px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 32px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 24px
---

## Brand & Style
The design system is engineered for the high-output athlete. It prioritizes **Performance & Readability**, focusing on rapid information retrieval during physical exertion, environmental glare, and mental fatigue. The brand personality is professional, reliable, and data-driven—acting as a high-precision tool rather than a lifestyle app.

The aesthetic leans into **Modern Corporate** with a **Tactile** edge. It utilizes high-contrast interfaces, large interactive surfaces, and a structured information hierarchy to ensure that critical metrics (pace, elevation, heart rate) are legible at a glance. Every visual element serves a functional purpose; decoration is stripped away in favor of utility and clarity.

## Colors
The palette is rooted in a deep "Forest Green" primary color, symbolizing the trail and endurance. It is supported by a "Midnight Blue" secondary for technical data and navigation. 

**Contrast is the priority.** The background is kept at maximum brightness (White/Light Gray) to combat outdoor visibility issues. Semantic colors are highly saturated to ensure that status indicators (ahead/behind pace) are immediately recognizable without requiring the user to read specific text.

## Typography
This design system employs **Inter** for its exceptional legibility and neutral, systematic tone. 

- **Tabular Figures:** For all numeric data (elevation, pace, time), the `tnum` (tabular numbers) OpenType feature must be enabled to prevent layout shifting as values change.
- **Scale:** Font sizes are oversized compared to standard SaaS applications to account for movement.
- **Hierarchy:** Data labels use uppercase with tracking to differentiate them clearly from the primary data values.

## Layout & Spacing
The layout follows a **Fixed Grid** model for desktop trail planning and a **Fluid, Single-Column** model for mobile use. 

- **Touch Targets:** A strict minimum of 48x48px is enforced for all interactive elements to accommodate sweaty or gloved hands.
- **Rhythm:** A 4px baseline grid ensures consistent vertical rhythm. 
- **Density:** On-trail views (Mobile) use high-density spacing for data lists but low-density spacing for interactive buttons to prevent accidental taps.

## Elevation & Depth
To maintain high contrast and clarity, the design system avoids heavy shadows. Instead, it uses **Tonal Layers** and **Low-Contrast Outlines**.

- **Level 0 (Base):** Clean White (`#FFFFFF`).
- **Level 1 (Cards/Containers):** Light Gray (`#F1F5F9`) with a 1px solid border (`#E2E8F0`).
- **Active State:** Elements use a 2px "Focus Ring" using the Primary color or Semantic Blue to indicate selection.
- **Depth:** Subtle 2px "Soft Shadows" are reserved only for floating action buttons (FABs) like "Start Activity" or "Recenter Map."

## Shapes
The design system utilizes **Soft (0.25rem)** roundedness. This provides a professional, geometric look that feels precise and technical. Large containers and cards use `rounded-lg` (0.5rem) to slightly soften the interface without losing its "engineered" feel.

## Components
- **Buttons:** Primary buttons use a solid Forest Green background with White text. Secondary buttons use a thick 2px border. Labels must be bold and at least 16px.
- **Data Rows:** Used for split times and elevation data. Each row must have a minimum height of 56px, separated by a high-contrast divider (`#E2E8F0`). Alternate row striping is recommended for long tables.
- **Status Chips:** Small, high-contrast badges for "Ahead" (Green) or "Behind" (Red). They use `label-caps` typography for immediate recognition.
- **Input Fields:** Large text inputs with persistent labels (no floating labels that disappear). Borders thicken to 2px on focus.
- **Progress Bars:** Use thick 8px strokes for visibility. The "current progress" should use the Primary Green, while "estimated completion" uses the Semantic Blue.
- **Metric Cards:** Large-scale components displaying a single stat. They feature a `label-caps` title at the top and `display-metrics` numeric value in the center.