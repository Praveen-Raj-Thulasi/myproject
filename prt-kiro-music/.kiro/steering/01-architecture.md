---
inclusion: always
---

# EchoBox Music: Architecture and State Management

## Project Overview

EchoBox Music is a single-page React music player that plays a static catalog of local MP3/WAV audio files using the HTML5 Audio API. All state is client-side; no backend or authentication. User data (playlists and volume) persists to localStorage.

**Stack:** React + Vite + Plain CSS + HTML5 Audio API

---

## State Management: Core Patterns

### PlayerProvider + useReducer (Single Source of Truth)

All global state lives in **one React Context** managed by a centralized reducer (playerReducer). This controls:
- Current track and playback status ('idle' | 'loading' | 'playing' | 'paused' | 'error')
- Queue (ordered track list + current index)
- Volume level [0, 1]
- Error messages
- Playback position (currentTime, duration)

**Critical rule:** No state in the audio element itself — it is a ref only. We read from it and dispatch events.

### Action Types (All in playerReducer.js)

\\\
LOAD_TRACK       — Load track, reset currentTime to 0, set status='loading'
PLAY / PAUSE     — Playback transitions
SEEK             — Manual seek bar interaction
TIME_UPDATE      — Periodic position update (audio.timeupdate event)
TRACK_LOADED     — Audio canplay event fires (duration known)
TRACK_ENDED      — Audio ended event fires
SET_VOLUME       — Volume slider change
SET_ERROR        — Audio error or failure occurred
CLEAR_ERROR      — Dismiss error banner
SET_STATUS       — Explicit status override
QUEUE_EXHAUSTED  — Last track ended, no next track
\\\

### Data Models

**Track** (static catalog entries):
- \id\, \	itle\, \rtist\, \lbum\, \duration\ (seconds), \src\ (path to audio file)

**Playlist** (persisted user-created collection):
- \id\, \
ame\, \	racks\ (full track objects denormalized)

**Queue** (transient, never persisted):
- \{ tracks: [], currentIndex: -1, sourceId: null }\
- \sourceId\ is playlist ID or null for catalog

**PlayerState**:
- \currentTrack\, \status\, \currentTime\, \duration\, \olume\, \queue\, \error\

---

## Hooks Pattern

### useAudioEngine(dispatch)

**Owns:** Single \HTMLAudioElement\ instance (ref only, never React state)

**Responsibilities:**
- Register audio listeners: \	imeupdate\, \canplay\, \ended\, \error\
- Implement debounced play/pause (50ms window) via \pendingActionRef\
- Cancel intermediate track loads via \loadAbortRef\ (incrementing counter)
- Export imperative API: \loadTrack\, \play\, \pause\, \seek\, \setVolume\, \skipNext\, \skipPrevious\

**Key patterns:**
- Debounce: Rapid successive play/pause calls reschedule the timer; only the final action fires
- Cancel loads: \loadAbortRef\ checked on \canplay\ to ignore stale load events
- Volume persistence: \setVolume\ updates audio AND writes to localStorage immediately
- State reference: \stateRef\ holds latest state so \skipNext\/\skipPrevious\ never read stale closures

**On unmount:** Audio element is cleaned up — pause, clear src, remove listeners

### usePlaylistManager()

**Manages:** \Playlist[]\ with \useState\

**Responsibilities:**
- Implement CRUD: \create\, \emove\, \ddTrack\, \emoveTrack\
- Persist to localStorage on every mutation
- Validate data on load: filter incomplete entries silently

**Persistence pattern:** "Write-then-set" — only update in-memory state AFTER localStorage write succeeds. On failure, roll back and show error.

---

## localStorage Schema

| Key | Value | Persistence |
|-----|-------|-------------|
| \echobox:playlists\ | JSON array of Playlist objects | Persisted on create/edit/delete |
| \echobox:volume\ | JSON number (0–1) | Persisted on volume slider change |

**Validation on load:**
- Missing data → return empty default (silent)
- Corrupt JSON → return empty + one-time warning
- Invalid volume → default to 1
- Incomplete playlist (missing \
ame\) → filtered out
- Incomplete track (missing \	itle\, \rtist\, \src\) → filtered out

---

## Component Architecture

`
App
└── PlayerProvider (useReducer + hooks)
    ├── Sidebar
    │   ├── PlaylistList
    │   └── CreatePlaylistForm
    ├── MainContent
    │   ├── SearchBar
    │   └── TrackList
    └── NowPlayingBar (fixed bottom)
        ├── TrackInfo
        ├── PlaybackControls
        └── VolumeControl
`

**Design:**
- Minimal prop drilling via context
- Presentational components receive props + emit callbacks
- Container components manage local state and dispatch actions
- Error boundary in App catches catalog failures

---

## Important Constraints

1. **Single catalog:** \CATALOG\ in \src/data/catalog.js\ is the authoritative track list (static, built at compile time)
2. **Queue never persists:** Queue lives only in \state.queue\ during session; populated from catalog or playlist on demand
3. **Full track storage:** Playlists store complete track objects (denormalized) so they survive catalog changes
4. **Audio element one-shot:** Created once in useAudioEngine; we update \src\ and call \load()\, not create new elements
5. **Error handling:** Errors display in banner; do not block queue or stop playback unless critical
6. **Volume defaults:** If localStorage volume is missing/invalid/out-of-range, default to 1
7. **Queue navigation:** Use \
extTrack(queue)\ and \previousTrack(queue)\ helpers that return index or null

---
