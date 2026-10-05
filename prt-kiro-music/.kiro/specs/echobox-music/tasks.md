# Implementation Plan: EchoBox Music

## Overview

Build EchoBox Music from scratch as a single-page React application. Tasks proceed in dependency order: project scaffold → data layer → state/hooks → UI components → app wiring → tests. Each task is atomic and implementable by a coding agent with access to the requirements and design documents.

The stack is JavaScript (JSX) + React + Vite + plain CSS. Property-based tests use **fast-check** with **Vitest**. Component tests use **@testing-library/react**.

---

## Tasks

- [x] 1. Scaffold project and configure tooling
  - [x] 1.1 Initialise Vite + React project and install all dependencies
    - Run `npm create vite@latest . -- --template react` to generate the base project
    - Install runtime deps: `react`, `react-dom`
    - Install dev deps: `vitest`, `@vitest/ui`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, `fast-check`
    - Add `test` script to `package.json`: `vitest run`
    - _Requirements: (project baseline)_

  - [x] 1.2 Create full folder structure and placeholder files
    - Create all directories and empty index files per the design's file/folder structure:
      `src/data/`, `src/context/`, `src/hooks/`, `src/components/Sidebar/`, `src/components/MainContent/`, `src/components/NowPlayingBar/`, `src/utils/`, `src/styles/`, `src/test/`, `public/audio/`
    - Create `src/test/setup.js` with `import '@testing-library/jest-dom'`
    - Configure `vite.config.js` with the test block: `{ environment: 'jsdom', globals: true, setupFiles: './src/test/setup.js' }`
    - _Requirements: (project baseline)_

  - [x] 1.3 Add CSS foundation files
    - Create `src/styles/variables.css` with CSS custom properties for the dark theme (background, surface, text, accent, spacing, border-radius tokens)
    - Create `src/styles/global.css` with reset rules, `box-sizing`, body background, font, and `@import` for `variables.css`
    - Create empty `src/styles/Sidebar.css`, `src/styles/TrackList.css`, `src/styles/NowPlayingBar.css`
    - _Requirements: 15.1, 15.5_

  - [x] 1.4 Add sample audio placeholder files and catalog
    - Drop two silent audio files (`public/audio/track01.mp3`, `public/audio/track02.wav`) so the app can run without real audio during development
    - Create `src/data/catalog.js` exporting `CATALOG` — an array of at least two `Track` objects matching the design's Track typedef, referencing the placeholder files
    - _Requirements: 1.1, 1.2_

- [x] 2. Core data models and reducer
  - [x] 2.1 Define PlayerState, action constants, and the player reducer
    - Create `src/context/playerReducer.js`
    - Export all action type constants (`LOAD_TRACK`, `PLAY`, `PAUSE`, `SEEK`, `TIME_UPDATE`, `TRACK_LOADED`, `TRACK_ENDED`, `SET_VOLUME`, `SET_ERROR`, `CLEAR_ERROR`, `SET_STATUS`, `QUEUE_EXHAUSTED`)
    - Export `initialState` matching the design's shape exactly
    - Implement `playerReducer(state, action)` handling all action types; `LOAD_TRACK` resets `currentTime` to 0 and sets `status` to `'loading'`; `TRACK_ENDED` and `QUEUE_EXHAUSTED` reset to idle; all other transitions follow the design spec
    - _Requirements: 3.1, 3.2, 3.4, 3.5, 6.3, 6.4, 8.1_

  - [x] 2.2 Write unit tests for the player reducer
    - Test each action type with representative before/after state snapshots
    - Test `LOAD_TRACK` resets `currentTime` to 0 and sets status to `'loading'`
    - Test `SET_ERROR` sets `error` field; `CLEAR_ERROR` clears it
    - _Requirements: 3.1, 3.4, 8.1_

