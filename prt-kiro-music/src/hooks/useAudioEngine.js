import { useRef, useEffect } from 'react';
import { clampSeek, nextTrack, previousTrack } from '../utils/queueUtils';
import { writePersistedVolume } from '../utils/storageUtils';

/**
 * Maps a MediaError object to a human-readable error string.
 *
 * @param {MediaError|null} mediaError
 * @returns {string}
 */
export function buildErrorMessage(mediaError) {
  if (!mediaError) return 'An unknown audio error occurred.';
  switch (mediaError.code) {
    case MediaError.MEDIA_ERR_ABORTED:
      return 'Playback was aborted.';
    case MediaError.MEDIA_ERR_NETWORK:
      return 'A network error interrupted loading.';
    case MediaError.MEDIA_ERR_DECODE:
      return 'The audio file could not be decoded.';
    case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
      return 'The audio format is not supported.';
    default:
      return 'An unknown audio error occurred.';
  }
}

/**
 * useAudioEngine — owns the HTMLAudioElement and bridges audio events into
 * reducer dispatches.
 *
 * Key design decisions
 * ─────────────────────
 * • stateRef        — always holds the latest PlayerState so skipNext /
 *                     skipPrevious never read stale closure values (fixes C3).
 * • loadTrack(track, queue) — accepts an optional queue so the caller never
 *                     needs a separate LOAD_TRACK dispatch (fixes C1).
 * • shouldPlayRef   — set by loadTrack/skipNext/skipPrevious; consumed once
 *                     by onCanPlay to call audio.play() after load completes.
 * • onEnded         — calls skipNext() for automatic queue advance (fixes H2).
 * • Cleanup         — pauses and releases src on unmount (fixes C2).
 *
 * @param {Function} dispatch — React dispatch from useReducer
 * @returns {{ loadTrack, play, pause, seek, setVolume, skipNext, skipPrevious, syncState }}
 */
