# Design Document: EchoBox Music

## Overview

EchoBox Music is a single-page React application that plays a small, curated set of local audio files (MP3 and WAV) directly in the browser using the HTML5 Audio API. There is no backend, no authentication, and no external services. All persistent user data (playlists and volume level) lives in `localStorage`.

**Stack:** React + Vite + Plain CSS + HTML5 Audio API + Vitest + fast-check

---

## Architecture

### Component Tree

```
App
└── PlayerProvider  (React Context — global player state via useReducer)
    ├── Sidebar
    │   ├── PlaylistList
    │   │   └── PlaylistItem
    │   └── CreatePlaylistForm
    ├── MainContent
    │   ├── SearchBar
    │   └── TrackList
    │       └── TrackItem
    └── NowPlayingBar
        ├── TrackInfo
        ├── PlaybackControls
        │   └── SeekBar
        └── VolumeControl
```

---

## State Management

A single `PlayerProvider` wraps the entire app. All global state lives in a `useReducer`. It exposes:
- `state` — current PlayerState
- `dispatch` — reducer dispatch function
- `audioEngine` — imperative audio methods (play, pause, seek, setVolume, loadTrack, skipNext, skipPrevious)
- `playlists` / `playlistActions` — playlist CRUD via `usePlaylistManager`

### Data Models

**Track**
```js
{ id, title, artist, album, duration, src }
```

**Playlist**
```js
{ id, name, tracks: Track[] }  // tracks denormalized for self-containment
```

**Queue** (transient, never persisted)
```js
{ tracks: [], currentIndex: -1, sourceId: null }
```

**PlayerState**
```js
{
  currentTrack: null,
  status: 'idle',        // 'idle' | 'loading' | 'playing' | 'paused' | 'error'
  currentTime: 0,
  duration: 0,
  volume: 1,
  queue: { tracks: [], currentIndex: -1, sourceId: null },
  error: null
}
```

### Reducer Action Types

```
LOAD_TRACK       — load track, reset currentTime, set status='loading'
PLAY / PAUSE     — playback transitions
SEEK             — { time }
TIME_UPDATE      — { currentTime }
TRACK_LOADED     — { duration }
TRACK_ENDED      — advance queue or exhaust
SET_VOLUME       — { volume }
SET_ERROR        — { error }
CLEAR_ERROR
SET_STATUS       — { status }
QUEUE_EXHAUSTED  — clear track, reset state
```

---

## Hooks

### `useAudioEngine(dispatch)`
Owns a single `HTMLAudioElement` via `useRef`. Never stored in React state.
- Registers `timeupdate`, `canplay`, `ended`, `error` listeners
- Debounces rapid play/pause via `pendingActionRef` (50ms window)
- Cancels stale loads via `loadAbortRef`

### `usePlaylistManager()`
Manages `Playlist[]` with `useState`.
- CRUD: `create`, `remove`, `addTrack`, `removeTrack`
- Write-then-set: persists to localStorage before updating in-memory state; rolls back on failure

---

## localStorage Schema

| Key | Value |
|-----|-------|
| `echobox:playlists` | JSON array of Playlist objects |
| `echobox:volume` | JSON number [0, 1] |

---

## File Structure

```
src/
├── data/catalog.js           Static CATALOG array
├── context/
│   ├── PlayerContext.js
│   ├── PlayerProvider.jsx
│   └── playerReducer.js
├── hooks/
│   ├── useAudioEngine.js
│   └── usePlaylistManager.js
├── components/
│   ├── MainContent/
│   ├── NowPlayingBar/
│   └── Sidebar/
├── utils/
│   ├── formatDuration.js
│   ├── filterTracks.js
│   ├── queueUtils.js
│   └── storageUtils.js
└── test/
```
