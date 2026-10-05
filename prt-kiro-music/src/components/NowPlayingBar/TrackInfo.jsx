import { useContext } from 'react';
import { PlayerContext } from '../../context/PlayerContext';
import '../../styles/NowPlayingBar.css';

/**
 * TrackInfo — displays the currently playing track's title and artist.
 *
 * When `state.currentTrack` is non-null it renders the real title and artist.
 * When no track is loaded it renders placeholder text.
 *
 * Requirements: 7.1, 7.2, 7.3
 */
export function TrackInfo() {
  const { state } = useContext(PlayerContext);
  const { currentTrack } = state;

  return (
    <div className="track-info">
      <span className="track-title">
        {currentTrack ? currentTrack.title : 'No track selected'}
      </span>
      <span className="track-artist">
        {currentTrack ? currentTrack.artist : '—'}
      </span>
    </div>
  );
}
