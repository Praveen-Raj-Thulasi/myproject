import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fc from 'fast-check';
import {
  parsePersistedVolume,
  readPersistedVolume,
  writePersistedVolume,
  serializePlaylists,
  deserializePlaylists,
} from './storageUtils.js';

// ---------------------------------------------------------------------------
// localStorage mock helpers
// ---------------------------------------------------------------------------

/**
 * Creates an isolated in-memory localStorage mock.
 * Returns { mock, install, uninstall } so each test gets a fresh store.
 */
function createLocalStorageMock() {
  let store = {};
  const mock = {
    getItem: vi.fn((key) => (Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null)),
    setItem: vi.fn((key, value) => { store[key] = String(value); }),
    removeItem: vi.fn((key) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
    get length() { return Object.keys(store).length; },
    key: vi.fn((idx) => Object.keys(store)[idx] ?? null),
  };
  return {
    mock,
    reset: () => { store = {}; mock.getItem.mockClear(); mock.setItem.mockClear(); },
  };
}

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/**
 * A valid track arbitrary — all required fields present with non-empty strings.
 */
const validTrackArb = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 40 }).filter((s) => s.trim().length > 0),
  artist: fc.string({ minLength: 1, maxLength: 40 }).filter((s) => s.trim().length > 0),
  album: fc.string({ maxLength: 40 }),
  duration: fc.integer({ min: 1, max: 3600 }),
  src: fc.constantFrom('/audio/track01.mp3', '/audio/track02.wav', '/audio/other.mp3'),
});

/**
 * A valid playlist arbitrary — non-empty name, array of valid tracks.
 */
const validPlaylistArb = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
  tracks: fc.array(validTrackArb, { maxLength: 10 }),
});

/**
 * An invalid playlist entry arbitrary — name is missing, null, empty, or non-string.
 */
const invalidPlaylistArb = fc.oneof(
  // missing name
  fc.record({ id: fc.uuid(), tracks: fc.array(validTrackArb, { maxLength: 5 }) }),
  // null name
  fc.record({ id: fc.uuid(), name: fc.constant(null), tracks: fc.constant([]) }),
  // empty string name
  fc.record({ id: fc.uuid(), name: fc.constant(''), tracks: fc.constant([]) }),
  // whitespace-only name
  fc.record({ id: fc.uuid(), name: fc.constant('   '), tracks: fc.constant([]) }),
  // numeric name
  fc.record({ id: fc.uuid(), name: fc.integer(), tracks: fc.constant([]) }),
);

/**
 * An invalid track arbitrary — missing at least one required field (title, artist, src).
 */
const invalidTrackArb = fc.oneof(
  // missing title
  fc.record({ id: fc.uuid(), artist: fc.string({ minLength: 1 }), src: fc.constant('/audio/x.mp3'), duration: fc.constant(60) }),
  // empty title
  fc.record({ id: fc.uuid(), title: fc.constant(''), artist: fc.string({ minLength: 1 }), src: fc.constant('/audio/x.mp3') }),
  // missing artist
  fc.record({ id: fc.uuid(), title: fc.string({ minLength: 1 }), src: fc.constant('/audio/x.mp3'), duration: fc.constant(60) }),
  // missing src
  fc.record({ id: fc.uuid(), title: fc.string({ minLength: 1 }), artist: fc.string({ minLength: 1 }), duration: fc.constant(60) }),
  // empty src
  fc.record({ id: fc.uuid(), title: fc.string({ minLength: 1 }), artist: fc.string({ minLength: 1 }), src: fc.constant('') }),
);

// ---------------------------------------------------------------------------
// Property 9: Volume persistence round-trip
// ---------------------------------------------------------------------------

