---
inclusion: always
---

# EchoBox Music: Testing Strategy

## Stack

- **Vitest** — test runner
- **@testing-library/react** — component tests
- **fast-check** — property-based testing

## Configuration

```js
// vite.config.js
test: {
  environment: 'jsdom',
  globals: true,
  setupFiles: './src/test/setup.js'
}
```

## Test Commands

- `npm test` — runs `vitest run` (single execution, no watch mode)

## Testing Layers

### 1. Reducer Unit Tests
Test every action type: `LOAD_TRACK`, `PLAY`, `PAUSE`, `SEEK`, `TIME_UPDATE`, `TRACK_LOADED`, `TRACK_ENDED`, `SET_VOLUME`, `SET_ERROR`, `CLEAR_ERROR`, `QUEUE_EXHAUSTED`.

### 2. Utility Unit Tests
- `formatDuration` — zero, seconds, minutes, zero-padding
- `filterTracks` — substring match, empty query, whitespace query, no results
- `queueUtils` — nextTrack, previousTrack, clampSeek, seekPercent, populateQueueFromPlaylist
- `storageUtils` — volume read/parse, playlist load/save round-trip

### 3. Component Tests (@testing-library/react)
- `TrackList` renders catalog; empty catalog message
- `SearchBar` filters reactively; no-results message
- `TrackInfo` shows placeholder when no track loaded
- `PlaybackControls` disables play button during `status='loading'`
- `SeekBar` non-interactive when no track

### 4. Property-Based Tests (fast-check)
Tag each test: `// Feature: echobox-music, Property N: <title>`

Key properties:
- **P1** Duration formatting: output always matches `M+:SS` pattern
- **P2** Search containment: all returned tracks contain query string
- **P3** Whitespace/empty search returns full catalog
- **P5** Track switch resets `currentTime` to 0
- **P6** Final action wins under rapid play/pause (50ms debounce)
- **P7** `seekPercent` always in [0, 100]
- **P8** `clampSeek` always in [0, duration]
