---
name: react-audio-player
description: Build and review React music players using HTML5 Audio, shared playback state, playlists, and playback controls.
---

# React Audio Player Skill

## Overview

Reusable guidance for building React music players using the HTML5 Audio API with shared state management, playlists, and robust playback controls.

---

## Architecture

### Shared React Context/Provider for Playback State

**Pattern:** Centralized state management using React Context + useReducer

```javascript
// PlayerContext.js
const PlayerContext = createContext();

// PlayerProvider.jsx
export function PlayerProvider({ children }) {
  const [state, dispatch] = useReducer(playerReducer, initialState);
  const audioEngine = useAudioEngine(dispatch);
  const playlists = usePlaylistManager();
  
  const value = useMemo(
    () => ({ state, dispatch, audioEngine, playlists }),
    [state, playlists]
  );
  
  return (
    <PlayerContext.Provider value={value}>
      {children}
    </PlayerContext.Provider>
  );
}
```

**State Shape:**
```javascript
{
  currentTrack: null | Track,
  status: 'idle' | 'loading' | 'playing' | 'paused' | 'error',
  currentTime: number,
  duration: number,
  volume: number,
  queue: { tracks: Track[], currentIndex: number },
  error: null | string
}
```

### Reducer-Based State Transitions

**Pattern:** All state changes flow through a single reducer with explicit action types

```javascript
// playerReducer.js
export function playerReducer(state, action) {
  switch (action.type) {
    case 'LOAD_TRACK':
      return {
        ...state,
        currentTrack: action.track,
        status: 'loading',
        currentTime: 0,
        error: null
      };
    
    case 'PLAY':
      return { ...state, status: 'playing' };
    
    case 'PAUSE':
      return { ...state, status: 'paused' };
    
    case 'SEEK':
      return { ...state, currentTime: action.time };
    
    case 'TIME_UPDATE':
      return { ...state, currentTime: action.currentTime };
    
    case 'TRACK_LOADED':
      return { ...state, duration: action.duration, status: 'paused' };
    
    case 'TRACK_ENDED':
      return { ...state, status: 'idle', currentTime: 0 };
    
    case 'SET_VOLUME':
      return { ...state, volume: action.volume };
    
    case 'SET_ERROR':
      return { ...state, error: action.error, status: 'error' };
    
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    
    default:
      return state;
  }
}
```

**Benefits:**
- Predictable state updates
- Easy to test (pure function)
- Clear audit trail of state changes
- Time-travel debugging support

### Dedicated Audio-Engine Hook for HTMLAudioElement Lifecycle

**Pattern:** Single useAudioEngine hook owns the Audio element and manages its lifecycle

```javascript
// useAudioEngine.js
export function useAudioEngine(dispatch) {
  const audioRef = useRef(null);
  const stateRef = useRef(null);
  const pendingActionRef = useRef(null);
  const loadAbortRef = useRef(0);
  
  // Create Audio element once
  useEffect(() => {
    audioRef.current = new Audio();
    
    // Register event listeners
    const audio = audioRef.current;
    
    const handleTimeUpdate = () => {
      dispatch({ 
        type: 'TIME_UPDATE', 
        currentTime: audio.currentTime 
      });
    };
    
    const handleCanPlay = () => {
      dispatch({ 
        type: 'TRACK_LOADED', 
        duration: audio.duration 
      });
    };
    
    const handleEnded = () => {
      dispatch({ type: 'TRACK_ENDED' });
      // Advance to next track if available
      skipNext();
    };
    
    const handleError = () => {
      dispatch({ 
        type: 'SET_ERROR', 
        error: buildErrorMessage(audio.error) 
      });
    };
    
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    
    // Cleanup on unmount
    return () => {
      audio.pause();
      audio.src = '';
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [dispatch]);
  
  // Imperative API
  const loadTrack = (track) => {
    const audio = audioRef.current;
    audio.src = track.src;
    audio.load();
    dispatch({ type: 'LOAD_TRACK', track });
  };
  
  const play = () => {
    audioRef.current.play().catch(console.error);
    dispatch({ type: 'PLAY' });
  };
  
  const pause = () => {
    audioRef.current.pause();
    dispatch({ type: 'PAUSE' });
  };
  
  const seek = (time) => {
    audioRef.current.currentTime = clampSeek(time, state.duration);
    dispatch({ type: 'SEEK', time });
  };
  
  const setVolume = (volume) => {
    const clamped = Math.max(0, Math.min(1, volume));
    audioRef.current.volume = clamped;
    dispatch({ type: 'SET_VOLUME', volume: clamped });
    writePersistedVolume(clamped);
  };
  
  return { loadTrack, play, pause, seek, setVolume, skipNext, skipPrevious };
}
```

