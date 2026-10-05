import { useContext, useState } from 'react';
import { PlayerContext } from '../../context/PlayerContext';
import { LOAD_TRACK } from '../../context/playerReducer';

/**
 * PlaylistList — renders all user playlists in the sidebar.
 *
 * Fixes applied:
 *  C1  — loadTrack(track, queue) replaces dual dispatch pattern
 *  PQ1 — handleRemoveTrack syncs state.queue when active playlist is affected
 *  PQ2 — handleDeleteConfirm clears queue when deleting the active playlist
 *  PQ3 — currently playing track is highlighted in expanded track list
 *  PQ4 — queue built with [...playlist.tracks] defensive copy
 *  PQ5 — handlePlay resumes instead of restarting if playlist is already active
 *  M5  — outer wrapper changed from ul>div to div>... (valid HTML)
 *
 * Requirements: 11.1, 11.2, 12.1, 12.2, 13.1, 13.2
 */
export function PlaylistList() {
  const { state, dispatch, audioEngine, playlists, playlistActions } =
    useContext(PlayerContext);

  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  const activePlaylistId = state.queue.sourceId;

  // PQ5: resume if already active, otherwise load from track 0
  function handlePlay(playlist) {
    if (!playlist.tracks.length) return;

    if (state.queue.sourceId === playlist.id && state.currentTrack) {
      if (state.status === 'paused' || state.status === 'idle') {
        audioEngine.play();
      }
      return;
    }

    // PQ4: defensive copy so queue.tracks is decoupled from playlist.tracks ref
    const queue = {
      tracks: [...playlist.tracks],
      currentIndex: 0,
      sourceId: playlist.id,
    };
    audioEngine.loadTrack(playlist.tracks[0], queue);
  }

  function handleTrackPlay(playlist, track, trackIndex) {
    const queue = {
      tracks: [...playlist.tracks],
      currentIndex: trackIndex,
      sourceId: playlist.id,
    };
    audioEngine.loadTrack(track, queue);
  }

  // PQ1: after removing a track from an active playlist, sync state.queue
  function handleRemoveTrack(playlistId, trackId) {
    playlistActions.removeTrack(playlistId, trackId);

    if (state.queue.sourceId === playlistId) {
      const playlist = playlists.find((p) => p.id === playlistId);
      if (!playlist) return;

      const newTracks = playlist.tracks.filter((t) => t.id !== trackId);
      const removedIndex = playlist.tracks.findIndex((t) => t.id === trackId);
      let newIndex = state.queue.currentIndex;

      if (removedIndex < newIndex) newIndex = Math.max(0, newIndex - 1);
      if (removedIndex === newIndex) newIndex = Math.min(newIndex, newTracks.length - 1);

      dispatch({
        type: LOAD_TRACK,
        track: state.currentTrack,
        queue: {
          tracks: newTracks,
          currentIndex: Math.max(0, newIndex),
          sourceId: playlistId,
        },
      });
    }
  }

  function handleDeleteRequest(playlist) {
    setPendingDeleteId(playlist.id);
  }

  // PQ2: clear queue + stop audio when the active playlist is deleted
  function handleDeleteConfirm() {
    if (state.queue.sourceId === pendingDeleteId) {
      if (['playing', 'paused', 'loading'].includes(state.status)) {
        audioEngine.pause();
      }
      dispatch({ type: 'QUEUE_EXHAUSTED' });
    }
    playlistActions.remove(pendingDeleteId);
    setPendingDeleteId(null);
  }

  function handleDeleteCancel() {
    setPendingDeleteId(null);
  }

  return (
    <section className="playlist-list">
      {playlists.length === 0 ? (
        <p className="playlist-list__empty">No playlists yet. Create one below!</p>
      ) : (
        // M5 fix: div wrapper is valid; avoids div-inside-ul HTML violation
        <div className="playlist-list__items">
          {playlists.map((playlist) => {
            const isActive = playlist.id === activePlaylistId;
            return (
              <div key={playlist.id} className="playlist-list__item-group">
                {/* PlaylistItem renders its own <li> — keep it inside the div */}
                <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                  <li className={`playlist-item${isActive ? ' playlist-item--active' : ''}`}>
                    <button
                      className="playlist-item__play"
                      onClick={() => handlePlay(playlist)}
                      aria-label={`Play ${playlist.name}`}
                      disabled={playlist.tracks.length === 0}
                      title={playlist.tracks.length === 0 ? 'No tracks in this playlist' : undefined}
                    >
                      ▶
                    </button>
                    <div className="playlist-item__info">
                      <span className="playlist-item__name">{playlist.name}</span>
                      <span className="playlist-item__count">
                        {playlist.tracks.length} track{playlist.tracks.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <button
                      className="playlist-item__delete"
                      onClick={() => handleDeleteRequest(playlist)}
                      aria-label={`Delete ${playlist.name}`}
                    >
                      ✕
                    </button>
                  </li>
                </ul>

                {/* PQ3: expanded track list with active-track highlight */}
                {isActive && (
                  <ul className="playlist-tracks" aria-label={`Tracks in ${playlist.name}`}>
                    {playlist.tracks.length === 0 ? (
                      <li className="playlist-tracks__empty">No tracks in this playlist</li>
                    ) : (
                      playlist.tracks.map((track, index) => {
                        const isCurrentTrack = state.currentTrack?.id === track.id;
                        return (
                          <li
                            key={track.id}
                            className={`playlist-track-row${isCurrentTrack ? ' playlist-track-row--active' : ''}`}
                          >
                            <button
                              className="playlist-track-row__title"
                              onClick={() => handleTrackPlay(playlist, track, index)}
                              aria-label={`Play ${track.title}`}
                            >
                              {isCurrentTrack && '▶ '}{track.title}
                            </button>
                            <button
                              className="playlist-track-row__remove"
                              onClick={() => handleRemoveTrack(playlist.id, track.id)}
                              aria-label={`Remove ${track.title} from playlist`}
                            >
                              ✕
                            </button>
                          </li>
                        );
                      })
                    )}
                  </ul>
                )}

                {pendingDeleteId === playlist.id && (
                  <div
                    className="playlist-item__confirm"
                    role="region"
                    aria-label={`Confirm deletion of ${playlist.name}`}
                  >
                    <span className="playlist-item__confirm-text">
                      Delete &ldquo;{playlist.name}&rdquo;?
                    </span>
                    <button
                      className="playlist-item__confirm-btn playlist-item__confirm-btn--danger"
                      onClick={handleDeleteConfirm}
                      aria-label={`Confirm delete ${playlist.name}`}
                    >
                      Delete
                    </button>
                    <button
                      className="playlist-item__confirm-btn"
                      onClick={handleDeleteCancel}
                      aria-label="Cancel deletion"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