export function useAudioEngine(dispatch) {
  const audioRef          = useRef(new Audio());
  const loadAbortRef      = useRef(0);
  const expectedLoadIdRef = useRef(0);
  const pendingActionRef  = useRef(null);
  const shouldPlayRef     = useRef(false);
  // C3 fix: always-current state so skip functions avoid stale closures
  const stateRef          = useRef(null);

  // ─── skipNext / skipPrevious ────────────────────────────────────────────
  // Defined before useEffect so onEnded can reference skipNext directly.

  const skipNext = (stateOverride) => {
    const currentState = stateOverride || stateRef.current;
    if (!currentState) return;

    const nextIndex = nextTrack(currentState.queue);
    if (nextIndex !== null) {
      const track = currentState.queue.tracks[nextIndex];
      const updatedQueue = { ...currentState.queue, currentIndex: nextIndex };
      const audio = audioRef.current;
      loadAbortRef.current += 1;
      expectedLoadIdRef.current = loadAbortRef.current;
      audio.src = track.src;
      audio.load();
      shouldPlayRef.current = true;
      dispatch({ type: 'LOAD_TRACK', track, queue: updatedQueue });
      dispatch({ type: 'SET_STATUS', status: 'loading' });
    } else {
      dispatch({ type: 'QUEUE_EXHAUSTED' });
    }
  };

  const skipPrevious = (stateOverride) => {
    const currentState = stateOverride || stateRef.current;
    if (!currentState) return;

    // PQ7 / requirement 6: if more than 3 s in, restart current track
    if (currentState.currentTime > 3) {
      const audio = audioRef.current;
      audio.currentTime = 0;
      dispatch({ type: 'TIME_UPDATE', currentTime: 0 });
      return;
    }

    const prevIndex = previousTrack(currentState.queue);
    if (prevIndex !== null) {
      const track = currentState.queue.tracks[prevIndex];
      const updatedQueue = { ...currentState.queue, currentIndex: prevIndex };
      const audio = audioRef.current;
      loadAbortRef.current += 1;
      expectedLoadIdRef.current = loadAbortRef.current;
      audio.src = track.src;
      audio.load();
      shouldPlayRef.current = true;
      dispatch({ type: 'LOAD_TRACK', track, queue: updatedQueue });
      dispatch({ type: 'SET_STATUS', status: 'loading' });
    } else {
      // Already at first track — restart from 0
      const audio = audioRef.current;
      audio.currentTime = 0;
      dispatch({ type: 'TIME_UPDATE', currentTime: 0 });
    }
  };

  // ─── Audio event listeners ───────────────────────────────────────────────
  useEffect(() => {
    const audio = audioRef.current;

    const onTimeUpdate = () =>
      dispatch({ type: 'TIME_UPDATE', currentTime: audio.currentTime });

    const onCanPlay = () => {
      if (loadAbortRef.current !== expectedLoadIdRef.current) return;
      dispatch({ type: 'TRACK_LOADED', duration: audio.duration });
      if (shouldPlayRef.current) {
        shouldPlayRef.current = false;
        audio.play().catch((err) => {
          // AbortError is normal when src changes rapidly — ignore silently.
          // NotAllowedError means autoplay was blocked — surface it.
          if (err.name === 'NotAllowedError') {
            dispatch({ type: 'SET_ERROR', error: 'Autoplay blocked. Press play to start.' });
          }
        });
      }
    };

    // H2 fix: auto-advance to next track when current one ends
    const onEnded = () => skipNext();

    const onError = () =>
      dispatch({ type: 'SET_ERROR', error: buildErrorMessage(audio.error) });

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('canplay',    onCanPlay);
    audio.addEventListener('ended',      onEnded);
    audio.addEventListener('error',      onError);

    // C2 fix: fully release the audio element on unmount
    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('canplay',    onCanPlay);
      audio.removeEventListener('ended',      onEnded);
      audio.removeEventListener('error',      onError);
      audio.pause();
      audio.src = '';
      audio.load();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  // Clear debounce timer on unmount
  useEffect(() => {
    return () => clearTimeout(pendingActionRef.current);
  }, []);

  // ─── Public API ──────────────────────────────────────────────────────────

  /**
   * C3 fix: called by PlayerProvider on every state change so skip functions
   * always read the latest queue / currentTime without stale closures.
   */
  const syncState = (newState) => {
    stateRef.current = newState;
  };

  /**
   * C1 fix: accepts an optional queue so callers never need a separate
   * LOAD_TRACK dispatch — one dispatch, one source of truth.
   *
   * @param {{ src: string }} track
   * @param {object|null} [queue]
   */
  const loadTrack = (track, queue = null) => {
    const audio = audioRef.current;
    loadAbortRef.current += 1;
    expectedLoadIdRef.current = loadAbortRef.current;
    audio.src = track.src;
    audio.load();
    shouldPlayRef.current = true;
    dispatch({ type: 'LOAD_TRACK', track, ...(queue !== null ? { queue } : {}) });
    dispatch({ type: 'SET_STATUS', status: 'loading' });
  };

  /**
   * @param {number} time — desired seek position in seconds
   */
  const seek = (time) => {
    const audio = audioRef.current;
    audio.currentTime = clampSeek(time, audio.duration);
  };

  /**
   * H3 fix: clamps vol to [0, 1] before assigning to audio.volume.
   *
   * @param {number} vol
   */
  const setVolume = (vol) => {
    const audio = audioRef.current;
    const clamped = Math.min(1, Math.max(0, isNaN(vol) ? 1 : vol));
    audio.volume = clamped;
    dispatch({ type: 'SET_VOLUME', volume: clamped });
    writePersistedVolume(clamped);
  };

  /** Debounced play — only the last call within 50 ms executes. */
  const play = () => {
    clearTimeout(pendingActionRef.current);
    pendingActionRef.current = setTimeout(() => {
      audioRef.current.play().catch(() => {});
      dispatch({ type: 'PLAY' });
    }, 50);
  };

  /** Debounced pause — same 50 ms debounce as play. */
  const pause = () => {
    clearTimeout(pendingActionRef.current);
    pendingActionRef.current = setTimeout(() => {
      audioRef.current.pause();
      dispatch({ type: 'PAUSE' });
    }, 50);
  };

  return { loadTrack, play, pause, seek, setVolume, skipNext, skipPrevious, syncState };
}
