# Implementation Tasks: EchoBox Music

## Wave 1 — Project Scaffold

- [x] 1.1 Initialize Vite + React project
- [x] 1.2 Install dependencies: react, react-dom, vitest, @testing-library/react, fast-check
- [x] 1.3 Configure Vitest with jsdom environment and setupFiles

## Wave 2 — Data Layer

- [x] 2.1 Create `src/data/catalog.js` with CATALOG array
- [x] 2.2 Drop audio files into `public/audio/`

## Wave 3 — Reducer

- [x] 3.1 Create `playerReducer.js` with all action types and initialState
- [x] 3.2 Write unit tests for every reducer action

## Wave 4 — Utilities

- [x] 4.1 Create `formatDuration.js` — format seconds to MM:SS
- [x] 4.2 Create `filterTracks.js` — case-insensitive substring filter
- [x] 4.3 Create `queueUtils.js` — nextTrack, previousTrack, clampSeek, seekPercent, populateQueueFromPlaylist
- [x] 4.4 Create `storageUtils.js` — readPersistedVolume, loadPlaylistsFromStorage, serializePlaylists, deserializePlaylists
- [x] 4.5 Write property-based tests for all utilities (fast-check)

## Wave 5 — Context and Hooks

- [x] 5.1 Create `PlayerContext.js`
- [x] 5.2 Create `useAudioEngine.js` with debounce and abort-on-stale-load
- [x] 5.3 Create `usePlaylistManager.js` with write-then-set localStorage persistence
- [x] 5.4 Create `PlayerProvider.jsx` wiring reducer + hooks + context

## Wave 6 — UI Components

- [x] 6.1 Build `Sidebar` — PlaylistList, PlaylistItem, CreatePlaylistForm
- [x] 6.2 Build `MainContent` — SearchBar, TrackList, TrackItem
- [x] 6.3 Build `NowPlayingBar` — TrackInfo, PlaybackControls, SeekBar, VolumeControl

## Wave 7 — Styling

- [x] 7.1 Define CSS custom properties in `variables.css` (dark theme)
- [x] 7.2 Apply per-component CSS files
- [x] 7.3 Implement responsive breakpoints (mobile-first, 768px desktop)

## Wave 8 — Integration and Tests

- [x] 8.1 Write component tests with @testing-library/react
- [x] 8.2 Write hook unit and property tests
- [x] 8.3 Run full test suite — all pass
- [x] 8.4 Run production build — no errors
