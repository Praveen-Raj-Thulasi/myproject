import '../../styles/Equalizer.css';

/**
 * Equalizer — circular disc visualizer.
 * The disc spins and the wave ring pulses when isPlaying=true.
 * Freezes when paused/stopped.
 *
 * @param {{isPlaying: boolean}} props
 */
export function Equalizer({ isPlaying }) {
  return (
    <div
      className={`eq-disc${isPlaying ? ' eq-disc--playing' : ''}`}
      aria-hidden="true"
    >
      {/* Outer pulsing wave ring */}
      <svg className="eq-disc__wave" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="28" cy="28" r="26" strokeWidth="2" stroke="url(#waveGrad)" strokeDasharray="6 4" strokeLinecap="round" />
        <defs>
          <linearGradient id="waveGrad" x1="0" y1="0" x2="56" y2="56" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FF6B00" />
            <stop offset="100%" stopColor="#FFB347" />
          </linearGradient>
        </defs>
      </svg>

      {/* Inner spinning disc */}
      <div className="eq-disc__inner">
        <div className="eq-disc__hole" />
      </div>
    </div>
  );
}

export default Equalizer;
