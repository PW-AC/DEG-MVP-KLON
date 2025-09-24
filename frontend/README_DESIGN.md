## Design System Overview

This frontend has been visually overhauled using a token-based design system. Layout and business logic were preserved.

### Brand
- Primary: Dark Blue `#001f3d`, Light Blue `#88a9c3`, Very Light Blue `#e3ebf2`, White `#ffffff`
- Accent: Orange `#fa9939`, Light Orange `#f8dcbf`
- Fonts: Headings — Tenor Sans; Body/UI — Open Sans

### Files
- `src/styles/tokens.css`: Design tokens (colors, typography, spacing, radius, shadows, motion, grid)
- `src/styles/base.css`: Reset, type scale, focus styles, container, skip link
- `src/styles/app-theme.css`: Visual overrides mapped to existing classnames
- `src/Styleguide.jsx`: Styleguide route (`/styleguide`) with tokens and component previews

### Principles
- No hardcoded hex values inside components. Use tokens via CSS variables or Tailwind mappings.
- Accessibility: Visible focus states; skip-to-content; contrast AA targets.
- Performance: System fonts fallback, `font-display: swap`, minimal transitions respectful of reduced motion.

### Extensibility
- Add new colors as tokens in `tokens.css` only.
- Use existing utility classes and Tailwind semantic tokens mapped in `src/index.css`.

