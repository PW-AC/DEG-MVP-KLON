## Frontend UI Modification Guide for Agents

Always use the design system tokens and avoid hardcoding colors, spacing, or typography.

### Where to change things
- Colors, typography, spacing, shadows: `src/styles/tokens.css`
- Global base styles, focus, container: `src/styles/base.css`
- Visual theme overrides on existing layout: `src/styles/app-theme.css`
- Tailwind semantic mapping to tokens: `src/index.css` (`:root` CSS variables)

### Rules
- Do not change DOM structure for layout unless explicitly requested. Visual edits should be done via CSS.
- Use CSS variables in new components (e.g., `color: hsl(var(--color-primary-900))`).
- Respect accessibility: ensure focus states are visible and color contrast meets WCAG 2.1 AA.

### Testing
- Navigate to `/styleguide` to verify tokens and component samples.

