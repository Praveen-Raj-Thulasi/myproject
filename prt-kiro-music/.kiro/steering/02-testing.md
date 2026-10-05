---
inclusion: always
---

# EchoBox Music: Testing Strategy and Correctness Properties

## Testing Framework and Setup

**Stack:** Vitest + @testing-library/react + fast-check (property-based testing)

**Configuration:** \ite.config.js\
\\\javascript
test: {
  environment: 'jsdom',
  globals: true,
  setupFiles: './src/test/setup.js'
}
\\\

**Test setup:** \src/test/setup.js\ imports \@testing-library/jest-dom\

**Commands:**
- Run all tests once: \
pm test\ (which calls \itest run\)
- Never use watch mode for CI or final verification

---

## Testing Layers

### 1. Unit Tests: Reducer (playerReducer.test.js)

Test each action type with state snapshots:
- \LOAD_TRACK\ resets \currentTime\ to 0, sets \status='loading'\
- \PLAY\ / \PAUSE\ set status correctly
- \SET_ERROR\ sets error field; \CLEAR_ERROR\ clears it
- \TRACK_ENDED\ resets state; \QUEUE_EXHAUSTED\ clears track and resets

### 2. Utility Unit Tests

**formatDuration.js:**
- Test zero → "0:00"
- Test 3661 → "61:01" (minutes + seconds)
- Test large values with correct zero-padding

**filterTracks.js:**
- Test substring matching (case-insensitive)
- Test empty query returns full catalog
- Test whitespace-only query returns full catalog
- Test no results returns empty array

**queueUtils.js:**
- Test \
extTrack\ returns next index or null at boundary
- Test \previousTrack\ returns previous index or null at boundary
- Test \clampSeek\ clamps to [0, duration], handles NaN/Infinity
- Test \seekPercent\ returns percentage or 0 for invalid duration
- Test \populateQueueFromPlaylist\ returns correct queue shape

**storageUtils.js:**
- Test \eadPersistedVolume\ returns valid volume or 1
- Test \parsePersistedVolume\ handles null, non-numeric, out-of-range
- Test \loadPlaylistsFromStorage\ filters incomplete entries
- Test \serializePlaylists\ / \deserializePlaylists\ round-trip

### 3. Component Unit Tests (@testing-library/react)

**NowPlayingBar components:**
- \TrackInfo\ shows title+artist when track loaded; shows placeholder when null
- \SeekBar\ disabled when no track; interactive when track loaded
- \PlaybackControls\ play button disabled during \status='loading'\
- Error banner displays \state.error\ and dismiss button

**MainContent components:**
- \TrackList\ renders all tracks from catalog
- Empty catalog shows "No tracks available"
- \SearchBar\ filters reactively (no form submit needed)
- No results shows "No results found"
- \TrackItem\ shows title, artist, duration; highlights when active

**Sidebar components:**
- \PlaylistItem\ displays name, track count, play/delete buttons
- Delete button triggers confirmation prompt
- \CreatePlaylistForm\ shows validation errors inline
- \PlaylistList\ renders all playlists

### 4. Hook Unit Tests

**useAudioEngine:**
- Test \loadTrack\ sets src, calls load(), dispatches SET_STATUS='loading'
- Test rapid play/pause only last action fires (debounce)
- Test track switch resets currentTime to 0
- Test audio error events dispatch SET_ERROR with human-readable message
- Test \skipNext\/\skipPrevious\ advance/retreat queue correctly

**usePlaylistManager:**
- Test \create\ validates non-blank name
- Test \create\ rejects duplicate names (case-insensitive)
- Test \ddTrack\ rejects duplicates
- Test \emoveTrack\ removes and persists
- Test localStorage write failure rolls back in-memory state

---

## Property-Based Testing (fast-check)

Property tests are executable specifications. Each test carries a tag comment: \// Feature: echobox-music, Property N: <title>\

### Property Index

**P1: Duration formatting correctness**
- Validates: Requirements 1.2, 4.5
- Generator: \c.integer({ min: 0, max: 86399 })\
- Invariant: formatted output matches "M+:SS" pattern with zero-padded seconds
- 200 iterations

**P2: Search filter containment**
- Validates: Requirements 2.1
- Generator: \c.array(track objects), fc.string\
- Invariant: all returned tracks contain query string in title or artist (case-insensitive)
- 100 iterations

