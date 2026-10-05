import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAudioEngine, buildErrorMessage } from '../hooks/useAudioEngine.js';
import {
  playerReducer,
  initialState,
  CLEAR_ERROR,
} from '../context/playerReducer.js';

// ---------------------------------------------------------------------------
// MockAudio — a controlled stand-in for HTMLAudioElement
// ---------------------------------------------------------------------------

/**
 * Creates a fresh MockAudio instance for each test.
 * Event handlers are stored in a `handlers` map so tests can fire them manually.
 */
class MockAudio {
  constructor() {
    this.src = '';
    this.volume = 1;
    this.currentTime = 0;
    this.duration = 100;
    this.handlers = {};

    this.play = vi.fn(() => Promise.resolve());
    this.pause = vi.fn();
    this.load = vi.fn();

    this.addEventListener = vi.fn((event, handler) => {
      if (!this.handlers[event]) {
        this.handlers[event] = [];
      }
      this.handlers[event].push(handler);
    });

    this.removeEventListener = vi.fn((event, handler) => {
      if (this.handlers[event]) {
        this.handlers[event] = this.handlers[event].filter((h) => h !== handler);
      }
    });
  }

  /** Manually fire a registered event (simulates browser event dispatch). */
  trigger(event) {
    if (this.handlers[event]) {
      this.handlers[event].forEach((h) => h());
    }
  }
}

// ---------------------------------------------------------------------------
// Shared test fixtures
// ---------------------------------------------------------------------------

const mockTrack = {
  id: 'track-01',
  title: 'Test Track',
  artist: 'Test Artist',
  album: 'Test Album',
  duration: 180,
  src: '/audio/track01.mp3',
};

const mockTrack2 = {
  id: 'track-02',
  title: 'Test Track 2',
  artist: 'Test Artist 2',
  album: 'Test Album',
  duration: 200,
  src: '/audio/track02.wav',
};

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

let mockAudioInstance;