- [x] 3. Utility functions
  - [x] 3.1 Implement `formatDuration(seconds)` in `src/utils/formatDuration.js`
    - Export `formatDuration(s)` → `"M+:SS"` with zero-padded seconds
    - Handle `s = 0` → `"0:00"`, `s = 3661` → `"61:01"`
    - _Requirements: 1.2, 4.5_

  - [x] 3.2 Write property test for `formatDuration` — Property 1
    - **Property 1: Duration formatting correctness**
    - **Validates: Requirements 1.2, 4.5**
    - Use `fc.integer({ min: 0, max: 86399 })` as the arbitrary; assert minutes = `Math.floor(s/60)`, seconds = `s % 60` with zero-padding; run 200 iterations
    - Tag comment: `// Feature: echobox-music, Property 1: Duration formatting correctness`

  - [x] 3.3 Implement `filterTracks(catalog, query)` in `src/utils/filterTracks.js`
    - Export `filterTracks(catalog, query)` returning tracks whose `title` or `artist` contains `query` as a case-insensitive substring
    - Empty or whitespace-only `query` returns the full catalog
    - _Requirements: 2.1, 2.2, 2.5_

  - [x] 3.4 Write property tests for `filterTracks` — Properties 2 and 3
    - **Property 2: Search filter containment**
    - **Validates: Requirements 2.1**
    - **Property 3: Empty/whitespace search returns full catalog**
    - **Validates: Requirements 2.2, 2.5**
    - Use `fc.array` of track objects and `fc.string` arbitraries; assert containment and full-return invariants

  - [x] 3.5 Implement `clampSeek`, `seekPercent` in `src/utils/queueUtils.js`; implement `nextTrack`, `previousTrack` queue helpers in the same file
    - `clampSeek(target, duration)` → clamps to `[0, duration]`, handles `NaN`/`Infinity`/negative
    - `seekPercent(currentTime, duration)` → `(t / d) * 100` for `d > 0`, else `0`
    - `nextTrack(queue)` → next index or `null`; `previousTrack(queue)` → previous index or `null`; both return `null` for empty queues
    - `populateQueueFromPlaylist(playlist)` → `{ tracks: playlist.tracks, currentIndex: 0, sourceId: playlist.id }`
    - _Requirements: 4.1, 4.3, 6.1, 6.2, 6.3, 6.4, 6.5, 12.1_

  - [x] 3.6 Write property tests for `clampSeek` and `seekPercent` — Properties 7 and 8
    - **Property 7: Seek percentage is always in range**
    - **Validates: Requirements 4.1**
    - **Property 8: Seek clamp always produces valid position**
    - **Validates: Requirements 4.3**
    - Use `fc.float` arbitraries for `t`, `d`, and edge-case constants (`NaN`, `Infinity`, negative)

  - [x] 3.7 Write property test for queue navigation — Property 11
    - **Property 11: Queue navigation correctness and boundary behavior**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5**
    - Use `fc.array` of tracks with `fc.integer` for current index; assert next/previous semantics and boundary `null` returns

  - [x] 3.8 Implement `storageUtils.js` — localStorage helpers and volume parsing
    - Create `src/utils/storageUtils.js`
    - Export `readPersistedVolume()` → reads `echobox:volume`, returns parsed float or `1` on any failure
    - Export `writePersistedVolume(vol)` → writes with `try/catch`, returns `true`/`false`
    - Export `parsePersistedVolume(raw)` → returns `1` for `null`, non-numeric, `NaN`, or out-of-range `[0,1]` values
    - Export `loadPlaylistsFromStorage()` with the four validation guards from the design
    - Export `serializePlaylists(ps)` and `deserializePlaylists(json)` with partial-validity filtering
    - _Requirements: 5.3, 5.4, 5.5, 14.1, 14.2, 14.3, 14.4, 14.5, 14.6_

  - [x] 3.9 Write property tests for volume persistence and playlist serialization — Properties 9, 10, 19, 20
    - **Property 9: Volume persistence round-trip**
    - **Validates: Requirements 5.3, 5.5**
    - **Property 10: Invalid persisted volume defaults to 1**
    - **Validates: Requirements 5.4**
    - **Property 19: localStorage playlist serialization round-trip**
    - **Validates: Requirements 14.1, 14.2**
    - **Property 20: Partial-validity parsing filters only invalid entries**
    - **Validates: Requirements 14.5, 14.6**
    - Use `fc.float({ min: 0, max: 1 })` for volume; use `fc.array` of playlist-shaped records for serialization properties

- [x] 4. Checkpoint — verify utilities
  - Ensure all unit and property tests pass for the reducer and utility layer. Ask the user if questions arise.