**P3: Empty/whitespace search returns full catalog**
- Validates: Requirements 2.2, 2.5
- Generator: \c.string\ (whitespace-heavy), track array
- Invariant: empty or whitespace query always returns unfiltered catalog
- 50 iterations

**P5: Track switch resets position and preserves playback mode**
- Validates: Requirements 3.4, 16.1, 16.2
- Generator: mock audio, state with current track, new track
- Invariant: \currentTime === 0\ after switch; status reflects pre-switch playback intent
- 100 iterations

**P6: Final action wins under rapid play/pause**
- Validates: Requirements 3.6, 16.3
- Generator: sequence of play/pause commands within 50ms debounce window
- Invariant: only the final command executes; intermediate calls discarded
- 50 iterations

**P7: Seek percentage always in range**
- Validates: Requirements 4.1
- Generator: \c.float\ for currentTime/duration
- Invariant: \seekPercent(t, d)\ returns value in [0, 100]
- 200 iterations

**P8: Seek clamp always produces valid position**
- Validates: Requirements 4.3
- Generator: \c.float\ for target and duration; edge cases NaN, Infinity, negative
- Invariant: \clampSeek(target, duration)\ returns value in [0, duration]
- 200 iterations

**P9: Volume persistence round-trip**
- Validates: Requirements 5.3, 5.5
- Generator: \c.float({ min: 0, max: 1 })\
- Invariant: write then read volume from localStorage returns same value
- 100 iterations

**P10: Invalid persisted volume defaults to 1**
- Validates: Requirements 5.4
- Generator: invalid volume values (null, NaN, out-of-range, non-numeric)
- Invariant: \parsePersistedVolume\ always returns 1 for invalid input
- 50 iterations

**P11: Queue navigation correctness and boundary behavior**
- Validates: Requirements 6.1–6.5
- Generator: queue with tracks, current index
- Invariant: \
extTrack\/\previousTrack\ return correct index or null at boundaries
- 100 iterations

**P12–P18: Playlist CRUD operations**
- **P12: Playlist creation round-trip** — Req 9.1
- **P13: Duplicate playlist name rejection (case-insensitive)** — Req 9.2
- **P14: Whitespace playlist name rejection** — Req 9.3
- **P15: Track append goes to end of playlist** — Req 10.1
- **P16: Duplicate track in playlist is rejected** — Req 10.2
- **P17: Track removal is correct** — Req 11.1
- **P18: Playlist populates queue in order** — Req 12.1
- Generators: \c.string\, \c.uuid\, \c.array\ with track/playlist shapes
- 100 iterations each

**P19: localStorage playlist serialization round-trip**
- Validates: Requirements 14.1, 14.2
- Generator: \c.array\ of playlist objects
- Invariant: serialize → write → read → deserialize returns equivalent structure
- 100 iterations

**P20: Partial-validity parsing filters only invalid entries**
- Validates: Requirements 14.5, 14.6
- Generator: \c.array\ with some valid and some invalid playlist/track entries
- Invariant: all valid entries present in output; invalid entries filtered
- 50 iterations

---

## Test Organization and Files

| File | Purpose |
|------|---------|
| \src/context/playerReducer.test.js\ | Reducer action unit tests |
| \src/utils/formatDuration.test.js\ | Duration formatting (unit + property P1) |
| \src/utils/filterTracks.test.js\ | Search filtering (unit + properties P2, P3) |
| \src/utils/queueUtils.test.js\ | Queue helpers (unit + properties P7, P8, P11) |
| \src/utils/storageUtils.test.js\ | Storage utilities (unit + properties P9, P10, P19, P20) |
| \src/hooks/useAudioEngine.test.js\ | Audio engine (unit + properties P5, P6) |
| \src/hooks/usePlaylistManager.test.js\ | Playlist CRUD (unit + properties P12–P18) |
| \src/components/NowPlayingBar/*.test.jsx\ | NowPlayingBar components |
| \src/components/MainContent/*.test.jsx\ | MainContent components |
| \src/components/Sidebar/*.test.jsx\ | Sidebar components |
| \src/test/App.snapshot.test.jsx\ | App smoke test + responsive layout check |

---

## Correctness: What We Verify

Each property test has a corresponding requirement. Together, they provide evidence that the implementation satisfies the spec. If a property fails, the implementation violates a requirement.

**Example:** If P6 (debounced play/pause) fails, then Requirement 3.6 is not satisfied: "IF the Audio_Engine receives rapid successive play/pause actions, THE Audio_Engine SHALL process only the final action."

---
