import '../../styles/Equalizer.css';

/**
 * Equalizer — 5-bar animated visualizer.
 * Bars animate when isPlaying=true, freeze when false.
 *
 * @param {{isPlaying: boolean}} props
 */
export function Equalizer({ isPlaying }) {
  return (
    <div
      className={`equalizer${isPlaying ? '' : ' equalizer--paused'}`}
      aria-hidden="true"
    >
      <div className="equalizer__bar" />
      <div className="equalizer__bar" />
      <div className="equalizer__bar" />
      <div className="equalizer__bar" />
      <div className="equalizer__bar" />
    </div>
  );
}

export default Equalizer;
