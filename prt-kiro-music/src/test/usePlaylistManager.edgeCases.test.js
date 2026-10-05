import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePlaylistManager } from '../hooks/usePlaylistManager.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Builds a minimal valid track object. */
function makeTrack(id = 'track-01') {
  return {
    id,
    title: 'Test Track',
    artist: 'Test Artist',
    album: 'Test Album',
    duration: 180,
    src: `/audio/${id}.mp3`,
  };
}

/** Builds a serialized localStorage value containing one playlist. */
function onePlaylistJson(playlistId = 'pl-001', name = 'My Playlist', tracks = []) {
  return JSON.stringify([{ id: playlistId, name, tracks }]);
}

/**
 * Creates a minimal localStorage mock.
 *
 * @param {{ getItemValue?: string | null, setItemShouldThrow?: boolean }} opts
 */
function makeLocalStorageMock({ getItemValue = null, setItemShouldThrow = false } = {}) {
  const store = {};

  return {
    getItem: vi.fn((key) => {
      if (getItemValue !== undefined) return getItemValue;
      return store[key] ?? null;
    }),
    setItem: vi.fn((key, value) => {
      if (setItemShouldThrow) throw new Error('QuotaExceededError: storage full');
      store[key] = value;
    }),
    removeItem: vi.fn((key) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach((k) => delete store[k]);
    }),
  };
}

// ---------------------------------------------------------------------------
// Test suites
// ---------------------------------------------------------------------------

