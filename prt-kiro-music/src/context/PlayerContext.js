import { createContext } from 'react';

/**
 * PlayerContext — provides global player state to all consuming components.
 *
 * Context value shape (fully wired in PlayerProvider):
 * {
 *   state,          // PlayerState
 *   dispatch,       // React dispatch
 *   audioEngine,    // { play, pause, seek, setVolume, loadTrack, skipNext, skipPrevious }
 *   playlists,      // Playlist[]
 *   playlistActions // { create, remove, addTrack, removeTrack }
 * }
 */
export const PlayerContext = createContext(null);