**Critical Rules:**
- Create Audio element ONCE in useEffect
- Store in ref, never in state
- Clean up on unmount (pause, clear src, remove listeners)
- Use refs for values read in callbacks to avoid stale closures

### Playlist Persistence Separate from Playback State

**Pattern:** Playlists managed independently with localStorage sync

```javascript
// usePlaylistManager.js
export function usePlaylistManager() {
  const [playlists, setPlaylists] = useState(() => 
    loadPlaylistsFromStorage()
  );
  
  const create = (name) => {
    const newPlaylist = { id: uuid(), name, tracks: [] };
    const updated = [...playlists, newPlaylist];
    setPlaylists(updated);
    serializePlaylists(updated);
  };
  
  const addTrack = (playlistId, track) => {
    const updated = playlists.map(p => 
      p.id === playlistId 
        ? { ...p, tracks: [...p.tracks, track] }
        : p
    );
    setPlaylists(updated);
    serializePlaylists(updated);
  };
  
  const remove = (playlistId) => {
    const updated = playlists.filter(p => p.id !== playlistId);
    setPlaylists(updated);
    serializePlaylists(updated);
  };
  
  return { playlists, create, addTrack, removeTrack, remove };
}
```

**Storage Pattern:**
- Read on mount
- Write immediately after every mutation
- Store full track objects (denormalized) so playlists survive catalog changes
- Validate on load, filter invalid entries silently

---

## Playback Behavior

### Play

```javascript
const play = () => {
  clearTimeout(pendingActionRef.current);
  pendingActionRef.current = setTimeout(() => {
    audioRef.current.play()
      .catch(err => {
        if (err.name === 'NotAllowedError') {
          dispatch({ type: 'SET_ERROR', error: 'Autoplay blocked' });
        }
      });
    dispatch({ type: 'PLAY' });
  }, 50); // Debounce
};
```

**Debouncing:** 50ms window prevents audio glitching from rapid play/pause toggling.

### Pause

```javascript
const pause = () => {
  clearTimeout(pendingActionRef.current);
  pendingActionRef.current = setTimeout(() => {
    audioRef.current.pause();
    dispatch({ type: 'PAUSE' });
  }, 50); // Debounce
};
```

### Seek

```javascript
const seek = (targetTime) => {
  const clamped = clampSeek(targetTime, state.duration);
  audioRef.current.currentTime = clamped;
  dispatch({ type: 'SEEK', time: clamped });
};

function clampSeek(target, duration) {
  if (!isFinite(target) || !isFinite(duration)) return 0;
  return Math.max(0, Math.min(target, duration));
}
```

**Always clamp seek values** to [0, duration] to handle:
- NaN from invalid user input
- Infinity from unloaded tracks
- Negative values

### Previous

```javascript
const skipPrevious = () => {
  const queue = stateRef.current.queue;
  const prevIndex = previousTrack(queue);
  
  if (prevIndex !== null) {
    const track = queue.tracks[prevIndex];
    loadTrack(track);
    if (shouldPlayRef.current) play();
  } else {
    pause();
    dispatch({ type: 'CLEAR_TRACK' });
  }
};

function previousTrack(queue) {
  if (!queue.tracks.length) return null;
  const prev = queue.currentIndex - 1;
  return prev >= 0 ? prev : null;
}
```

**Boundary behavior:** Return null at start of queue, don't wrap around.

### Next

```javascript
const skipNext = () => {
  const queue = stateRef.current.queue;
  const nextIndex = nextTrack(queue);
  
  if (nextIndex !== null) {
    const track = queue.tracks[nextIndex];
    loadTrack(track);
    if (shouldPlayRef.current) play();
  } else {
    pause();
    dispatch({ type: 'QUEUE_EXHAUSTED' });
  }
};

function nextTrack(queue) {
  if (!queue.tracks.length) return null;
  const next = queue.currentIndex + 1;
  return next < queue.tracks.length ? next : null;
}
```

**Boundary behavior:** Return null at end of queue, don't wrap around.

### Volume

```javascript
const setVolume = (volume) => {
  const clamped = Math.max(0, Math.min(1, volume));
  audioRef.current.volume = clamped;
  dispatch({ type: 'SET_VOLUME', volume: clamped });
  writePersistedVolume(clamped);
};
```

**Always clamp volume** to [0, 1] and persist immediately.

### Ended-Event Handling

