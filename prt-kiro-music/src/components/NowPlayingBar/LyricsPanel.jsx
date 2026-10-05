import { useContext, useEffect, useRef, useMemo } from 'react';
import { PlayerContext } from '../../context/PlayerContext';
import '../../styles/LyricsPanel.css';

/**
 * LyricsPanel — displays synced, scrolling lyrics for the current track.
 *
 * - Reads `state.currentTrack.lyrics` (array of { time, text }) and
 *   `state.currentTime` from PlayerContext.
 * - Highlights the active line based on playback position.
 * - Smoothly scrolls the active line into view.
 * - Shows a placeholder when no track is playing or the track has no lyrics.
 */
export function LyricsPanel() {
  const { state } = useContext(PlayerContext);
  const { currentTrack, currentTime } = state;

  const lyrics = currentTrack?.lyrics ?? null;

  // Find index of the currently active lyric line
  const activeIndex = useMemo(() => {
    if (!lyrics || lyrics.length === 0) return -1;
    let idx = -1;
    for (let i = 0; i < lyrics.length; i++) {
      if (lyrics[i].time <= currentTime) idx = i;
      else break;
    }
    return idx;
  }, [lyrics, currentTime]);

  // Scroll active line into view
  const listRef = useRef(null);
  const activeRef = useRef(null);

  useEffect(() => {
    if (activeRef.current && listRef.current) {
      activeRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeIndex]);

  // No track playing
  if (!currentTrack) {
    return (
      <aside className="lyrics-panel lyrics-panel--empty" aria-label="Lyrics">
        <p className="lyrics-panel__placeholder">
          ♪ Play a track to see lyrics
        </p>
      </aside>
    );
  }

  // Track has no lyrics
  if (!lyrics) {
    return (
      <aside className="lyrics-panel lyrics-panel--empty" aria-label="Lyrics">
        <p className="lyrics-panel__placeholder">
          No lyrics available for this track
        </p>
      </aside>
    );
  }

  return (
    <aside className="lyrics-panel" aria-label="Lyrics">
      <div className="lyrics-panel__header">
        <span className="lyrics-panel__label">♪ Lyrics</span>
        <span className="lyrics-panel__track-name">{currentTrack.title}</span>
      </div>
      <ol className="lyrics-panel__list" ref={listRef} aria-live="polite">
        {lyrics.map((line, i) => {
          const isActive = i === activeIndex;
          const isPast = i < activeIndex;
          return (
            <li
              key={i}
              ref={isActive ? activeRef : null}
              className={[
                'lyrics-panel__line',
                isActive ? 'lyrics-panel__line--active' : '',
                isPast  ? 'lyrics-panel__line--past'   : '',
              ].filter(Boolean).join(' ')}
              aria-current={isActive ? 'true' : undefined}
            >
              {line.text}
            </li>
          );
        })}
      </ol>
    </aside>
  );
}

export default LyricsPanel;