- [x] 5. PlayerContext and PlayerProvider
  - [x] 5.1 Create `PlayerContext` and skeleton `PlayerProvider`
    - Create `src/context/PlayerContext.js` exporting a `PlayerContext` created with `React.createContext(null)`
    - Create `src/context/PlayerProvider.jsx` with a functional component that:
      - Calls `useReducer(playerReducer, initialState)` (with lazy init that reads `readPersistedVolume()` for initial volume)
      - Exports `state` and `dispatch` through context
      - Wraps `children` in `PlayerContext.Provider`
    - _Requirements: 5.3_

  - [x] 5.2 Wire `useAudioEngine` and `usePlaylistManager` into `PlayerProvider`
    - Import and call `useAudioEngine(dispatch)` inside `PlayerProvider`; expose `audioEngine` through context
    - Import and call `usePlaylistManager()`; expose `playlists` and `playlistActions` through context
    - Provide the full context value shape from the design: `{ state, dispatch, audioEngine, playlists, playlistActions }`
    - _Requirements: 3.1, 5.3, 9.1, 12.1_

- [x] 6. `useAudioEngine` hook
  - [x] 6.1 Implement core audio event wiring in `useAudioEngine`
    - Create `src/hooks/useAudioEngine.js`
    - Create `audioRef = useRef(new Audio())` and `loadAbortRef = useRef(null)`
    - Register `timeupdate`, `canplay`, `ended`, and `error` event listeners in a `useEffect`; dispatch corresponding actions
    - Implement `buildErrorMessage(mediaError)` mapping all five `MediaError` codes to the strings in the design's error table
    - _Requirements: 3.1, 4.4, 8.1_

  - [x] 6.2 Implement `loadTrack`, `seek`, `setVolume` in `useAudioEngine`
    - `loadTrack(track)`: increment `loadAbortRef`, set `audio.src`, call `audio.load()`, dispatch `SET_STATUS loading`; on `canplay` check abort ref before dispatching `TRACK_LOADED`
    - `seek(time)`: call `clampSeek(time, audio.duration)`, set `audio.currentTime`
    - `setVolume(vol)`: set `audio.volume`, dispatch `SET_VOLUME`, call `writePersistedVolume(vol)`
    - _Requirements: 3.1, 4.2, 4.3, 5.2, 5.5, 16.2, 16.3_

  - [x] 6.3 Implement debounced `play`/`pause` and `skipNext`/`skipPrevious` in `useAudioEngine`
    - `pendingActionRef = useRef(null)`
    - `play()` and `pause()` each clear `pendingActionRef`, set a new 50 ms timeout that calls `audio.play()` / `audio.pause()` and dispatches `PLAY` / `PAUSE`
    - `skipNext()`: call `nextTrack(state.queue)`; if result is non-null, dispatch `LOAD_TRACK` with that track; else dispatch `QUEUE_EXHAUSTED`
    - `skipPrevious()`: same pattern with `previousTrack`
    - Return `{ loadTrack, play, pause, seek, setVolume, skipNext, skipPrevious }`
    - _Requirements: 3.2, 3.3, 3.6, 6.1, 6.2, 6.3, 6.4, 6.5, 16.1, 16.3_

  - [x] 6.4 Write property test for debounced play/pause — Property 6
    - **Property 6: Final action wins under rapid play/pause**
    - **Validates: Requirements 3.6, 16.3**
    - Mock `HTMLAudioElement`; generate arbitrary sequences of play/pause commands within the debounce window; assert only the last command is executed and intermediate calls are discarded

  - [x] 6.5 Write property test for track switch position reset — Property 5
    - **Property 5: Track switch resets position and preserves playback mode**
    - **Validates: Requirements 3.4, 16.1, 16.2**
    - Use mocked audio and reducer; assert `currentTime === 0` after switch and that `status` reflects the pre-switch playback mode

  - [x] 6.6 Write example-based unit tests for audio engine error paths
    - Test: load track → status becomes `'loading'` (Req 3.1)
    - Test: audio `error` event → `SET_ERROR` dispatched with human-readable message (Req 8.1)
    - Test: decode error → queue advanced automatically (Req 8.2)
    - Test: error dismissed via `CLEAR_ERROR` → error field becomes `null` (Req 8.3)
    - Test: load failure after unload → seek bar reset to 0, playback stopped (Req 16.4)

