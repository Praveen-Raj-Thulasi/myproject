import '../../styles/Sidebar.css';

/**
 * PlaylistItem — renders a single playlist row in the sidebar.
 *
 * Highlights the row when the playlist matches the currently active playlist.
 * Emits `onPlay(playlist)` when the play button is clicked and
 * `onDelete(playlist)` when the delete button is clicked.
 *
 * Props:
 *   playlist  {object}   — playlist data: { id, name, tracks: [...] }
 *   onPlay    {function} — callback invoked when the user clicks play
 *   onDelete  {function} — callback invoked when the user clicks delete
 *   isActive  {boolean}  — applies active highlight class when true
 *
 * Requirements: 12.2, 13.1
 */
export function PlaylistItem({ playlist, onPlay, onDelete, isActive }) {
  const trackCount = playlist.tracks.length;

  return (
    <li className={`playlist-item${isActive ? ' playlist-item--active' : ''}`}>
      <button
        className="playlist-item__play"
        onClick={() => onPlay(playlist)}
        aria-label={`Play ${playlist.name}`}
      >
        ▶
      </button>
      <div className="playlist-item__info">
        <span className="playlist-item__name">{playlist.name}</span>
        <span className="playlist-item__count">
          {trackCount} track{trackCount !== 1 ? 's' : ''}
        </span>
      </div>
      <button
        className="playlist-item__delete"
        onClick={() => onDelete(playlist)}
        aria-label={`Delete ${playlist.name}`}
      >
        ✕
      </button>
    </li>
  );
}