```javascript
const handleEnded = () => {
  dispatch({ type: 'TRACK_ENDED' });
  
  const queue = stateRef.current.queue;
  const nextIndex = nextTrack(queue);
  
  if (nextIndex !== null) {
    const track = queue.tracks[nextIndex];
    loadTrack(track);
    play(); // Auto-advance
  } else {
    dispatch({ type: 'QUEUE_EXHAUSTED' });
  }
};
```

**Auto-advance pattern:** When track ends, automatically load and play next track if available.

### Clamping Seek/Volume Values

**Always validate and clamp user input:**

```javascript
// Seek clamping
function clampSeek(target, duration) {
  if (!isFinite(target)) return 0;
  if (!isFinite(duration)) return 0;
  return Math.max(0, Math.min(target, duration));
}

// Volume clamping
function clampVolume(volume) {
  if (typeof volume !== 'number') return 1;
  if (!isFinite(volume)) return 1;
  return Math.max(0, Math.min(1, volume));
}

// Percentage calculation (for seek bar)
function seekPercent(currentTime, duration) {
  if (!isFinite(duration) || duration <= 0) return 0;
  return (currentTime / duration) * 100;
}
```

---

## React Implementation Guidance

### Do Not Create a New Audio Instance Every Render

❌ **WRONG:**
```javascript
function Player() {
  const audio = new Audio(); // Creates new instance every render!
  // ...
}
```

✅ **CORRECT:**
```javascript
function useAudioEngine() {
  const audioRef = useRef(null);
  
  useEffect(() => {
    audioRef.current = new Audio(); // Created once
    return () => {
      audioRef.current.pause();
      audioRef.current.src = '';
    };
  }, []);
  
  return audioRef;
}
```

### Register and Clean Up Audio Event Listeners Correctly

❌ **WRONG:**
```javascript
useEffect(() => {
  audio.addEventListener('timeupdate', handleTimeUpdate);
  // Missing cleanup!
});
```

✅ **CORRECT:**
```javascript
useEffect(() => {
  const audio = audioRef.current;
  
  const handleTimeUpdate = () => {
    dispatch({ type: 'TIME_UPDATE', currentTime: audio.currentTime });
  };
  
  audio.addEventListener('timeupdate', handleTimeUpdate);
  
  return () => {
    audio.removeEventListener('timeupdate', handleTimeUpdate);
  };
}, [dispatch]);
```

**Critical listeners:**
- `timeupdate` - Update seek bar position
- `canplay` - Track loaded and ready
- `ended` - Track finished, advance to next
- `error` - Handle load/playback failures
- `loadstart`, `loadedmetadata` - Optional loading states

### Keep UI Components Presentation-Focused

**Separation of concerns:**

✅ **Container components:** Connect to context, handle events
```javascript
function NowPlayingBar() {
  const { state, audioEngine } = usePlayer();
  
  return (
    <div className="now-playing-bar">
      <TrackInfo track={state.currentTrack} />
      <PlaybackControls 
        status={state.status}
        onPlay={audioEngine.play}
        onPause={audioEngine.pause}
      />
      <SeekBar 
        currentTime={state.currentTime}
        duration={state.duration}
        onSeek={audioEngine.seek}
      />
    </div>
  );
}
```

✅ **Presentational components:** Receive props, render UI
```javascript
function PlaybackControls({ status, onPlay, onPause }) {
  return (
    <div className="controls">
      {status === 'playing' ? (
        <button onClick={onPause} aria-label="Pause">
          ⏸
        </button>
      ) : (
        <button onClick={onPlay} aria-label="Play">
          ▶
        </button>
      )}
    </div>
  );
}
```

### Avoid Duplicated Playback State

❌ **WRONG:** Storing audio state in multiple places
```javascript
const [isPlaying, setIsPlaying] = useState(false); // Duplicate!
const [currentTime, setCurrentTime] = useState(0); // Duplicate!
// Context already has this state!
```

✅ **CORRECT:** Single source of truth in Context
```javascript
const { state } = usePlayer();
// Use state.status, state.currentTime directly
```

**Rule:** Audio element state flows one way:
1. Audio events fire → 
2. Dispatch actions to reducer → 
3. Context state updates → 
4. Components re-render

---

## Validation

### Run Tests

```bash
npm test
```

**Test coverage checklist:**
- ✅ Reducer action handlers (unit tests)
- ✅ Audio engine hook behavior (unit + property tests)
- ✅ Playlist manager CRUD (unit + property tests)
- ✅ Component rendering (@testing-library/react)
- ✅ Utility functions (formatDuration, filterTracks, queueUtils)
- ✅ localStorage persistence round-trip
- ✅ Property-based tests with fast-check for invariants

