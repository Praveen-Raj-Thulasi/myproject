import { describe, it, expect } from 'vitest';
import {
  playerReducer,
  initialState,
  LOAD_TRACK,
  PLAY,
  PAUSE,
  SEEK,
  TIME_UPDATE,
  TRACK_LOADED,
  TRACK_ENDED,
  SET_VOLUME,
  SET_ERROR,
  CLEAR_ERROR,
  SET_STATUS,
  QUEUE_EXHAUSTED,
} from './playerReducer.js';

const mockTrack = {
  id: 'track-01',
  title: 'Test Track',
  artist: 'Test Artist',
  album: 'Test Album',
  duration: 180,
  src: '/audio/track01.mp3',
};

const mockQueue = {
  tracks: [mockTrack],
  currentIndex: 0,
  sourceId: null,
};

describe('playerReducer', () => {
  describe('LOAD_TRACK', () => {
    it('sets currentTrack, resets currentTime to 0, and sets status to loading', () => {
      const state = { ...initialState, currentTime: 42, status: 'playing' };
      const next = playerReducer(state, { type: LOAD_TRACK, track: mockTrack });
      expect(next.currentTrack).toBe(mockTrack);
      expect(next.currentTime).toBe(0);
      expect(next.status).toBe('loading');
    });

    it('updates queue when queue is provided', () => {
      const next = playerReducer(initialState, {
        type: LOAD_TRACK,
        track: mockTrack,
        queue: mockQueue,
      });
      expect(next.queue).toEqual(mockQueue);
    });

    it('leaves queue unchanged when queue is not provided', () => {
      const next = playerReducer(initialState, { type: LOAD_TRACK, track: mockTrack });
      expect(next.queue).toEqual(initialState.queue);
    });
  });

  describe('PLAY', () => {
    it('sets status to playing', () => {
      const state = { ...initialState, status: 'paused' };
      const next = playerReducer(state, { type: PLAY });
      expect(next.status).toBe('playing');
    });
  });

  describe('PAUSE', () => {
    it('sets status to paused', () => {
      const state = { ...initialState, status: 'playing' };
      const next = playerReducer(state, { type: PAUSE });
      expect(next.status).toBe('paused');
    });
  });

  describe('SEEK', () => {
    it('updates currentTime to the provided time', () => {
      const next = playerReducer(initialState, { type: SEEK, time: 75 });
      expect(next.currentTime).toBe(75);
    });

    it('sets currentTime to 0 when time is 0', () => {
      const state = { ...initialState, currentTime: 99 };
      const next = playerReducer(state, { type: SEEK, time: 0 });
      expect(next.currentTime).toBe(0);
    });
  });

  describe('TIME_UPDATE', () => {
    it('updates currentTime from the action payload', () => {
      const next = playerReducer(initialState, { type: TIME_UPDATE, currentTime: 33.5 });
      expect(next.currentTime).toBe(33.5);
    });
  });

  describe('TRACK_LOADED', () => {
    it('sets duration and status to playing', () => {
      const state = { ...initialState, status: 'loading' };
      const next = playerReducer(state, { type: TRACK_LOADED, duration: 240 });
      expect(next.duration).toBe(240);
      expect(next.status).toBe('playing');
    });
  });

  describe('TRACK_ENDED', () => {
    it('resets status to idle and currentTime to 0', () => {
      const state = { ...initialState, status: 'playing', currentTime: 180, currentTrack: mockTrack };
      const next = playerReducer(state, { type: TRACK_ENDED });
      expect(next.status).toBe('idle');
      expect(next.currentTime).toBe(0);
    });

    it('preserves currentTrack when track ends', () => {
      const state = { ...initialState, currentTrack: mockTrack };
      const next = playerReducer(state, { type: TRACK_ENDED });
      expect(next.currentTrack).toBe(mockTrack);
    });
  });

  describe('SET_VOLUME', () => {
    it('updates the volume field', () => {
      const next = playerReducer(initialState, { type: SET_VOLUME, volume: 0.5 });
      expect(next.volume).toBe(0.5);
    });

    it('sets volume to 0 (mute)', () => {
      const next = playerReducer(initialState, { type: SET_VOLUME, volume: 0 });
      expect(next.volume).toBe(0);
    });
  });

  describe('SET_ERROR', () => {
    it('sets error field and changes status to error', () => {
      const next = playerReducer(initialState, {
        type: SET_ERROR,
        error: 'The audio file could not be decoded.',
      });
      expect(next.error).toBe('The audio file could not be decoded.');
      expect(next.status).toBe('error');
    });
  });

  describe('CLEAR_ERROR', () => {
    it('clears the error field to null and resets status to idle', () => {
      const state = { ...initialState, error: 'Some error', status: 'error' };
      const next = playerReducer(state, { type: CLEAR_ERROR });
      expect(next.error).toBeNull();
      expect(next.status).toBe('idle');
    });
  });

  describe('SET_STATUS', () => {
    it('sets status to the provided value', () => {
      const next = playerReducer(initialState, { type: SET_STATUS, status: 'loading' });
      expect(next.status).toBe('loading');
    });

    it('can set status to any valid value', () => {
      const statuses = ['idle', 'loading', 'playing', 'paused', 'error'];
      for (const s of statuses) {
        const next = playerReducer(initialState, { type: SET_STATUS, status: s });
        expect(next.status).toBe(s);
      }
    });
  });

  describe('QUEUE_EXHAUSTED', () => {
    it('resets status to idle, currentTrack to null, and currentTime to 0', () => {
      const state = {
        ...initialState,
        status: 'playing',
        currentTrack: mockTrack,
        currentTime: 120,
      };
      const next = playerReducer(state, { type: QUEUE_EXHAUSTED });
      expect(next.status).toBe('idle');
      expect(next.currentTrack).toBeNull();
      expect(next.currentTime).toBe(0);
    });
  });

  describe('unknown action', () => {
    it('returns state unchanged for an unrecognised action type', () => {
      const next = playerReducer(initialState, { type: 'TOTALLY_UNKNOWN' });
      expect(next).toBe(initialState);
    });
  });

  describe('state immutability', () => {
    it('does not mutate the original state', () => {
      const frozen = Object.freeze({ ...initialState });
      // This should not throw even on a frozen object
      expect(() => playerReducer(frozen, { type: PLAY })).not.toThrow();
    });
  });
});