- [x] 7. `usePlaylistManager` hook
  - [x] 7.1 Implement `usePlaylistManager` with `create` and `remove`
    - Create `src/hooks/usePlaylistManager.js`
    - Init state with `useState(() => loadPlaylistsFromStorage())`
    - `create(name)`: validate non-blank, case-insensitive duplicate check, call `persist()`, update state; throw/return error string on failure
    - `remove(id)`: filter, persist, update state; handle write failure with rollback
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 13.2_

  - [x] 7.2 Implement `addTrack` and `removeTrack` in `usePlaylistManager`
    - `addTrack(id, track)`: find playlist, check for duplicate by `track.id`, append, persist; rollback on write failure; error if playlist not found
    - `removeTrack(id, trackId)`: find playlist, filter out track, persist; rollback on write failure
    - Return `{ playlists, create, remove, addTrack, removeTrack }`
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 11.1, 14.1_

  - [x] 7.3 Write property tests for playlist CRUD — Properties 12–18
    - **Property 12: Playlist creation round-trip** — **Validates: Requirements 9.1**
    - **Property 13: Duplicate playlist name rejection (case-insensitive)** — **Validates: Requirements 9.2**
    - **Property 14: Whitespace playlist name rejection** — **Validates: Requirements 9.3**
    - **Property 15: Track append goes to end of playlist** — **Validates: Requirements 10.1**
    - **Property 16: Duplicate track in playlist is rejected** — **Validates: Requirements 10.2**
    - **Property 17: Track removal is correct** — **Validates: Requirements 11.1**
    - **Property 18: Playlist populates queue in order** — **Validates: Requirements 12.1**
    - Each property is a separate `it.prop` test; use `fc.string`, `fc.uuid`, and `fc.array` arbitraries

  - [x] 7.4 Write example-based tests for localStorage failure and edge cases
    - Test: localStorage write failure on `create` → playlist removed from memory, error shown (Req 9.4)
    - Test: localStorage write failure on `addTrack` → append rolled back (Req 10.3)
    - Test: localStorage write failure on `removeTrack` → removal rolled back (Req 14.7)
    - Test: missing `localStorage` data → empty playlists init, no error (Req 14.3)
    - Test: corrupt JSON in `localStorage` → empty init + one-time warning (Req 14.4)
    - Test: `addTrack` with non-existent playlist ID → rejected with error (Req 10.4)

- [x] 8. Checkpoint — verify hooks
  - Ensure all hook unit tests and property tests pass. Ask the user if questions arise.

- [x] 9. NowPlayingBar components
  - [x] 9.1 Implement `TrackInfo` component
    - Create `src/components/NowPlayingBar/TrackInfo.jsx`
    - Reads `state.currentTrack` from context; renders title + artist when track is loaded
    - Renders placeholder text when `currentTrack === null`
    - Applies CSS `text-overflow: ellipsis; overflow: hidden; white-space: nowrap`
    - _Requirements: 7.1, 7.2, 7.3_

  - [x] 9.2 Implement `SeekBar` component
    - Create `src/components/NowPlayingBar/SeekBar.jsx`
    - Range input `min=0` bound to `state.currentTime`; calls `audioEngine.seek(value)` on change
    - When `state.currentTrack === null`: disabled, value forced to `0`
    - Updates in real time from `state.currentTime` (driven by `TIME_UPDATE` dispatches)
    - _Requirements: 4.1, 4.2, 4.4, 4.6_

  - [x] 9.3 Implement `VolumeControl` component
    - Create `src/components/NowPlayingBar/VolumeControl.jsx`
    - Range input `min=0 max=1 step=0.01` bound to `state.volume`; calls `audioEngine.setVolume(value)` on change
    - _Requirements: 5.1, 5.2_

  - [x] 9.4 Implement `PlaybackControls` component
    - Create `src/components/NowPlayingBar/PlaybackControls.jsx`
    - Previous, play/pause toggle, next buttons; renders `SeekBar`
    - Play/pause button disabled and shows spinner/loading text while `state.status === 'loading'`
    - Dispatches `audioEngine.play()`, `audioEngine.pause()`, `audioEngine.skipNext()`, `audioEngine.skipPrevious()` on button clicks
    - Shows elapsed time (`formatDuration(state.currentTime)`) and total (`formatDuration(state.duration)`) around seek bar
    - _Requirements: 3.2, 3.3, 3.5, 4.4, 4.5, 6.1, 6.2_

  - [x] 9.5 Implement `NowPlayingBar` component and its CSS
    - Create `src/components/NowPlayingBar/NowPlayingBar.jsx` composing `TrackInfo`, `PlaybackControls`, `VolumeControl`
    - Write `src/styles/NowPlayingBar.css`: fixed bottom bar, flex layout, dark surface, correct z-index
    - Error banner area within bar: shows `state.error` if non-null, with a dismiss button that dispatches `CLEAR_ERROR`
    - _Requirements: 4.5, 4.6, 7.4, 8.3, 8.4, 15.3_

  - [x] 9.6 Write example-based unit tests for NowPlayingBar components
    - Test: `TrackInfo` shows title+artist when track loaded (Req 7.1)
    - Test: `TrackInfo` shows placeholder when `currentTrack === null` (Req 7.2)
    - Test: `PlaybackControls` disables play button during `'loading'` status (Req 3.5)
    - Test: `SeekBar` is non-interactive (disabled) when no track is loaded (Req 4.6)

