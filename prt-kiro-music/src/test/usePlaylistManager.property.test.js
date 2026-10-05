// Feature: echobox-music, Property 12: Playlist creation round-trip
// Feature: echobox-music, Property 13: Duplicate playlist name rejection (case-insensitive)
// Feature: echobox-music, Property 14: Whitespace playlist name rejection
// Feature: echobox-music, Property 15: Track append goes to end of playlist
// Feature: echobox-music, Property 16: Duplicate track in playlist is rejected
// Feature: echobox-music, Property 17: Track removal is correct
// Feature: echobox-music, Property 18: Playlist populates queue in order

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import fc from 'fast-check';
import { usePlaylistManager } from '../hooks/usePlaylistManager.js';
import { populateQueueFromPlaylist } from '../utils/queueUtils.js';

// ---------------------------------------------------------------------------
// localStorage mock
// ---------------------------------------------------------------------------

function createLocalStorageMock() {
  let store = {};
  const mock = {
    getItem: vi.fn((key) =>
      Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null
    ),
    setItem: vi.fn((key, value) => {
      store[key] = String(value);
    }),
    removeItem: vi.fn((key) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((idx) => Object.keys(store)[idx] ?? null),
  };
  return {
    mock,
    reset: () => {
      store = {};
      mock.getItem.mockClear();
      mock.setItem.mockClear();
      mock.removeItem.mockClear();
      mock.clear.mockClear();
    },
  };
}

const lsMock = createLocalStorageMock();

beforeEach(() => {
  lsMock.reset();
  vi.stubGlobal('localStorage', lsMock.mock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/** A non-blank, printable playlist name (no leading/trailing whitespace issues). */
const validPlaylistNameArb = fc
  .string({ minLength: 1, maxLength: 50 })
  .filter((s) => s.trim().length > 0);

/** A valid track object with all required fields. */
const validTrackArb = fc.record({
  id: fc.uuid(),
  title: fc
    .string({ minLength: 1, maxLength: 40 })
    .filter((s) => s.trim().length > 0),
  artist: fc
    .string({ minLength: 1, maxLength: 40 })
    .filter((s) => s.trim().length > 0),
  album: fc.string({ maxLength: 40 }),
  duration: fc.integer({ min: 1, max: 3600 }),
  src: fc.constantFrom(
    '/audio/track01.mp3',
    '/audio/track02.wav',
    '/audio/other.mp3'
  ),
});

/** A whitespace-only string (at least one space/tab/newline, no non-whitespace). */
const whitespaceOnlyArb = fc
  .string({ minLength: 1, maxLength: 20 })
  .filter((s) => s.trim().length === 0 && s.length > 0);

/** Whitespace or empty string — both should be rejected by `create`. */
const blankNameArb = fc.oneof(fc.constant(''), whitespaceOnlyArb);

// ---------------------------------------------------------------------------
// Property 12: Playlist creation round-trip
// Validates: Requirements 9.1
// ---------------------------------------------------------------------------

describe('Property 12: Playlist creation round-trip', () => {
  it('creates a playlist with the given name, empty tracks, and persists to localStorage', () => {
    // Feature: echobox-music, Property 12: Playlist creation round-trip
    fc.assert(
      fc.property(validPlaylistNameArb, (name) => {
        lsMock.reset();

        const { result } = renderHook(() => usePlaylistManager());

        let error;
        act(() => {
          error = result.current.create(name);
        });

        // create returns null on success
        expect(error).toBeNull();

        const { playlists } = result.current;

        // Exactly one playlist in state
        expect(playlists).toHaveLength(1);

        // Name matches the trimmed input
        expect(playlists[0].name).toBe(name.trim());

        // Tracks array starts empty
        expect(playlists[0].tracks).toEqual([]);

        // localStorage was written
        expect(lsMock.mock.setItem).toHaveBeenCalled();
        const stored = JSON.parse(
          lsMock.mock.setItem.mock.calls[lsMock.mock.setItem.mock.calls.length - 1][1]
        );
        expect(stored).toHaveLength(1);
        expect(stored[0].name).toBe(name.trim());
        expect(stored[0].tracks).toEqual([]);
      }),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 13: Duplicate playlist name rejection (case-insensitive)
// Validates: Requirements 9.2
// ---------------------------------------------------------------------------

describe('Property 13: Duplicate playlist name rejection (case-insensitive)', () => {
  it('rejects a second playlist when its name matches an existing name case-insensitively', () => {
    // Feature: echobox-music, Property 13: Duplicate playlist name rejection (case-insensitive)
    fc.assert(
      fc.property(
        validPlaylistNameArb,
        // Generate a case variant: randomly upper/lower each character
        fc.integer({ min: 0, max: 1000 }), // seed for variation
        (name, _seed) => {
          lsMock.reset();

          const { result } = renderHook(() => usePlaylistManager());

          // Create the first playlist
          act(() => {
            result.current.create(name);
          });

          const countBefore = result.current.playlists.length;

          // Attempt to create a duplicate using the same trimmed name
          // (covers exact match — the simplest case)
          let duplicateError;
          act(() => {
            duplicateError = result.current.create(name.trim());
          });

          // Should return a non-null error string
          expect(duplicateError).not.toBeNull();
          expect(typeof duplicateError).toBe('string');

          // Playlists array must remain unchanged
          expect(result.current.playlists).toHaveLength(countBefore);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('rejects a playlist name that differs only in case from an existing name', () => {
    // Feature: echobox-music, Property 13: Duplicate playlist name rejection (case-insensitive)
    fc.assert(
      fc.property(
        // Only alphabetic names so toUpperCase/toLowerCase produce a predictable variant
        fc
          .string({ minLength: 1, maxLength: 20 })
          .filter((s) => /^[a-zA-Z]+$/.test(s)),
        (name) => {
          lsMock.reset();

          const { result } = renderHook(() => usePlaylistManager());

          const lower = name.toLowerCase();
          const upper = name.toUpperCase();

          // Create the lowercase variant first
          act(() => {
            result.current.create(lower);
          });

          const countBefore = result.current.playlists.length;

          // Try to create the uppercase variant — should be rejected
          let duplicateError;
          act(() => {
            duplicateError = result.current.create(upper);
          });

          expect(duplicateError).not.toBeNull();
          expect(result.current.playlists).toHaveLength(countBefore);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 14: Whitespace playlist name rejection
// Validates: Requirements 9.3
// ---------------------------------------------------------------------------

describe('Property 14: Whitespace playlist name rejection', () => {
  it('rejects blank and whitespace-only names without modifying playlists', () => {
    // Feature: echobox-music, Property 14: Whitespace playlist name rejection
    fc.assert(
      fc.property(blankNameArb, (blankName) => {
        lsMock.reset();

        const { result } = renderHook(() => usePlaylistManager());

        const countBefore = result.current.playlists.length;

        let error;
        act(() => {
          error = result.current.create(blankName);
        });

        // Must return a non-null error string
        expect(error).not.toBeNull();
        expect(typeof error).toBe('string');

        // Playlists array must remain unchanged
        expect(result.current.playlists).toHaveLength(countBefore);

        // localStorage must NOT have been written for this rejection
        expect(lsMock.mock.setItem).not.toHaveBeenCalled();
      }),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 15: Track append goes to end of playlist
// Validates: Requirements 10.1
// ---------------------------------------------------------------------------

describe('Property 15: Track append goes to end of playlist', () => {
  it('appends a new track at the last index and increments track count by 1', () => {
    // Feature: echobox-music, Property 15: Track append goes to end of playlist
    fc.assert(
      fc.property(
        validPlaylistNameArb,
        fc.array(validTrackArb, { maxLength: 8 }),
        validTrackArb,
        (name, existingTracks, newTrack) => {
          // Ensure newTrack.id doesn't collide with any existing track id
          const uniqueNewTrack = {
            ...newTrack,
            id: `new-track-${newTrack.id}`,
          };
          // Also ensure existing tracks have unique ids
          const deduped = existingTracks.filter(
            (t, idx, arr) =>
              arr.findIndex((x) => x.id === t.id) === idx &&
              t.id !== uniqueNewTrack.id
          );

          lsMock.reset();

          const { result } = renderHook(() => usePlaylistManager());

          // Create the playlist
          act(() => {
            result.current.create(name);
          });

          const playlistId = result.current.playlists[0].id;

          // Add the pre-existing tracks one by one
          for (const track of deduped) {
            act(() => {
              result.current.addTrack(playlistId, track);
            });
          }

          const kBefore = result.current.playlists[0].tracks.length;

          // Add the new track
          let addError;
          act(() => {
            addError = result.current.addTrack(playlistId, uniqueNewTrack);
          });

          expect(addError).toBeNull();

          const { tracks } = result.current.playlists[0];

          // Track count increased by exactly 1
          expect(tracks).toHaveLength(kBefore + 1);

          // New track is at the last position
          expect(tracks[tracks.length - 1].id).toBe(uniqueNewTrack.id);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 16: Duplicate track in playlist is rejected
// Validates: Requirements 10.2
// ---------------------------------------------------------------------------

describe('Property 16: Duplicate track in playlist is rejected', () => {
  it('rejects adding a track whose id already exists in the playlist', () => {
    // Feature: echobox-music, Property 16: Duplicate track in playlist is rejected
    fc.assert(
      fc.property(validPlaylistNameArb, validTrackArb, (name, track) => {
        lsMock.reset();

        const { result } = renderHook(() => usePlaylistManager());

        // Create the playlist and add the track once
        act(() => {
          result.current.create(name);
        });

        const playlistId = result.current.playlists[0].id;

        act(() => {
          result.current.addTrack(playlistId, track);
        });

        const countBefore = result.current.playlists[0].tracks.length;

        // Try to add the same track again
        let duplicateError;
        act(() => {
          duplicateError = result.current.addTrack(playlistId, track);
        });

        // Must return a non-null error string
        expect(duplicateError).not.toBeNull();
        expect(typeof duplicateError).toBe('string');

        // Track count must remain unchanged
        expect(result.current.playlists[0].tracks).toHaveLength(countBefore);
      }),
      { numRuns: 100 }
    );
  });

  it('also rejects a track object with the same id but different metadata', () => {
    // Feature: echobox-music, Property 16: Duplicate track in playlist is rejected
    fc.assert(
      fc.property(validPlaylistNameArb, validTrackArb, (name, track) => {
        lsMock.reset();

        const { result } = renderHook(() => usePlaylistManager());

        act(() => {
          result.current.create(name);
        });

        const playlistId = result.current.playlists[0].id;

        act(() => {
          result.current.addTrack(playlistId, track);
        });

        const countBefore = result.current.playlists[0].tracks.length;

        // Same id, different title — still a duplicate by id
        const sameIdDifferentMeta = { ...track, title: `${track.title} (remix)` };

        let error;
        act(() => {
          error = result.current.addTrack(playlistId, sameIdDifferentMeta);
        });

        expect(error).not.toBeNull();
        expect(result.current.playlists[0].tracks).toHaveLength(countBefore);
      }),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 17: Track removal is correct
// Validates: Requirements 11.1
// ---------------------------------------------------------------------------

describe('Property 17: Track removal is correct', () => {
  it('removes the specified track, reduces count by 1, and leaves no track with that id', () => {
    // Feature: echobox-music, Property 17: Track removal is correct
    fc.assert(
      fc.property(
        validPlaylistNameArb,
        fc.array(validTrackArb, { minLength: 1, maxLength: 8 }),
        fc.integer({ min: 0 }),
        (name, tracks, pickSeed) => {
          // De-duplicate tracks by id
          const deduped = tracks.filter(
            (t, idx, arr) => arr.findIndex((x) => x.id === t.id) === idx
          );
          if (deduped.length === 0) return; // skip if nothing left after dedup

          lsMock.reset();

          const { result } = renderHook(() => usePlaylistManager());

          act(() => {
            result.current.create(name);
          });

          const playlistId = result.current.playlists[0].id;

          for (const track of deduped) {
            act(() => {
              result.current.addTrack(playlistId, track);
            });
          }

          const kBefore = result.current.playlists[0].tracks.length;
          // Pick a track to remove
          const targetTrack = deduped[pickSeed % deduped.length];

          let removeError;
          act(() => {
            removeError = result.current.removeTrack(playlistId, targetTrack.id);
          });

          expect(removeError).toBeNull();

          const { tracks: remaining } = result.current.playlists[0];

          // Count reduced by exactly 1
          expect(remaining).toHaveLength(kBefore - 1);

          // No track with the removed id remains
          const stillPresent = remaining.some((t) => t.id === targetTrack.id);
          expect(stillPresent).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 18: Playlist populates queue in order
// Validates: Requirements 12.1
//
// Tests the pure `populateQueueFromPlaylist` function directly.
// ---------------------------------------------------------------------------

describe('Property 18: Playlist populates queue in order', () => {
  it('produces a queue with tracks in the same order and currentIndex === 0', () => {
    // Feature: echobox-music, Property 18: Playlist populates queue in order
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          name: validPlaylistNameArb,
          tracks: fc.array(validTrackArb, { minLength: 1, maxLength: 20 }),
        }),
        (playlist) => {
          const queue = populateQueueFromPlaylist(playlist);

          // currentIndex must be 0 (start of queue)
          expect(queue.currentIndex).toBe(0);

          // sourceId must match the playlist's id
          expect(queue.sourceId).toBe(playlist.id);

          // Tracks must be in the same order as the playlist's tracks
          expect(queue.tracks).toHaveLength(playlist.tracks.length);
          for (let i = 0; i < playlist.tracks.length; i++) {
            expect(queue.tracks[i]).toBe(playlist.tracks[i]);
          }
        }
      ),
      { numRuns: 200 }
    );
  });
});
