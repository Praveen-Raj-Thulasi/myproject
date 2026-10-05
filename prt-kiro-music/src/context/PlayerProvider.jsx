import { useReducer, useEffect, useMemo } from 'react';
import { PlayerContext } from './PlayerContext';
import { playerReducer, initialState } from './playerReducer';
import { readPersistedVolume } from '../utils/storageUtils';
import { useAudioEngine } from '../hooks/useAudioEngine';
import { usePlaylistManager } from '../hooks/usePlaylistManager';

function initState(base) {
  return { ...base, volume: readPersistedVolume() };
}

/**
 * PlayerProvider — wraps the app with global player state.
 *
 * C4 fix: context value memoized so TIME_UPDATE dispatches (~4/s during
 * playback) do not re-render the entire component tree.
 *
 * C3 fix: calls audioEngine.syncState(state) on every state change so
 * skipNext / skipPrevious always read the latest queue.
 */
export function PlayerProvider({ children }) {
  const [state, dispatch] = useReducer(playerReducer, initialState, initState);

  const audioEngine = useAudioEngine(dispatch);

  const { playlists, create, remove, addTrack, removeTrack } = usePlaylistManager();

  const playlistActions = useMemo(
    () => ({ create, remove, addTrack, removeTrack }),
    [create, remove, addTrack, removeTrack]
  );

  // C3 fix: keep audioEngine's internal stateRef current
  useEffect(() => {
    audioEngine.syncState(state);
  }, [state, audioEngine]);

  // C4 fix: only rebuild context object when state or playlists actually change
  const value = useMemo(
    () => ({ state, dispatch, audioEngine, playlists, playlistActions }),
    [state, playlists, playlistActions]
  );

  return (
    <PlayerContext.Provider value={value}>
      {children}
    </PlayerContext.Provider>
  );
}
