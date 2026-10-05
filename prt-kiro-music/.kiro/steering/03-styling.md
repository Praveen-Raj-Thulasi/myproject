---
inclusion: always
---

# EchoBox Music: CSS and Styling Conventions

## Design System: Dark Theme with CSS Custom Properties

All colors, spacing, and typography are defined in \src/styles/variables.css\. Every component imports and uses these custom properties instead of hardcoding values.

### CSS Custom Properties (variables.css)

**Colors (dark theme):**
\\\css
--bg-primary:      /* Main background (darkest) */
--bg-secondary:    /* Surface background (lighter than primary) */
--text-primary:    /* Main text (brightest) */
--text-secondary:  /* Muted text */
--accent:          /* Interactive elements, highlights */
--border:          /* Dividers, borders */
\\\

**Spacing:**
\\\css
--spacing-xs:      /* Extra small */
--spacing-sm:      /* Small */
--spacing-md:      /* Medium */
--spacing-lg:      /* Large */
--spacing-xl:      /* Extra large */
\\\

**Typography:**
\\\css
--font-family:     /* Primary font stack */
--font-size-base:  /* 16px or equivalent */
--font-size-sm:    /* Smaller text */
--font-size-lg:    /* Larger text */
\\\

**Layout:**
\\\css
--border-radius:   /* Default corner rounding */
--z-index-bar:     /* Now Playing Bar fixed position */
\\\

---

## File Organization

| File | Purpose |
|------|---------|
| \ariables.css\ | All CSS custom properties (colors, spacing, typography, z-index) |
| \global.css\ | Reset rules, body styling, app layout grid/flex, @import variables.css |
| \Sidebar.css\ | Sidebar panel layout, playlist list, forms |
| \TrackList.css\ | Track list container, TrackItem styling, active state |
| \NowPlayingBar.css\ | Fixed bottom bar, track info, controls, error banner |
| \App.css\ | (Optional) Top-level app container and responsive breakpoints |

---

## Layout Principles

### Responsive Design

**Desktop layout:**
- Sidebar: fixed-width left column
- MainContent: flex-grow right column
- NowPlayingBar: fixed bottom bar spanning full width

**Mobile layout (< 768px):**
- Single-column stacked layout
- Sidebar may collapse/hide or stack above MainContent
- NowPlayingBar: still fixed at bottom
- No horizontal scrollbars at 375px width

**CSS units:**
- Use \em\, \%\, \w\/\h\ for major containers — NO fixed pixel widths
- Relative units scale with user font preferences and viewport size

### NowPlayingBar: Fixed Positioning

\\\css
.now-playing-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: var(--z-index-bar);  /* High z-index to stay above other content */
  background: var(--bg-secondary);
  border-top: 1px solid var(--border);
}
\\\

**Content below must have bottom padding** to prevent obscuring by the bar:
\\\css
.scrollable-content {
  padding-bottom: var(--now-playing-bar-height);  /* Reserve space */
}
\\\

### Scrollable Containers

Track list and playlist list must be independently scrollable:
\\\css
.track-list {
  overflow-y: auto;
  overflow-x: hidden;
  height: /* calculated to fit viewport */;
}
\\\

---

## Text Handling

### Overflow and Ellipsis

Track titles and artist names can overflow. Use CSS to truncate with ellipsis:

\\\css
.track-title {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
\\\

For multi-line truncation (if needed):
\\\css
display: -webkit-box;
-webkit-line-clamp: 2;
-webkit-box-orient: vertical;
overflow: hidden;
\\\

---

## Interactive Elements

### Buttons and Clickable Items

- Use \cursor: pointer\
- Provide visual feedback on hover (color change, background change, or opacity)
- Provide active/focus states for accessibility
- Use \utton\ elements or \ole='button'\ on divs

### Form Inputs

- Range inputs (volume slider, seek bar): \min\, \max\, \step\ attributes
- Text inputs (search, playlist name): clear focus states, cursor, borders
- All inputs must have accessible labels

---

## Dark Theme Specifics

- **Text on dark background:** Use \--text-primary\ for high contrast (WCAG AA minimum)
- **Muted text:** \--text-secondary\ for secondary information (reduced contrast)
- **Accent color:** Use for active states, highlights, CTAs
- **No white backgrounds:** All surfaces are \--bg-primary\ or \--bg-secondary\ (shades of dark)
- **Borders:** Use \--border\ color, typically subtle gray

---

## Responsive Breakpoints (Suggested)

\\\css
/* Mobile first */
@media (max-width: 375px) {
  /* Ensure no horizontal scroll at narrow widths */
  body { overflow-x: hidden; }
}

@media (min-width: 768px) {
  /* Desktop layout: sidebar + main side-by-side */
  .app-layout {
    display: flex;
    flex-direction: row;
  }
  .sidebar { width: /* fixed or flex */ }
  .main-content { flex: 1 }
}

@media (max-width: 767px) {
  /* Mobile: stacked layout */
  .app-layout {
    display: flex;
    flex-direction: column;
  }
}
\\\

---

## Component Styling Pattern

Each component has an associated CSS file in \src/styles/\:

1. Import \global.css\ (which includes \ariables.css\)
2. Use CSS custom properties throughout
3. Keep styles scoped to the component's class or nested selectors
4. Avoid inline styles; use CSS files only

**Example:**
\\\jsx
// TrackItem.jsx
import './TrackItem.css';

export function TrackItem({ track, isActive }) {
  return (
    <div className={\	rack-item \\}>
      <div className="track-title">{track.title}</div>
      <div className="track-artist">{track.artist}</div>
    </div>
  );
}
\\\

\\\css
/* TrackItem.css */
.track-item {
  padding: var(--spacing-md);
  cursor: pointer;
  transition: background 0.2s;
}

.track-item:hover {
  background: var(--bg-primary);
}

.track-item.active {
  background: var(--accent);
  color: var(--bg-primary);
}

.track-title {
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.track-artist {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}
\\\

---

## Accessibility Notes

- Use semantic HTML (\utton\, \input\, \label\)
- All interactive elements must have visible focus states
- Color should not be the only indicator of state (use text labels, icons, or opacity)
- Sufficient contrast: text on background must meet WCAG AA (4.5:1 for small text)
- Avoid position: fixed without accounting for mobile browsers (use bottom safe area if needed)

---