- [x] 10. MainContent components
  - [x] 10.1 Implement `TrackItem` component
    - Create `src/components/MainContent/TrackItem.jsx`
    - Displays `track.title`, `track.artist`, `formatDuration(track.duration)`
    - Adds an `isActive` CSS class when `track.id === state.currentTrack?.id`
    - Calls `onTrackSelect(track)` on click
    - _Requirements: 1.2, 3.1_

  - [x] 10.2 Implement `TrackList` component
    - Create `src/components/MainContent/TrackList.jsx`
    - Accepts `{ tracks, onTrackSelect }` props; renders a `TrackItem` per track
    - Renders "No results found" when `tracks` is empty and a search query is active
    - Renders "No tracks available" when the catalog itself is empty
    - Scrollable container
    - _Requirements: 1.3, 1.4, 2.3_

  - [x] 10.3 Implement `SearchBar` component
    - Create `src/components/MainContent/SearchBar.jsx`
    - Controlled input; calls `onChange(value)` prop on every keystroke (no form submit needed)
    - _Requirements: 2.4_

  - [x] 10.4 Implement `MainContent` component and `TrackList` CSS
    - Create `src/components/MainContent/MainContent.jsx`
    - Holds `searchQuery` local state; passes it to `SearchBar` and derives filtered tracks with `filterTracks(CATALOG, searchQuery)` for `TrackList`
    - On track select: dispatch `LOAD_TRACK` with the selected track and populate queue from catalog
    - Write `src/styles/TrackList.css`: scrollable list area, active track highlight, dark theme rows
    - _Requirements: 1.1, 2.1, 2.2, 2.4, 2.5, 3.1_

  - [x] 10.5 Write example-based unit tests for MainContent components
    - Test: `TrackList` renders all tracks from catalog (Req 1.1)
    - Test: empty catalog shows "No tracks available" message (Req 1.3)
    - Test: typing in `SearchBar` filters `TrackList` reactively (Req 2.4)
    - Test: no results shows "No results found" message (Req 2.3)

- [x] 11. Sidebar components
  - [x] 11.1 Implement `PlaylistItem` component
    - Create `src/components/Sidebar/PlaylistItem.jsx`
    - Accepts `{ playlist, onPlay, onDelete, isActive }` props
    - Displays playlist name and track count; renders play and delete buttons
    - _Requirements: 12.1, 13.1_

  - [x] 11.2 Implement `PlaylistList` component
    - Create `src/components/Sidebar/PlaylistList.jsx`
    - Reads `playlists` and `playlistActions` from context
    - Renders `PlaylistItem` per playlist; handles play-playlist trigger (call `playlistActions` + dispatch `LOAD_TRACK` with first track + populate queue from playlist via `populateQueueFromPlaylist`)
    - Shows inline "empty playlist" message when user tries to play an empty playlist (Req 12.2)
    - Delete trigger: sets local `pendingDelete` state to show confirmation prompt (Req 13.1, 13.3)
    - Confirmed delete: calls `playlistActions.remove(id)`
    - _Requirements: 12.1, 12.2, 12.3, 13.1, 13.2, 13.3_

  - [x] 11.3 Implement `CreatePlaylistForm` component
    - Create `src/components/Sidebar/CreatePlaylistForm.jsx`
    - Controlled input for playlist name; calls `playlistActions.create(name)` on submit
    - Displays inline validation/duplicate error messages returned from `create`
    - Clears input on successful creation
    - _Requirements: 9.1, 9.2, 9.3_

  - [x] 11.4 Implement `Sidebar` component and its CSS
    - Create `src/components/Sidebar/Sidebar.jsx` composing `PlaylistList` and `CreatePlaylistForm`
    - Write `src/styles/Sidebar.css`: sidebar panel layout, dark surface, scrollable playlist list
    - _Requirements: 9.1, 13.1, 15.2_

  - [x] 11.5 Write example-based unit test for delete playlist confirmation
    - Test: clicking delete on a `PlaylistItem` shows a confirmation prompt before removal (Req 13.1)

