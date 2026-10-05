import { useState } from 'react';
import {
  loadPlaylistsFromStorage,
  serializePlaylists,
} from '../utils/storageUtils';

const STORAGE_KEY_PLAYLISTS = 'echobox:playlists';

/**
 * Writes the given playlists array to localStorage.
 * Uses the "write-then-set" pattern: throws on failure so callers can rollback.
 *
 * @param {Object[]} playlists
 * @throws {Error} If localStorage.setItem fails
 */
function persist(playlists) {
  localStorage.setItem(STORAGE_KEY_PLAYLISTS, serializePlaylists(playlists));
}

/**
 * Custom hook that manages the user's playlists with full localStorage persistence.
 *
 * Exposes:
 *   - `playlists`       — current array of Playlist objects
 *   - `create(name)`    — create a new playlist; returns null on success, error string on failure
 *   - `remove(id)`      — delete a playlist by id; returns null on success, error string on failure
 *   - `addTrack(id, track)`     — append a track; returns null on success, error string on failure
 *   - `removeTrack(id, trackId)` — remove a track; returns null on success, error string on failure
 *
 * @returns {{ playlists: Object[], create: Function, remove: Function, addTrack: Function, removeTrack: Function }}
 */
export function usePlaylistManager() {
  const [playlists, setPlaylists] = useState(() => loadPlaylistsFromStorage());

  /**
   * Creates a new playlist with the given name.
   *
   * Validation order:
   *   1. Reject blank / whitespace-only names (Req 9.3)
   *   2. Reject case-insensitive duplicates (Req 9.2)
   *   3. Persist first; only update state if write succeeds (Req 9.1, 9.4)
   *
   * @param {string} name
   * @returns {string|null} Error string on failure, null on success
   */
  const create = (name) => {
    // Guard 1: blank name
    if (!name || name.trim().length === 0) {
      return 'Playlist name cannot be blank.';
    }

    const trimmed = name.trim();

    // Guard 2: case-insensitive duplicate
    const isDuplicate = playlists.some(
      (p) => p.name.trim().toLowerCase() === trimmed.toLowerCase()
    );
    if (isDuplicate) {
      return `A playlist named "${trimmed}" already exists.`;
    }

    const newPlaylist = {
      id: crypto.randomUUID(),
      name: trimmed,
      tracks: [],
    };

    // Guard 3: write-then-set — persist before updating in-memory state (Req 9.4)
    const updated = [...playlists, newPlaylist];
    try {
      persist(updated);
    } catch (_) {
      return 'Could not save the playlist. Storage may be full or unavailable.';
    }

    setPlaylists(updated);
    return null;
  };

  /**
   * Removes the playlist with the given id.
   *
   * Uses write-then-set: persists first, only updates state if write succeeds.
   *
   * @param {string} id
   * @returns {string|null} Error string on failure, null on success
   */
  const remove = (id) => {
    const filtered = playlists.filter((p) => p.id !== id);

    try {
      persist(filtered);
    } catch (_) {
      return 'Could not remove the playlist. Storage may be full or unavailable.';
    }

    setPlaylists(filtered);
    return null;
  };

  /**
   * Adds a track to the end of the specified playlist.
   *
   * Validation order:
   *   1. Reject if playlist not found (Req 10.4)
   *   2. Reject if track.id already exists in playlist (Req 10.2)
   *   3. Persist first; only update state if write succeeds (Req 10.1, 10.3)
   *
   * @param {string} id       - Playlist id
   * @param {Object} track    - Track object to append
   * @returns {string|null} Error string on failure, null on success
   */
  const addTrack = (id, track) => {
    const playlist = playlists.find((p) => p.id === id);
    if (!playlist) {
      return 'Playlist not found.';
    }

    const isDuplicate = playlist.tracks.some((t) => t.id === track.id);
    if (isDuplicate) {
      return 'This track is already in the playlist.';
    }

    const updatedPlaylist = { ...playlist, tracks: [...playlist.tracks, track] };
    const updated = playlists.map((p) => (p.id === id ? updatedPlaylist : p));

    try {
      persist(updated);
    } catch (_) {
      return 'Could not save the playlist. Storage may be full or unavailable.';
    }

    setPlaylists(updated);
    return null;
  };

  /**
   * Removes a track from the specified playlist.
   *
   * Uses write-then-set: persists first, only updates state if write succeeds.
   *
   * @param {string} id       - Playlist id
   * @param {string} trackId  - Id of the track to remove
   * @returns {string|null} Error string on failure, null on success
   */
  const removeTrack = (id, trackId) => {
    const playlist = playlists.find((p) => p.id === id);
    if (!playlist) {
      return 'Playlist not found.';
    }

    const updatedPlaylist = {
      ...playlist,
      tracks: playlist.tracks.filter((t) => t.id !== trackId),
    };
    const updated = playlists.map((p) => (p.id === id ? updatedPlaylist : p));

    try {
      persist(updated);
    } catch (_) {
      return 'Could not update the playlist. Storage may be full or unavailable.';
    }

    setPlaylists(updated);
    return null;
  };

  return { playlists, create, remove, addTrack, removeTrack };
}
