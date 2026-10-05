import { useContext } from 'react';
import { PlayerContext } from '../../context/PlayerContext';
import { CLEAR_ERROR } from '../../context/playerReducer';
import { TrackInfo } from './TrackInfo';
import { PlaybackControls } from './PlaybackControls';
import { VolumeControl } from './VolumeControl';
import { Equalizer } from './Equalizer';
import '../../styles/NowPlayingBar.css';

/**
 * NowPlayingBar — fixed bottom bar composing TrackInfo, PlaybackControls,
 * and VolumeControl into a three-section flex layout.
 *
 * Layout: [ TrackInfo (left) | PlaybackControls (center) | VolumeControl (right) ]
 *
 * Requirements: 7.1, 7.2, 7.3
 */
export function NowPlayingBar() {
  const { state, dispatch } = useContext(PlayerContext);

  return (
    <footer
      className="now-playing-bar"
      role="contentinfo"
      aria-label="Now playing"
    >
      {state.error && (
        <div className="now-playing-bar__error" role="alert">
          <span className="now-playing-bar__error-msg">{state.error}</span>
          <button
            className="now-playing-bar__error-dismiss"
            onClick={() => dispatch({ type: CLEAR_ERROR })}
            aria-label="Dismiss error"
            type="button"
          >
            ✕
          </button>
        </div>
      )}

      {/* Left: current track title + artist */}
      <div className="now-playing-bar__section now-playing-bar__section--left">
        {state.currentTrack && (
          <Equalizer isPlaying={state.status === 'playing'} />
        )}
        <TrackInfo />
      </div>

      {/* Centre: previous / play-pause / next + seek bar */}
      <div className="now-playing-bar__section now-playing-bar__section--center">
        <PlaybackControls />
      </div>

      {/* Right: volume slider */}
      <div className="now-playing-bar__section now-playing-bar__section--right">
        <VolumeControl />
      </div>
    </footer>
  );
}

export default NowPlayingBar;
