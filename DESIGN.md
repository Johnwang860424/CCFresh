---
name: Arctic Marine Freshness
colors:
  surface: '#f9f9ff'
  surface-dim: '#cfdaf1'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f0f3ff'
  surface-container: '#e7eeff'
  surface-container-high: '#dee8ff'
  surface-container-highest: '#d8e3fa'
  on-surface: '#111c2c'
  on-surface-variant: '#44474f'
  inverse-surface: '#263142'
  inverse-on-surface: '#ebf1ff'
  outline: '#74777f'
  outline-variant: '#c4c6d0'
  surface-tint: '#485e8a'
  primary: '#00102d'
  on-primary: '#ffffff'
  primary-container: '#0a254e'
  on-primary-container: '#778dbc'
  inverse-primary: '#b0c6f9'
  secondary: '#0050cc'
  on-secondary: '#ffffff'
  secondary-container: '#0266ff'
  on-secondary-container: '#f9f7ff'
  tertiary: '#0d1215'
  on-tertiary: '#ffffff'
  tertiary-container: '#22272a'
  on-tertiary-container: '#898e92'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#b0c6f9'
  on-primary-fixed: '#001a41'
  on-primary-fixed-variant: '#304671'
  secondary-fixed: '#dae1ff'
  secondary-fixed-dim: '#b3c5ff'
  on-secondary-fixed: '#001849'
  on-secondary-fixed-variant: '#003fa4'
  tertiary-fixed: '#dfe3e7'
  tertiary-fixed-dim: '#c3c7cb'
  on-tertiary-fixed: '#171c1f'
  on-tertiary-fixed-variant: '#43474b'
  background: '#f9f9ff'
  on-background: '#111c2c'
  surface-variant: '#d8e3fa'
typography:
  display-lg:
    fontFamily: Noto Sans TC
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Noto Sans TC
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.3'
  headline-lg-mobile:
    fontFamily: Noto Sans TC
    fontSize: 28px
    fontWeight: '700'
    lineHeight: '1.3'
  headline-md:
    fontFamily: Noto Sans TC
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Noto Sans TC
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Noto Sans TC
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-md:
    fontFamily: Noto Sans TC
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.2'
  label-sm:
    fontFamily: Noto Sans TC
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.2'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 8px
  sm: 16px
  md: 24px
  lg: 48px
  xl: 80px
  container-max: 1200px
  gutter: 20px
---

## Brand & Style

This design system is built for a premium frozen food ordering experience that prioritizes reliability, hygiene, and freshness. The brand personality is professional and straightforward, designed to evoke the high-quality standards of cold-chain logistics while remaining accessible to household consumers.

The visual style follows a **Modern Corporate** aesthetic with a lean towards **Minimalism**. It utilizes ample white space to symbolize cleanliness and a "frosty" freshness. The interface relies on clear visual hierarchies and high-quality product photography to drive conversion, avoiding unnecessary decorative elements in favor of functional clarity. The overall emotional response should be one of "guaranteed quality" and "effortless ordering."

## Colors

The palette is anchored by the deep navy blue derived from the core brand mark, representing depth, cold, and professional stability.

- **Primary (Deep Navy):** Used for navigation, primary headers, and core brand elements to establish authority.
- **Secondary (Ice Blue):** A brighter blue used for primary Call-to-Actions (CTAs) and interactive states to keep the UI feeling "fresh" rather than overly heavy.
- **Surface/Tertiary:** A very light cool-grey used for section backgrounds to provide soft contrast against white cards.
- **Semantic Palette:** High-visibility tones for status feedback. Success (Green) indicates stock availability and order completion; Warning (Amber) for low stock; Error (Red) for payment or form issues.

## Typography

The design system uses **Noto Sans TC** throughout to ensure maximum readability and a clean, modernist feel that supports both English and Traditional Chinese characters seamlessly.

The typographic scale is intentionally robust. Headlines are heavy and dark to anchor the page, while body text uses a generous line height (1.5-1.6) to ensure ingredients and product descriptions are easily digestible on mobile devices. For a one-page ordering site, the `display-lg` style is reserved for the hero value proposition to immediately capture attention.

## Layout & Spacing

This design system employs a **Fluid Grid** model with a maximum container width of 1200px for desktop viewing. 

- **Desktop (1024px+):** 12-column grid with 24px gutters.
- **Tablet (768px - 1023px):** 8-column grid with 20px gutters.
- **Mobile (Up to 767px):** 4-column grid with 16px gutters and 16px side margins.

The spacing rhythm follows a 4px baseline. Vertical rhythm is tight within components (using `xs` and `sm`) to keep the ordering flow efficient, while section-to-section spacing uses `lg` or `xl` to provide breathing room and visual distinction between product categories.

## Elevation & Depth

To maintain a "fresh and light" feeling, the design system avoids heavy shadows. Instead, it utilizes **Tonal Layers** and **Low-Contrast Outlines**.

- **Level 0 (Background):** Pure white (#FFFFFF) or light tint (#F0F4F8).
- **Level 1 (Cards/Containers):** Pure white with a 1px border (#E2E8F0).
- **Level 2 (Hover/Active):** A very soft, diffused shadow (0px 4px 20px rgba(10, 37, 78, 0.05)) to suggest interactivity without adding visual weight.
- **Product Images:** Should feature subtle natural shadows within the photography to provide a sense of "tangible" food quality against the flat UI.

## Shapes

The shape language is defined by **Rounded (0.5rem)** corners. This choice softens the professional navy blue, making the brand feel more approachable and modern. 

- **Standard Elements:** Buttons, input fields, and product cards use the base 8px (0.5rem) radius.
- **Large Containers:** Hero sections or modal overlays may scale up to `rounded-lg` (16px) for a smoother appearance.
- **Tags/Chips:** Fully rounded (pill-shaped) to distinguish them from actionable buttons.

## Components

### Buttons
- **Primary:** Deep navy background, white text. High contrast for "Add to Cart" or "Checkout."
- **Secondary:** Transparent background with ice-blue border and text. Used for "View Details."

### Product Cards
- Clean white background with a subtle border. 
- Image at the top, followed by a bold title, a clear price tag in the secondary blue, and a prominent "Add" button.
- Include a "Quick Add" stepper (+/-) that appears once an item is in the cart.

### Input Fields
- Understated borders (#CBD5E0) that turn navy (#0A254E) on focus. 
- Validation states must use semantic colors (Green/Red) for immediate feedback during the checkout process.

### Order Summary Sticky Bar
- For the one-page experience, a bottom-anchored bar (mobile) or sidebar (desktop) that summarizes the total price and provides a "Checkout Now" button.

### Status Chips
- Small, pill-shaped labels for "In Stock," "Limited," or "New Arrival," using low-opacity versions of the semantic palette with high-contrast text.