describe('usePlaylistManager — localStorage failure and edge cases', () => {
  let originalLocalStorage;

  beforeEach(() => {
    // Save original localStorage reference before each test
    originalLocalStorage = global.localStorage;
  });

  afterEach(() => {
    // Restore original localStorage after each test
    vi.stubGlobal('localStorage', originalLocalStorage);
    vi.restoreAllMocks();
  });

  // -------------------------------------------------------------------------
  // Req 14.3 — missing localStorage data → empty init, no error
  // -------------------------------------------------------------------------
  describe('missing localStorage data', () => {
    it('initializes with empty playlists when localStorage has no entry (getItem returns null)', () => {
      vi.stubGlobal(
        'localStorage',
        makeLocalStorageMock({ getItemValue: null })
      );

      const { result } = renderHook(() => usePlaylistManager());

      expect(result.current.playlists).toEqual([]);
      expect(result.error).toBeUndefined();
    });
  });

  // -------------------------------------------------------------------------
  // Req 14.4 — corrupt JSON → empty init + one-time console.warn
  // -------------------------------------------------------------------------
  describe('corrupt JSON in localStorage', () => {
    it('initializes with empty playlists and emits a one-time console.warn when JSON is invalid', () => {
      vi.stubGlobal(
        'localStorage',
        makeLocalStorageMock({ getItemValue: '{{invalid json' })
      );

      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const { result } = renderHook(() => usePlaylistManager());

      expect(result.current.playlists).toEqual([]);
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy.mock.calls[0][0]).toMatch(/could not be parsed/i);

      warnSpy.mockRestore();
    });
  });

  // -------------------------------------------------------------------------
  // Req 9.4 — localStorage write failure on `create` → state unchanged, error returned
  // -------------------------------------------------------------------------
  describe('localStorage write failure on create', () => {
    it('returns an error string and leaves playlists unchanged when setItem throws', () => {
      // Start with one valid playlist in storage
      const initialJson = onePlaylistJson('pl-001', 'Existing Playlist');

      // getItem always returns the initial data; setItem always throws
      const mockStorage = {
        getItem: vi.fn(() => initialJson),
        setItem: vi.fn(() => {
          throw new Error('QuotaExceededError');
        }),
        removeItem: vi.fn(),
        clear: vi.fn(),
      };
      vi.stubGlobal('localStorage', mockStorage);

      const { result } = renderHook(() => usePlaylistManager());

      // Verify initial state loaded correctly
      expect(result.current.playlists).toHaveLength(1);
      expect(result.current.playlists[0].name).toBe('Existing Playlist');

      let error;
      act(() => {
        error = result.current.create('New Playlist');
      });

      // Should return a non-null error string
      expect(error).not.toBeNull();
      expect(typeof error).toBe('string');

      // In-memory playlists must remain unchanged — no new playlist added
      expect(result.current.playlists).toHaveLength(1);
      expect(result.current.playlists[0].name).toBe('Existing Playlist');
    });
  });

  // -------------------------------------------------------------------------
  // Req 10.3 — localStorage write failure on `addTrack` → append rolled back
  // -------------------------------------------------------------------------
  describe('localStorage write failure on addTrack', () => {
    it('returns an error string and leaves playlist tracks unchanged when setItem throws', () => {
      const playlistId = 'pl-001';
      const initialJson = onePlaylistJson(playlistId, 'My Playlist', []);

      let callCount = 0;
      const mockStorage = {
        getItem: vi.fn(() => initialJson),
        setItem: vi.fn(() => {
          callCount += 1;
          throw new Error('QuotaExceededError');
        }),
        removeItem: vi.fn(),
        clear: vi.fn(),
      };
      vi.stubGlobal('localStorage', mockStorage);

      const { result } = renderHook(() => usePlaylistManager());

      expect(result.current.playlists[0].tracks).toHaveLength(0);

      let error;
      act(() => {
        error = result.current.addTrack(playlistId, makeTrack('track-01'));
      });

      // Should return a non-null error string
      expect(error).not.toBeNull();
      expect(typeof error).toBe('string');

      // Track must NOT have been appended — rollback via write-then-set
      expect(result.current.playlists[0].tracks).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------------------
  // Req 14.7 — localStorage write failure on `removeTrack` → removal rolled back
  // -------------------------------------------------------------------------
  describe('localStorage write failure on removeTrack', () => {
    it('returns an error string and leaves the track in the playlist when setItem throws', () => {
      const playlistId = 'pl-001';
      const track = makeTrack('track-01');
      const initialJson = onePlaylistJson(playlistId, 'My Playlist', [track]);

      const mockStorage = {
        getItem: vi.fn(() => initialJson),
        setItem: vi.fn(() => {
          throw new Error('QuotaExceededError');
        }),
        removeItem: vi.fn(),
        clear: vi.fn(),
      };
      vi.stubGlobal('localStorage', mockStorage);

      const { result } = renderHook(() => usePlaylistManager());

      // Confirm track is present at start
      expect(result.current.playlists[0].tracks).toHaveLength(1);

      let error;
      act(() => {
        error = result.current.removeTrack(playlistId, track.id);
      });

      // Should return a non-null error string
      expect(error).not.toBeNull();
      expect(typeof error).toBe('string');

      // Track must still be present — removal was rolled back
      expect(result.current.playlists[0].tracks).toHaveLength(1);
      expect(result.current.playlists[0].tracks[0].id).toBe(track.id);
    });
  });

  // -------------------------------------------------------------------------
  // Req 10.4 — addTrack with non-existent playlist ID → rejected with error
  // -------------------------------------------------------------------------
  describe('addTrack with non-existent playlist ID', () => {
    it('returns an error string without modifying state when playlist ID does not exist', () => {
      vi.stubGlobal(
        'localStorage',
        makeLocalStorageMock({ getItemValue: onePlaylistJson('pl-001', 'Real Playlist') })
      );

      const { result } = renderHook(() => usePlaylistManager());

      let error;
      act(() => {
        error = result.current.addTrack('nonexistent-id', makeTrack('track-01'));
      });

      expect(error).not.toBeNull();
      expect(typeof error).toBe('string');

      // Existing playlist must be untouched
      expect(result.current.playlists).toHaveLength(1);
      expect(result.current.playlists[0].tracks).toHaveLength(0);
    });
  });
});
