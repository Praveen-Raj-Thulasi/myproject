---
inclusion: always
---

# EchoBox Music: Architecture Guidelines

## Stack

- **React** (functional components + hooks) — UI layer
- **Vite** — bundler and dev server
- **Plain CSS** — styling (no frameworks)
- **HTML5 Audio API** — playback via `HTMLAudioElement`
- **localStorage** — persistence for playlists and volume

## State Management

All global state lives in a single `PlayerProvider` using `useReducer`. The audio element is a `useRef` only — never stored in React state.

### Key Rules

1. One `PlayerContext` — no additional global stores
2. The `HTMLAudioElement` is a ref, not state. Read from it; dispatch events into the reducer.
3. Queue is transient — never persisted to localStorage
4. Tracks are stored denormalized inside playlists (self-contained, survives catalog changes)
5. Volume and playlists are the only two things persisted to localStorage

## Component Tree

```
App
└── PlayerProvider
    ├── Sidebar (PlaylistList, CreatePlaylistForm)
    ├── MainContent (SearchBar, TrackList)
    └── NowPlayingBar (TrackInfo, PlaybackControls, SeekBar, VolumeControl)
```

## localStorage Keys

| Key | Value |
|-----|-------|
| `echobox:playlists` | JSON array of Playlist objects |
| `echobox:volume` | JSON number [0, 1] |
