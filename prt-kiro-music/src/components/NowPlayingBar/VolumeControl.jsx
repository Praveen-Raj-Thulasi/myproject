import { useContext } from 'react';
import { PlayerContext } from '../../context/PlayerContext';
import '../../styles/NowPlayingBar.css';

/**
 * VolumeControl — displays a volume slider ranging from 0 (muted) to 1 (max).
 *
 * - Bound to `state.volume`; reflects the current volume in real time
 * - Calls `audioEngine.setVolume(value)` when the user moves the slider — Req 5.2
 * - Requirements: 5.1, 5.2, 5.4
 */
export function VolumeControl() {
  const { state, audioEngine } = useContext(PlayerContext);

  const handleChange = (e) => {
    audioEngine.setVolume(Number(e.target.value));
  };

  return (
    <div className="volume-control">
      <span className="volume-control__icon" aria-hidden="true">🔊</span>
      <input
        type="range"
        className="volume-control__slider"
        min={0}
        max={1}
        step={0.01}
        value={state.volume}
        onChange={handleChange}
        aria-label="Volume"
        aria-valuemin={0}
        aria-valuemax={1}
        aria-valuenow={state.volume}
        aria-valuetext={`Volume ${Math.round(state.volume * 100)}%`}
      />
    </div>
  );
}

export default VolumeControl;
