import { useContext, useState, useEffect, useRef } from 'react';
import { PlayerContext } from '../../context/PlayerContext';
import { formatDuration } from '../../utils/formatDuration';
import '../../styles/TrackList.css';

/**
 * TrackItem — renders a single track row in the track list.
 *
 * Highlights the row when the track matches the currently playing track.
 * Calls `onTrackSelect(track)` on click or Enter key press.
 * Provides an "Add to playlist" button that opens a dropdown listing all
 * available playlists and calls playlistActions.addTrack on selection.
 *
 * Props:
 *   track         {object} — track data: { id, title, artist, duration, ... }
 *   onTrackSelect {function} — callback invoked when the user selects the track
 *
 * Requirements: 1.1, 1.2, 3.4, 10.1, 10.2, 10.4, 16.1
 */
export function TrackItem({ track, onTrackSelect }) {
  const { state, playlists, playlistActions } = useContext(PlayerContext);
  const isActive = state.currentTrack?.id === track.id;

  const [menuOpen, setMenuOpen] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const menuRef = useRef(null);
  const addBtnRef = useRef(null);

  // Close the menu when clicking outside the button or menu
  useEffect(() => {
    if (!menuOpen) return;

    function handleClickOutside(e) {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        addBtnRef.current &&
        !addBtnRef.current.contains(e.target)
      ) {
        setMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  // Auto-clear feedback after 2 seconds
  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 2000);
    return () => clearTimeout(timer);
  }, [feedback]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      onTrackSelect(track);
    }
  };

  const handleAddClick = (e) => {
    e.stopPropagation();
    setMenuOpen((open) => !open);
  };

  const handlePlaylistSelect = (e, playlist) => {
    e.stopPropagation();
    const err = playlistActions.addTrack(playlist.id, track);
    if (err) {
      setFeedback({ type: 'error', msg: err });
    } else {
      setFeedback({ type: 'success', msg: `Added to "${playlist.name}"` });
    }
    setMenuOpen(false);
  };

  return (
    <li
      className={`track-item${isActive ? ' track-item--active' : ''}`}
      onClick={() => onTrackSelect(track)}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-current={isActive ? 'true' : undefined}
    >
      <span className="track-item__title">{track.title}</span>
      <span className="track-item__artist">{track.artist}</span>
      <span className="track-item__duration">{formatDuration(track.duration)}</span>

      {/* Add to playlist affordance */}
      <span className="track-item__add-wrapper">
        <button
          ref={addBtnRef}
          className="track-item__add-btn"
          onClick={handleAddClick}
          aria-label={`Add ${track.title} to a playlist`}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          title="Add to playlist"
          type="button"
        >
          +
        </button>

        {menuOpen && (
          <ul
            ref={menuRef}
            className="track-item__playlist-menu"
            role="menu"
            aria-label="Select a playlist"
          >
            {playlists.length === 0 ? (
              <li className="track-item__playlist-menu-empty" role="menuitem" aria-disabled="true">
                No playlists
              </li>
            ) : (
              playlists.map((playlist) => (
                <li
                  key={playlist.id}
                  className="track-item__playlist-menu-item"
                  role="menuitem"
                  tabIndex={0}
                  onClick={(e) => handlePlaylistSelect(e, playlist)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handlePlaylistSelect(e, playlist);
                    }
                  }}
                >
                  {playlist.name}
                </li>
              ))
            )}
          </ul>
        )}

        {feedback && (
          <span
            className={`track-item__feedback track-item__feedback--${feedback.type}`}
            role="status"
            aria-live="polite"
          >
            {feedback.msg}
          </span>
        )}
      </span>
    </li>
  );
}