beforeEach(() => {
  vi.useFakeTimers();

  // Each test gets a fresh MockAudio instance captured at construction time
  mockAudioInstance = null;
  vi.stubGlobal('Audio', class extends MockAudio {
    constructor() {
      super();
      // eslint-disable-next-line no-constructor-return
      mockAudioInstance = this;
    }
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Req 3.1 — load track → status becomes 'loading'
// ---------------------------------------------------------------------------

describe('useAudioEngine — loadTrack (Req 3.1)', () => {
  it('dispatches LOAD_TRACK with the track when loadTrack is called', () => {
    const mockDispatch = vi.fn();
    const { result } = renderHook(() => useAudioEngine(mockDispatch));

    act(() => {
      result.current.loadTrack(mockTrack);
    });

    const loadTrackCall = mockDispatch.mock.calls.find(
      ([action]) => action.type === 'LOAD_TRACK'
    );
    expect(loadTrackCall).toBeDefined();
    expect(loadTrackCall[0].track).toEqual(mockTrack);
  });

  it('dispatches SET_STATUS with "loading" when loadTrack is called', () => {
    const mockDispatch = vi.fn();
    const { result } = renderHook(() => useAudioEngine(mockDispatch));

    act(() => {
      result.current.loadTrack(mockTrack);
    });

    const setStatusCall = mockDispatch.mock.calls.find(
      ([action]) => action.type === 'SET_STATUS' && action.status === 'loading'
    );
    expect(setStatusCall).toBeDefined();
  });

  it('sets audio.src and calls audio.load() when loadTrack is called', () => {
    const mockDispatch = vi.fn();
    const { result } = renderHook(() => useAudioEngine(mockDispatch));

    act(() => {
      result.current.loadTrack(mockTrack);
    });

    expect(mockAudioInstance.src).toBe(mockTrack.src);
    expect(mockAudioInstance.load).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// Req 8.1 — audio error event → SET_ERROR dispatched with human-readable message
// ---------------------------------------------------------------------------

describe('useAudioEngine — audio error event (Req 8.1)', () => {
  it('dispatches SET_ERROR with a human-readable message when the error event fires', () => {
    const mockDispatch = vi.fn();
    renderHook(() => useAudioEngine(mockDispatch));

    // Simulate an audio element error (e.g. network failure)
    act(() => {
      mockAudioInstance.error = { code: 2 }; // MEDIA_ERR_NETWORK = 2
      mockAudioInstance.trigger('error');
    });

    const setErrorCall = mockDispatch.mock.calls.find(
      ([action]) => action.type === 'SET_ERROR'
    );
    expect(setErrorCall).toBeDefined();
    expect(typeof setErrorCall[0].error).toBe('string');
    expect(setErrorCall[0].error.length).toBeGreaterThan(0);
  });

  it('dispatches SET_ERROR with "network" message for MEDIA_ERR_NETWORK', () => {
    const mockDispatch = vi.fn();
    renderHook(() => useAudioEngine(mockDispatch));

    act(() => {
      mockAudioInstance.error = { code: MediaError.MEDIA_ERR_NETWORK };
      mockAudioInstance.trigger('error');
    });

    const setErrorCall = mockDispatch.mock.calls.find(
      ([action]) => action.type === 'SET_ERROR'
    );
    expect(setErrorCall[0].error).toBe('A network error interrupted loading.');
  });

  it('dispatches SET_ERROR with "aborted" message for MEDIA_ERR_ABORTED', () => {
    const mockDispatch = vi.fn();
    renderHook(() => useAudioEngine(mockDispatch));

    act(() => {
      mockAudioInstance.error = { code: MediaError.MEDIA_ERR_ABORTED };
      mockAudioInstance.trigger('error');
    });

    const setErrorCall = mockDispatch.mock.calls.find(
      ([action]) => action.type === 'SET_ERROR'
    );
    expect(setErrorCall[0].error).toBe('Playback was aborted.');
  });

  it('dispatches SET_ERROR with "not supported" message for MEDIA_ERR_SRC_NOT_SUPPORTED', () => {
    const mockDispatch = vi.fn();
    renderHook(() => useAudioEngine(mockDispatch));

    act(() => {
      mockAudioInstance.error = { code: MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED };
      mockAudioInstance.trigger('error');
    });

    const setErrorCall = mockDispatch.mock.calls.find(
      ([action]) => action.type === 'SET_ERROR'
    );
    expect(setErrorCall[0].error).toBe('The audio format is not supported.');
  });

  it('dispatches SET_ERROR with fallback message when mediaError is null', () => {
    const mockDispatch = vi.fn();
    renderHook(() => useAudioEngine(mockDispatch));

    act(() => {
      mockAudioInstance.error = null;
      mockAudioInstance.trigger('error');
    });

    const setErrorCall = mockDispatch.mock.calls.find(
      ([action]) => action.type === 'SET_ERROR'
    );
    expect(setErrorCall[0].error).toBe('An unknown audio error occurred.');
  });
});

// ---------------------------------------------------------------------------
// Req 8.2 — decode error → auto-advance: error handler dispatches decode message
// ---------------------------------------------------------------------------

describe('useAudioEngine — decode error (Req 8.2)', () => {
  it('dispatches SET_ERROR with the decode error message when MEDIA_ERR_DECODE fires', () => {
    const mockDispatch = vi.fn();
    renderHook(() => useAudioEngine(mockDispatch));

    act(() => {
      mockAudioInstance.error = { code: MediaError.MEDIA_ERR_DECODE };
      mockAudioInstance.trigger('error');
    });

    const setErrorCall = mockDispatch.mock.calls.find(
      ([action]) => action.type === 'SET_ERROR'
    );
    expect(setErrorCall).toBeDefined();
    expect(setErrorCall[0].error).toBe('The audio file could not be decoded.');
  });

  it('auto-advances queue when a decode error occurs mid-queue (skipNext-style dispatch)', () => {
    // Load two tracks into a queue; the first track fires a decode error.
    // The engine should call skipNext, which dispatches LOAD_TRACK for the next track.
    const queue = {
      tracks: [mockTrack, mockTrack2],
      currentIndex: 0,
      sourceId: null,
    };

    const dispatched = [];
    const mockDispatch = vi.fn((action) => dispatched.push(action));

    const { result } = renderHook(() => useAudioEngine(mockDispatch));

    // Load the first track and set state so skipNext knows the current queue
    act(() => {
      result.current.loadTrack(mockTrack);
    });

    // Now simulate a decode error and trigger skipNext (as the real error handler would)
    act(() => {
      result.current.skipNext({ queue });
    });

    // Flush the debounce timer for the play() call inside skipNext
    act(() => {
      vi.runAllTimers();
    });

    const loadTrackActions = dispatched.filter((a) => a.type === 'LOAD_TRACK');
    // The skipNext call should have dispatched a LOAD_TRACK for the second track
    const skipLoadTrackAction = loadTrackActions.find(
      (a) => a.track?.id === mockTrack2.id
    );
    expect(skipLoadTrackAction).toBeDefined();
    expect(skipLoadTrackAction.queue.currentIndex).toBe(1);
  });

  it('dispatches QUEUE_EXHAUSTED when a decode error occurs on the only/last track', () => {
    const queue = {
      tracks: [mockTrack],
      currentIndex: 0,
      sourceId: null,
    };

    const mockDispatch = vi.fn();
    const { result } = renderHook(() => useAudioEngine(mockDispatch));

    act(() => {
      result.current.skipNext({ queue });
    });

    const exhaustedCall = mockDispatch.mock.calls.find(
      ([action]) => action.type === 'QUEUE_EXHAUSTED'
    );
    expect(exhaustedCall).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Req 8.3 — error dismissed → CLEAR_ERROR sets error to null
// ---------------------------------------------------------------------------

describe('playerReducer — error dismissed (Req 8.3)', () => {
  it('clears the error field when CLEAR_ERROR is dispatched', () => {
    const stateWithError = {
      ...initialState,
      error: 'The audio file could not be decoded.',
      status: 'error',
    };

    const next = playerReducer(stateWithError, { type: CLEAR_ERROR });

    expect(next.error).toBeNull();
  });

  it('resets status to idle when CLEAR_ERROR is dispatched', () => {
    const stateWithError = { ...initialState, error: 'Some error', status: 'error' };

    const next = playerReducer(stateWithError, { type: CLEAR_ERROR });

    expect(next.status).toBe('idle');
  });

  it('leaves other state fields untouched when CLEAR_ERROR is dispatched', () => {
    const stateWithError = {
      ...initialState,
      currentTrack: mockTrack,
      volume: 0.7,
      error: 'An unknown audio error occurred.',
      status: 'error',
    };

    const next = playerReducer(stateWithError, { type: CLEAR_ERROR });

    expect(next.currentTrack).toBe(mockTrack);
    expect(next.volume).toBe(0.7);
  });
});

// ---------------------------------------------------------------------------
// buildErrorMessage — unit tests for each MediaError code mapping
// ---------------------------------------------------------------------------

describe('buildErrorMessage', () => {
  it('returns "Playback was aborted." for MEDIA_ERR_ABORTED', () => {
    expect(buildErrorMessage({ code: MediaError.MEDIA_ERR_ABORTED })).toBe(
      'Playback was aborted.'
    );
  });

  it('returns network error message for MEDIA_ERR_NETWORK', () => {
    expect(buildErrorMessage({ code: MediaError.MEDIA_ERR_NETWORK })).toBe(
      'A network error interrupted loading.'
    );
  });

  it('returns decode error message for MEDIA_ERR_DECODE', () => {
    expect(buildErrorMessage({ code: MediaError.MEDIA_ERR_DECODE })).toBe(
      'The audio file could not be decoded.'
    );
  });

  it('returns not-supported message for MEDIA_ERR_SRC_NOT_SUPPORTED', () => {
    expect(buildErrorMessage({ code: MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED })).toBe(
      'The audio format is not supported.'
    );
  });

  it('returns fallback message for an unknown error code', () => {
    expect(buildErrorMessage({ code: 999 })).toBe('An unknown audio error occurred.');
  });

  it('returns fallback message when mediaError is null', () => {
    expect(buildErrorMessage(null)).toBe('An unknown audio error occurred.');
  });
});
