---
name: Regulatory Integrity System
colors:
  surface: '#f8f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f8f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#434750'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#737782'
  outline-variant: '#c3c6d2'
  surface-tint: '#305ea1'
  primary: '#00366f'
  on-primary: '#ffffff'
  primary-container: '#1a4d8f'
  on-primary-container: '#9dc0ff'
  inverse-primary: '#a9c7ff'
  secondary: '#1b6d24'
  on-secondary: '#ffffff'
  secondary-container: '#a0f399'
  on-secondary-container: '#217128'
  tertiary: '#4e3000'
  on-tertiary: '#ffffff'
  tertiary-container: '#6d4500'
  on-tertiary-container: '#ffae31'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d6e3ff'
  primary-fixed-dim: '#a9c7ff'
  on-primary-fixed: '#001b3e'
  on-primary-fixed-variant: '#0e4688'
  secondary-fixed: '#a3f69c'
  secondary-fixed-dim: '#88d982'
  on-secondary-fixed: '#002204'
  on-secondary-fixed-variant: '#005312'
  tertiary-fixed: '#ffddb5'
  tertiary-fixed-dim: '#ffb957'
  on-tertiary-fixed: '#2a1800'
  on-tertiary-fixed-variant: '#643f00'
  background: '#f8f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  display:
    fontFamily: IBM Plex Sans
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: IBM Plex Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: IBM Plex Sans
    fontSize: 20px
    fontWeight: '500'
    lineHeight: 28px
  body-lg:
    fontFamily: IBM Plex Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: IBM Plex Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-lg:
    fontFamily: IBM Plex Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: IBM Plex Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  headline-lg-mobile:
    fontFamily: IBM Plex Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
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
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
  sidebar-width: 260px
---

## Brand & Style

The design system is engineered for legal metrology and high-stakes regulatory oversight. The brand personality is **Institutional, Credible, and Calm**, designed to foster trust between government agencies and commercial entities.

The visual style is **Corporate Modern**, prioritizing clarity, precision, and efficiency. It avoids decorative flourishes in favor of a systematic approach that reduces cognitive load for auditors and officials. The interface uses a clean, structured layout that feels authoritative yet accessible, ensuring that complex data regarding instrument calibration and compliance remains the primary focus. High whitespace ratios and a restrained color palette communicate transparency and professional rigor.

## Colors

The palette is anchored by **Deep Institutional Blue**, used for primary actions and navigational branding to convey stability. The background uses a soft **Neutral Grey** to reduce eye strain during long-form data review, while **White Surfaces** are used for data containers to provide maximum contrast.

The status system is strictly functional, utilizing a "Traffic Light" logic paired with explicit text labels to ensure accessibility and immediate risk recognition:
- **Success/Low Risk (#2E7D32):** Used for valid certifications and compliant instruments.
- **Warning/Medium Risk (#F9A825):** Used for expiring registrations or pending inspections.
- **Danger/High Risk (#D32F2F):** Reserved for expired hardware, failed audits, or critical non-compliance.

## Typography

This design system utilizes **IBM Plex Sans** for its corporate and systematic character. The typeface choice emphasizes the "man-made" and technical nature of legal metrology. 

Hierarchy is established through weight and scale. Headlines are set with slightly tighter letter-spacing for a modern feel, while body copy maintains standard spacing for maximum legibility in data-heavy tables. Labels and small text use medium and semi-bold weights to remain distinct even at smaller sizes. All numerical data should utilize the tabular lining figures inherent in the font to ensure columns of numbers align perfectly in audit logs.

## Layout & Spacing

The layout is built on a **12-column fixed grid** for desktop, ensuring consistent content width and predictable scanning patterns for professional users. A strict **8px spacing grid** governs all padding and margins.

- **Sidebar:** A persistent left-hand navigation occupies a fixed 260px width, utilizing a darker shade of the neutral palette or the primary blue to separate navigation from the work area.
- **Content Area:** Central content is housed within a "max-width" container on desktop to prevent line lengths from becoming unreadable.
- **Breakpoints:** Transitions occur at 768px (Tablet) and 1280px (Desktop). On mobile, margins reduce to 16px and the sidebar collapses into a hamburger menu or bottom navigation bar.
- **Padding:** Generous internal padding (24px) within cards is required to maintain the "Institutional" sense of calm and prevent the UI from feeling cluttered.

## Elevation & Depth

This design system employs **Low-contrast outlines** combined with **Tonal Layers**. Depth is primarily communicated through structural separation rather than dramatic shadows.

- **Level 0 (Background):** The Neutral Background (#F4F6F8) serves as the canvas.
- **Level 1 (Cards/Surfaces):** White cards (#FFFFFF) use a crisp 1px border (#E0E4E8). Shadows are avoided unless a temporary overlay (like a dropdown or modal) is active.
- **Level 2 (Interaction):** Hover states on list items or buttons use a subtle shift in background color (e.g., a very light blue or grey tint) to indicate interactivity.
- **Modals:** Use a soft, diffused 16px blur shadow with 10% opacity black to indicate a temporary change in the application state.

## Shapes

The shape language is **Rounded**, utilizing an 8px (0.5rem) base radius. This softens the formal nature of the government platform, making it feel modern and user-friendly without losing its professional edge. 

- **Standard Elements:** Buttons, Input fields, and Cards all share the 8px radius.
- **Small Elements:** Tooltips and inner tags use a 4px (0.25rem) radius to maintain visual proportion.
- **Form Controls:** Checkboxes maintain a slight 2px radius to appear "square" yet polished, while Radio buttons remain perfectly circular.

## Components

### Buttons
- **Primary:** Solid Deep Institutional Blue with white text. 8px corner radius.
- **Secondary:** Transparent background with 1px Blue border and Blue text.
- **Ghost:** No border, blue text; used for low-priority actions in tables.

### Status Chips
- Always include an icon (Check, Warning, or Info) alongside the text label.
- Use low-saturation background tints of the status colors with high-saturation text for readability.

### Input Fields
- White background with a 1px #E0E4E8 border. 
- On focus, the border changes to Primary Blue with a 2px outer "glow" (0.15 opacity).
- Labels are always positioned above the field, never as placeholders.

### Data Tables
- The core of the dashboard. Use a "Zebra striping" effect or simple 1px horizontal dividers.
- Header row uses a subtle grey background (#F8F9FA) with Label-sm typography in semi-bold.

### Sidebar Navigation
- Icons should be simple, 24px stroke-based glyphs.
- The active state is indicated by a Primary Blue vertical bar (4px width) on the left edge of the nav item and a light blue background tint.

### Cards
- Used to group related data points (e.g., "Instrument Specs," "Owner Details").
- Cards must have a 1px border and no shadow. Headers within cards should be separated by a 1px horizontal line.