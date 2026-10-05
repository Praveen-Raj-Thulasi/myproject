// Action type constants
export const LOAD_TRACK = 'LOAD_TRACK';
export const PLAY = 'PLAY';
export const PAUSE = 'PAUSE';
export const SEEK = 'SEEK';
export const TIME_UPDATE = 'TIME_UPDATE';
export const TRACK_LOADED = 'TRACK_LOADED';
export const TRACK_ENDED = 'TRACK_ENDED';
export const SET_VOLUME = 'SET_VOLUME';
export const SET_ERROR = 'SET_ERROR';
export const CLEAR_ERROR = 'CLEAR_ERROR';
export const SET_STATUS = 'SET_STATUS';
export const QUEUE_EXHAUSTED = 'QUEUE_EXHAUSTED';

/**
 * @type {import('../context/PlayerContext').PlayerState}
 */
export const initialState = {
  currentTrack: null,
  status: 'idle',
  currentTime: 0,
  duration: 0,
  volume: 1,
  queue: { tracks: [], currentIndex: -1, sourceId: null },
  error: null,
};

/**
 * Player reducer — handles all player state transitions.
 *
 * @param {typeof initialState} state
 * @param {{ type: string, [key: string]: any }} action
 * @returns {typeof initialState}
 */
export function playerReducer(state, action) {
  switch (action.type) {
    case LOAD_TRACK:
      return {
        ...state,
        currentTrack: action.track,
        status: 'loading',
        currentTime: 0,
        ...(action.queue !== undefined ? { queue: action.queue } : {}),
      };

    case PLAY:
      return { ...state, status: 'playing' };

    case PAUSE:
      return { ...state, status: 'paused' };

    case SEEK:
      return { ...state, currentTime: action.time };

    case TIME_UPDATE:
      return { ...state, currentTime: action.currentTime };

    case TRACK_LOADED:
      return { ...state, duration: action.duration, status: 'playing' };

    case TRACK_ENDED:
      return { ...state, status: 'idle', currentTime: 0 };

    case SET_VOLUME:
      return { ...state, volume: action.volume };

    case SET_ERROR:
      return { ...state, error: action.error, status: 'error' };

    case CLEAR_ERROR:
      return { ...state, error: null, status: 'idle' };

    case SET_STATUS:
      return { ...state, status: action.status };

    case QUEUE_EXHAUSTED:
      return {
        ...state,
        status: 'idle',
        currentTrack: null,
        currentTime: 0,
      };

    default:
      return state;
  }
}
