---
inclusion: fileMatch
fileMatchPattern: "**/*.css"
---

# EchoBox Music: Styling Guidelines

## Conventions

- All design tokens (colors, spacing, typography) live in `src/styles/variables.css` as CSS custom properties
- Each component has its own CSS file in `src/styles/`
- No CSS frameworks — plain CSS only

## Theme

Dark mode by default. Core tokens:

```css
--color-bg-primary: #121212;
--color-bg-secondary: #1e1e1e;
--color-bg-elevated: #282828;
--color-text-primary: #ffffff;
--color-text-secondary: #b3b3b3;
--color-accent: #1db954;
```

## Responsive Layout

- Mobile-first
- Desktop breakpoint: `768px`
- `NowPlayingBar` is always fixed to the bottom of the viewport

## Rules

- Use `text-overflow: ellipsis` for track titles and artist names that may overflow
- Minimum touch target size: 44×44px for all interactive controls
- Focus styles must be visible (do not remove `outline`)