describe('Property 9: Volume persistence round-trip', () => {
  // Feature: echobox-music, Property 9: Volume persistence round-trip
  const lsMock = createLocalStorageMock();

  beforeEach(() => {
    lsMock.reset();
    vi.stubGlobal('localStorage', lsMock.mock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('writePersistedVolume then readPersistedVolume returns the same value', () => {
    // Feature: echobox-music, Property 9: Volume persistence round-trip
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 1, noNaN: true }),
        (vol) => {
          lsMock.reset();
          const writeOk = writePersistedVolume(vol);
          expect(writeOk).toBe(true);
          const readBack = readPersistedVolume();
          // Floating-point round-trip via JSON.stringify/parse is exact for finite values
          expect(readBack).toBeCloseTo(vol, 10);
        }
      ),
      { numRuns: 200 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 10: Invalid persisted volume defaults to 1
// ---------------------------------------------------------------------------

describe('Property 10: Invalid persisted volume defaults to 1', () => {
  // Feature: echobox-music, Property 10: Invalid persisted volume defaults to 1

  it('returns 1 for null input', () => {
    expect(parsePersistedVolume(null)).toBe(1);
  });

  it('returns 1 for undefined input', () => {
    expect(parsePersistedVolume(undefined)).toBe(1);
  });

  it('returns 1 for NaN', () => {
    expect(parsePersistedVolume(NaN)).toBe(1);
  });

  it('returns 1 for Infinity', () => {
    expect(parsePersistedVolume(Infinity)).toBe(1);
  });

  it('returns 1 for -Infinity', () => {
    expect(parsePersistedVolume(-Infinity)).toBe(1);
  });

  it('returns 1 for non-numeric strings', () => {
    // Feature: echobox-music, Property 10: Invalid persisted volume defaults to 1
    fc.assert(
      fc.property(
        fc.string().filter((s) => isNaN(parseFloat(s))),
        (s) => {
          expect(parsePersistedVolume(s)).toBe(1);
        }
      ),
      { numRuns: 200 }
    );
  });

  it('returns 1 for numbers below 0', () => {
    // Feature: echobox-music, Property 10: Invalid persisted volume defaults to 1
    fc.assert(
      fc.property(
        fc.float({ max: -Number.EPSILON, noNaN: true }).filter(isFinite),
        (v) => {
          expect(parsePersistedVolume(v)).toBe(1);
        }
      ),
      { numRuns: 200 }
    );
  });

  it('returns 1 for numbers above 1', () => {
    // Feature: echobox-music, Property 10: Invalid persisted volume defaults to 1
    // fc.float works with 32-bit floats; use fc.double to generate finite values > 1
    fc.assert(
      fc.property(
        fc.double({ min: 1.0001, noNaN: true, noDefaultInfinity: true }).filter(isFinite),
        (v) => {
          expect(parsePersistedVolume(v)).toBe(1);
        }
      ),
      { numRuns: 200 }
    );
  });

  it('returns the value itself for valid inputs in [0, 1]', () => {
    // sanity-check: valid values are passed through unchanged
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 1, noNaN: true }),
        (v) => {
          expect(parsePersistedVolume(v)).toBeCloseTo(v, 10);
        }
      ),
      { numRuns: 200 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 19: localStorage playlist serialization round-trip
// ---------------------------------------------------------------------------

describe('Property 19: localStorage playlist serialization round-trip', () => {
  // Feature: echobox-music, Property 19: localStorage playlist serialization round-trip

  it('serializePlaylists → deserializePlaylists preserves all valid playlists', () => {
    // Feature: echobox-music, Property 19: localStorage playlist serialization round-trip
    fc.assert(
      fc.property(
        fc.array(validPlaylistArb, { maxLength: 10 }),
        (playlists) => {
          const json = serializePlaylists(playlists);
          const result = deserializePlaylists(json);

          // Same count
          expect(result).toHaveLength(playlists.length);

          // Each playlist preserved in order
          for (let i = 0; i < playlists.length; i++) {
            expect(result[i].id).toBe(playlists[i].id);
            expect(result[i].name).toBe(playlists[i].name);
            expect(result[i].tracks).toHaveLength(playlists[i].tracks.length);

            // Each track preserved in order
            for (let j = 0; j < playlists[i].tracks.length; j++) {
              expect(result[i].tracks[j].id).toBe(playlists[i].tracks[j].id);
              expect(result[i].tracks[j].title).toBe(playlists[i].tracks[j].title);
              expect(result[i].tracks[j].artist).toBe(playlists[i].tracks[j].artist);
              expect(result[i].tracks[j].src).toBe(playlists[i].tracks[j].src);
            }
          }
        }
      ),
      { numRuns: 200 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 20: Partial-validity parsing filters only invalid entries
// ---------------------------------------------------------------------------

describe('Property 20: Partial-validity parsing filters only invalid entries', () => {
  // Feature: echobox-music, Property 20: Partial-validity parsing filters only invalid entries

  it('includes valid playlists and excludes invalid ones from a mixed array', () => {
    // Feature: echobox-music, Property 20: Partial-validity parsing filters only invalid entries
    fc.assert(
      fc.property(
        fc.array(validPlaylistArb, { minLength: 0, maxLength: 8 }),
        fc.array(invalidPlaylistArb, { minLength: 0, maxLength: 8 }),
        (validPlaylists, invalidPlaylists) => {
          // Interleave valid and invalid playlists randomly
          const mixed = [...validPlaylists, ...invalidPlaylists].sort(() => Math.random() - 0.5);
          const json = JSON.stringify(mixed);
          const result = deserializePlaylists(json);

          // All valid playlists must appear in the result
          expect(result).toHaveLength(validPlaylists.length);

          const resultIds = new Set(result.map((p) => p.id));
          for (const vp of validPlaylists) {
            expect(resultIds.has(vp.id)).toBe(true);
          }
        }
      ),
      { numRuns: 200 }
    );
  });

  it('filters out tracks with missing required fields within valid playlists', () => {
    // Feature: echobox-music, Property 20: Partial-validity parsing filters only invalid entries
    fc.assert(
      fc.property(
        // A playlist with both valid and invalid tracks
        fc.record({
          id: fc.uuid(),
          name: fc.string({ minLength: 1, maxLength: 30 }).filter((s) => s.trim().length > 0),
          tracks: fc.tuple(
            fc.array(validTrackArb, { minLength: 1, maxLength: 5 }),
            fc.array(invalidTrackArb, { minLength: 1, maxLength: 5 })
          ),
        }),
        ({ id, name, tracks: [validTracks, invalidTracks] }) => {
          const mixedTracks = [...validTracks, ...invalidTracks].sort(() => Math.random() - 0.5);
          const playlist = { id, name, tracks: mixedTracks };
          const json = JSON.stringify([playlist]);
          const result = deserializePlaylists(json);

          expect(result).toHaveLength(1);
          // Only valid tracks survive
          expect(result[0].tracks).toHaveLength(validTracks.length);

          const resultTrackIds = new Set(result[0].tracks.map((t) => t.id));
          for (const vt of validTracks) {
            expect(resultTrackIds.has(vt.id)).toBe(true);
          }
        }
      ),
      { numRuns: 200 }
    );
  });
});