- [x] 12. App wiring and responsive layout
  - [x] 12.1 Assemble `App.jsx` with `PlayerProvider` and full layout
    - Import `CATALOG` and pass it into `PlayerProvider` (or make `PlayerProvider` import it directly per the design)
    - Render `PlayerProvider` wrapping the full layout: `Sidebar` (left column) + `MainContent` (right/main area) + `NowPlayingBar` (fixed bottom)
    - Import `src/styles/global.css`
    - Add an error boundary around `MainContent` that catches catalog load failures and renders an inline error message (Req 1.5)
    - _Requirements: 1.1, 1.5, 15.2, 15.3_

  - [x] 12.2 Implement responsive CSS layout
    - Use CSS Grid or Flexbox in `global.css` / `App.css` to produce:
      - Desktop: sidebar left column + main content right, `NowPlayingBar` fixed bottom
      - Mobile: single-column stacked layout, sidebar collapses or stacks above main content
    - Set `padding-bottom` on the scrollable content area to prevent overlap with `NowPlayingBar`
    - Use `rem`, `%`, `vw`/`vh` units — no fixed pixel widths on major containers
    - Test at 375 px (mobile) viewport width — no horizontal scrollbar
    - _Requirements: 15.2, 15.3, 15.4, 15.5_

  - [x] 12.3 Write a snapshot smoke test for the responsive dark theme
    - Render `App` in a `jsdom` environment with mocked `HTMLAudioElement`
    - Assert no crash on initial render and that the `NowPlayingBar` is present in the DOM
    - _Requirements: 15.1, 15.2, 15.3_

- [x] 13. Add track-to-playlist UI wiring
  - [x] 13.1 Add "Add to playlist" affordance on `TrackItem`
    - Extend `TrackItem` with a context menu or button that lets the user add the track to an existing playlist
    - On selection, call `playlistActions.addTrack(playlistId, track)`; display inline duplicate-track error if rejected
    - On success, briefly show confirmation (can be a simple CSS transition)
    - _Requirements: 10.1, 10.2_

  - [x] 13.2 Add "Remove from playlist" button on tracks shown in playlist view
    - When the active playlist is being viewed in `PlaylistList` or a playlist detail area, each track row should have a remove button
    - Calls `playlistActions.removeTrack(playlistId, track.id)`
    - If the removed track is currently playing, it continues until it ends (no immediate stop)
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

- [x] 14. Final checkpoint — full integration
  - Run `npx vitest run` to execute all tests. Fix any failures. Ensure the app renders without errors by reviewing the Vite dev build output (`npx vite build`). Ask the user if questions arise.

---

## Notes

- All tasks are required. Property-based tests and unit tests are part of the finalized testing strategy and must be completed alongside their corresponding implementation tasks.
- Each task references specific requirements for full traceability back to the requirements document.
- Property tests use **fast-check**; each `it.prop` call must carry the tag comment format: `// Feature: echobox-music, Property N: <title>`.
- The debounce window for play/pause is **50 ms** as specified in the design.
- All `localStorage` writes use the "write-then-set" pattern: never update in-memory state if the write throws.
- Run tests with `npx vitest run` (single execution, no watch mode).

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3", "1.4"] },
    { "id": 2, "tasks": ["2.1", "3.1", "3.3", "3.5", "3.8"] },
    { "id": 3, "tasks": ["2.2", "3.2", "3.4", "3.6", "3.7", "3.9", "5.1"] },
    { "id": 4, "tasks": ["5.2", "7.1"] },
    { "id": 5, "tasks": ["6.1", "7.2"] },
    { "id": 6, "tasks": ["6.2", "7.3", "7.4"] },
    { "id": 7, "tasks": ["6.3"] },
    { "id": 8, "tasks": ["6.4", "6.5", "6.6", "9.1", "9.2", "9.3"] },
    { "id": 9, "tasks": ["9.4", "10.1", "10.3"] },
    { "id": 10, "tasks": ["9.5", "9.6", "10.2", "10.4"] },
    { "id": 11, "tasks": ["10.5", "11.1"] },
    { "id": 12, "tasks": ["11.2", "11.3"] },
    { "id": 13, "tasks": ["11.4"] },
    { "id": 14, "tasks": ["11.5", "12.1"] },
    { "id": 15, "tasks": ["12.2"] },
    { "id": 16, "tasks": ["12.3", "13.1"] },
    { "id": 17, "tasks": ["13.2"] }
  ]
}
```
