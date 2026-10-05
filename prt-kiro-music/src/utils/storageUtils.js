const STORAGE_KEY_VOLUME = 'echobox:volume';
const STORAGE_KEY_PLAYLISTS = 'echobox:playlists';

// Tracks whether a corrupt-JSON warning has already been emitted this session
let _playlistsWarnedOnce = false;

// ---------------------------------------------------------------------------
// Volume helpers
// ---------------------------------------------------------------------------

/**
 * Parses a raw value (from localStorage or any source) into a valid volume.
 *
 * Returns the numeric value if it is a finite number in [0, 1].
 * Returns `1` for `null`, `undefined`, non-numeric strings, `NaN`, `Infinity`,
 * or any number outside [0, 1].
 *
 * @param {*} raw
 * @returns {number}
 */
export function parsePersistedVolume(raw) {
  if (raw === null || raw === undefined) return 1;
  const n = typeof raw === 'number' ? raw : parseFloat(raw);
  if (!isFinite(n) || isNaN(n) || n < 0 || n > 1) return 1;
  return n;
}

/**
 * Reads the persisted volume from localStorage.
 * Returns the stored value if valid, otherwise returns `1`.
 *
 * @returns {number} Volume in [0, 1]
 */
export function readPersistedVolume() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_VOLUME);
    if (raw === null) return 1;
    return parsePersistedVolume(JSON.parse(raw));
  } catch (_) {
    return 1;
  }
}

/**
 * Writes a volume value to localStorage.
 *
 * @param {number} vol - Volume in [0, 1]
 * @returns {boolean} `true` on success, `false` if the write threw
 */
export function writePersistedVolume(vol) {
  try {
    localStorage.setItem(STORAGE_KEY_VOLUME, JSON.stringify(vol));
    return true;
  } catch (_) {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Playlist validation helpers (shared by load and deserialize)
// ---------------------------------------------------------------------------

/**
 * Returns `true` if a playlist entry has a valid (non-empty string) name.
 *
 * @param {*} playlist
 * @returns {boolean}
 */
function isValidPlaylist(playlist) {
  return (
    playlist !== null &&
    typeof playlist === 'object' &&
    typeof playlist.name === 'string' &&
    playlist.name.trim().length > 0
  );
}

/**
 * Returns `true` if a track entry has all required fields: title, artist, src.
 *
 * @param {*} track
 * @returns {boolean}
 */
function isValidTrack(track) {
  return (
    track !== null &&
    typeof track === 'object' &&
    typeof track.title === 'string' && track.title.length > 0 &&
    typeof track.artist === 'string' && track.artist.length > 0 &&
    typeof track.src === 'string' && track.src.length > 0
  );
}

/**
 * Applies validation guards to a parsed playlist array:
 * - Filters out playlists with invalid names
 * - Within each valid playlist, filters out tracks missing title, artist, or src
 *
 * @param {*[]} parsed - Raw parsed array
 * @returns {import('../data/catalog').Track[]} Validated playlist array
 */
function applyValidationGuards(parsed) {
  if (!Array.isArray(parsed)) return [];

  return parsed
    .filter(isValidPlaylist)
    .map((playlist) => ({
      ...playlist,
      tracks: Array.isArray(playlist.tracks)
        ? playlist.tracks.filter(isValidTrack)
        : [],
    }));
}

// ---------------------------------------------------------------------------
// Playlist localStorage helpers
// ---------------------------------------------------------------------------

/**
 * Loads playlists from localStorage with four validation guards:
 * 1. `null` from storage → return `[]` silently
 * 2. JSON parse error → return `[]` and emit a one-time `console.warn`
 * 3. Filter out any playlist where `name` is not a non-empty string
 * 4. Within each playlist, filter out tracks missing `title`, `artist`, or `src`
 *
 * @returns {Object[]} Array of validated Playlist objects
 */
export function loadPlaylistsFromStorage() {
  const raw = localStorage.getItem(STORAGE_KEY_PLAYLISTS);

  // Guard 1: nothing stored yet
  if (raw === null) return [];

  // Guard 2: corrupt JSON
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (_) {
    if (!_playlistsWarnedOnce) {
      console.warn(
        '[EchoBox] Playlist data in localStorage could not be parsed and was discarded.'
      );
      _playlistsWarnedOnce = true;
    }
    return [];
  }

  // Guards 3 & 4
  return applyValidationGuards(parsed);
}

/**
 * Serializes an array of Playlist objects to a JSON string.
 *
 * @param {Object[]} ps - Array of Playlist objects
 * @returns {string} JSON string
 */
export function serializePlaylists(ps) {
  return JSON.stringify(ps);
}

/**
 * Deserializes a JSON string to a validated array of Playlist objects.
 *
 * Applies the same guards as `loadPlaylistsFromStorage`:
 * - Returns `[]` on JSON parse error
 * - Filters out playlists with invalid names
 * - Filters out tracks missing `title`, `artist`, or `src`
 *
 * @param {string} json - JSON string to parse
 * @returns {Object[]} Array of validated Playlist objects
 */
export function deserializePlaylists(json) {
  let parsed;
  try {
    parsed = JSON.parse(json);
  } catch (_) {
    return [];
  }

  return applyValidationGuards(parsed);
}