### Run Production Build

```bash
npm run build
```

**Build validation:**
- ✅ No TypeScript/ESLint errors
- ✅ All imports resolve
- ✅ CSS bundles correctly
- ✅ Audio assets accessible in dist/
- ✅ Output size reasonable (<500KB JS)

### Verify Play/Pause, Seek, Volume, Previous, Next, and Playlists

**Manual verification checklist:**

**Playback:**
- ✅ Click play → audio starts
- ✅ Click pause → audio pauses at current position
- ✅ Resume → continues from paused position
- ✅ Track switch → new track loads and plays from 0:00

**Seek:**
- ✅ Drag seek bar → playback jumps to new position
- ✅ Click seek bar → playback jumps to clicked position
- ✅ Seek while paused → stays paused at new position
- ✅ Seek beyond duration → clamps to end

**Volume:**
- ✅ Drag volume slider → audio volume changes immediately
- ✅ Set to 0 → audio muted
- ✅ Set to 1 → audio at maximum
- ✅ Refresh page → volume persists

**Previous/Next:**
- ✅ Click next → loads and plays next track
- ✅ Click previous → loads and plays previous track
- ✅ Next at end of queue → stops playback
- ✅ Previous at start of queue → stops playback

**Playlists:**
- ✅ Create playlist → appears in sidebar
- ✅ Add track to playlist → track appears in playlist
- ✅ Remove track from playlist → track removed
- ✅ Delete playlist → playlist removed
- ✅ Play playlist → queue populates and first track plays
- ✅ Refresh page → playlists persist

**Error handling:**
- ✅ Invalid audio URL → error message displays
- ✅ Network failure → error message displays
- ✅ Dismiss error → error banner clears

---

## Common Pitfalls

### 1. Stale Closures in Event Handlers

❌ **WRONG:**
```javascript
useEffect(() => {
  audio.addEventListener('ended', () => {
    // state is stale here!
    if (state.queue.length > 0) {
      loadNextTrack();
    }
  });
}, []); // state not in dependency array
```

✅ **CORRECT:**
```javascript
const stateRef = useRef(state);
stateRef.current = state; // Update on every render

useEffect(() => {
  audio.addEventListener('ended', () => {
    // Always fresh state
    const currentQueue = stateRef.current.queue;
    if (currentQueue.length > 0) {
      loadNextTrack();
    }
  });
}, []);
```

### 2. Not Debouncing Play/Pause

Rapid toggling causes audio glitching. Always debounce with 50ms window.

### 3. Forgetting to Clean Up Audio on Unmount

Memory leaks and continued playback after component unmounts.

### 4. Not Clamping Seek/Volume

User input or corrupted state can send invalid values to Audio API.

### 5. Creating Multiple Audio Instances

Use a single Audio element for the entire app lifecycle.

---

## Architecture Summary

```
┌─────────────────────────────────────────────────────┐
│                      App                            │
│  ┌───────────────────────────────────────────────┐ │
│  │          PlayerProvider (Context)             │ │
│  │  ┌────────────────────────────────────────┐  │ │
│  │  │  useReducer(playerReducer)             │  │ │
│  │  │  state: { track, status, time, vol }   │  │ │
│  │  └────────────────────────────────────────┘  │ │
│  │  ┌────────────────────────────────────────┐  │ │
│  │  │  useAudioEngine(dispatch)              │  │ │
│  │  │  - owns Audio element (ref)            │  │ │
│  │  │  - registers event listeners           │  │ │
│  │  │  - exposes: play, pause, seek, etc     │  │ │
│  │  └────────────────────────────────────────┘  │ │
│  │  ┌────────────────────────────────────────┐  │ │
│  │  │  usePlaylistManager()                  │  │ │
│  │  │  - CRUD operations                     │  │ │
│  │  │  - localStorage sync                   │  │ │
│  │  └────────────────────────────────────────┘  │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────┐ │
│  │  Sidebar    │  │ MainContent  │  │ NowPlaying│ │
│  │ (Playlists) │  │ (TrackList)  │  │   Bar     │ │
│  └─────────────┘  └──────────────┘  └───────────┘ │
└─────────────────────────────────────────────────────┘
```

**Data flow:**
1. User interaction → Component calls audioEngine method
2. audioEngine updates Audio element → Audio event fires
3. Event listener dispatches action → Reducer updates state
4. Context value changes → Components re-render

---

## License

MIT - Free to use, modify, and distribute with attribution.

---

**Author:** Praveen Raj Thulasi S  
**Version:** 1.0.0  
**Keywords:** react audio, music player, html5 audio, playlist, playback controls
