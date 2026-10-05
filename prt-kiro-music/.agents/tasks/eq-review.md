# Orange theme, 4-track catalog, and Equalizer visualizer for EchoBox

This commit adds a complete orange color theme, expands the track catalog from 2 to 4 tracks, and introduces an animated Equalizer component in the NowPlayingBar. The theme is anchored by a warm dark palette (`#1A0F00` base through `#4A2D00` overlay) with `#FF6B00` as the primary accent, replacing what was previously a purple-tinted scheme. The Equalizer renders five animated bars that freeze when playback is paused. The build artifact (`dist/`) exists on disk, confirming a successful local build was run before commit.

Watch for: the `dist/` folder is gitignored and not tracked — the build result is inferred from the artifact's presence, not from a CI log. The commit message does not explicitly state "build passed".

**Verdict**: APPROVED

---

## High-level view

The CSS variable layer is the single source of truth for the entire orange palette. Every downstream stylesheet (`global.css`, `Sidebar.css`, `TrackList.css`, `NowPlayingBar.css`) references only CSS custom properties — no hardcoded color literals appear outside `variables.css` and `Equalizer.css`. The only raw hex values in component CSS are `#fff` for white text on colored backgrounds (error banner, danger button) and `#e04e53` for a hover darkening of the error button — none of these are purple.

The catalog now exports exactly 4 tracks. Both Tamil tracks carry URL-encoded `src` paths (`%20` for spaces). The two new generic tracks (`track01`, `track02`) use simple unencoded names with no spaces, so no encoding is needed there. All required fields (`id`, `title`, `artist`, `album`, `duration`, `src`) are present on every entry.

`Equalizer.jsx` is a focused component: it accepts `isPlaying`, conditionally applies `equalizer--paused`, and marks itself `aria-hidden="true"`. In `NowPlayingBar.jsx` it is imported and rendered inside a `{state.currentTrack && (...)}` guard, so it only appears when a track is loaded. The CSS uses `animation-play-state: paused` on `.equalizer--paused .equalizer__bar` to freeze the bars, which is the correct CSS approach for this pattern.

The build produced `dist/assets/index-BlUTc2bp.css` and `dist/assets/index-D2Rl29sU.js`, confirming Vite bundled without error. The commit is clean with no uncommitted changes.

---

<details>
<summary>Issues (1)</summary>

1. **Build confirmation inferred, not explicit** — The `dist/` folder exists locally but is gitignored, so no CI log or explicit "build passed" message is in the commit. The task description says to check whether "the coder reported a successful build" — no such report exists in the commit message. The artifact presence (`dist/assets/index-BlUTc2bp.css`, `dist/assets/index-D2Rl29sU.js`) is strong evidence, but future commits should include a note in the commit body or a CI badge.

</details>

<details>
<summary>Details</summary>

### Orange palette coverage across all stylesheets

`variables.css` defines the full warm-dark palette: `--color-bg-base: #1A0F00`, `--color-bg-surface: #2A1800`, `--color-bg-elevated: #3A2200`, `--color-bg-overlay: #4A2D00`, `--color-accent: #FF6B00`, `--color-accent-hover: #FF9A3C`, `--color-accent-active: #E55A00`, `--color-border-focus: #FF6B00`. Searching all four component CSS files for any non-white, non-error hex literal returns nothing purple or violet. The only hardcoded hex values in component CSS are:

- `Equalizer.css`: `#FF6B00` and `#FFB347` in the bar gradient — both orange, consistent with the palette.
- `NowPlayingBar.css`: `#fff` for text on the red error banner.
- `Sidebar.css`: `#fff` and `#e04e53` (error hover darkening).
- `TrackList.css`: `#fff` for text on the error feedback toast.

None of these are purple. All interactive/accent surfaces use `var(--color-accent)` or `rgba(255, 107, 0, ...)`.

### Equalizer component wiring

`Equalizer.jsx` imports `../../styles/Equalizer.css`, receives `isPlaying: boolean`, and applies `equalizer--paused` when false. In `NowPlayingBar.jsx`, the import is present and the usage is:

```jsx
{state.currentTrack && (
  <Equalizer isPlaying={state.status === 'playing'} />
)}
```

The guard is correct — the component only mounts when `currentTrack` is set. The `isPlaying` expression `state.status === 'playing'` will evaluate to `false` for `'paused'`, `'loading'`, and `'idle'` states, causing bars to freeze appropriately in all non-playing states.


</details>

---

<details>
<summary>File map</summary>

| File | What changed |
|------|-------------|
| `src/styles/variables.css` | Replaced purple palette with full orange warm-dark token set |
| `src/styles/global.css` | No color literals; imports variables.css (unchanged) |
| `src/styles/TrackList.css` | Active/hover states and search focus glow updated to orange rgba values |
| `src/styles/NowPlayingBar.css` | Minor additions (two lines); no color literal changes |
| `src/styles/Sidebar.css` | One line updated to use orange accent; `#fff`/error literals unchanged |
| `src/styles/Equalizer.css` | New file: 5-bar animated equalizer with orange gradient |
| `src/components/NowPlayingBar/Equalizer.jsx` | New component: animated bars, `isPlaying` prop, `aria-hidden` |
| `src/components/NowPlayingBar/NowPlayingBar.jsx` | Imports and mounts `<Equalizer>` behind `currentTrack` guard |
| `src/data/catalog.js` | Artist/album filled on Tamil tracks; 2 new tracks added (track01, track02) |

Full diff: `git show HEAD` in the repo root.

</details>
