import { useContext } from 'react';
import { PlayerContext } from '../../context/PlayerContext';
import { formatDuration } from '../../utils/formatDuration';

/**
 * SeekBar — displays current playback position as a range input and
 * timestamps for elapsed and total duration.
 *
 * - Bound to `state.currentTime`; updates in real time via TIME_UPDATE dispatches
 * - Calls `audioEngine.seek(value)` when the user drags/clicks the range input
 * - Disabled when no track is loaded (state.currentTrack === null) — Req 4.6
 * - Requirements: 4.1, 4.2, 4.4, 4.6
 */
export function SeekBar() {
  const { state, audioEngine } = useContext(PlayerContext);

  const noTrack = state.currentTrack === null;
  const currentTime = noTrack ? 0 : state.currentTime;
  // Fallback max to 100 when no track is loaded to avoid a zero-range slider
  const duration = noTrack ? 100 : (state.duration || 100);

  const handleChange = (e) => {
    audioEngine.seek(Number(e.target.value));
  };

  return (
    <div className="seek-bar">
      <span className="seek-bar__time seek-bar__time--current" aria-label="Current time">
        {formatDuration(currentTime)}
      </span>
      <input
        type="range"
        className="seek-bar__input"
        min={0}
        max={duration}
        step={0.1}
        value={currentTime}
        onChange={handleChange}
        disabled={noTrack}
        aria-label="Seek"
        aria-valuemin={0}
        aria-valuemax={duration}
        aria-valuenow={currentTime}
        aria-valuetext={`${formatDuration(currentTime)} of ${formatDuration(state.duration || 0)}`}
      />
      <span className="seek-bar__time seek-bar__time--total" aria-label="Total duration">
        {formatDuration(state.duration || 0)}
      </span>
    </div>
  );
}

export default SeekBar;
