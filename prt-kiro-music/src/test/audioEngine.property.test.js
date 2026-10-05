// Feature: echobox-music, Property 5: Track switch resets position and preserves playback mode

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { playerReducer, initialState, LOAD_TRACK } from '../context/playerReducer.js';

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/**
 * A valid track object with all required fields and a unique-enough id.
 */
const trackArb = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 40 }).filter((s) => s.trim().length > 0),
  artist: fc.string({ minLength: 1, maxLength: 40 }).filter((s) => s.trim().length > 0),
  album: fc.string({ maxLength: 40 }),
  duration: fc.integer({ min: 1, max: 7200 }),
  src: fc.constantFrom('/audio/track01.mp3', '/audio/track02.wav'),
});

/**
 * A pair of tracks with distinct ids.
 */
const distinctTrackPairArb = fc
  .tuple(trackArb, trackArb)
  .filter(([a, b]) => a.id !== b.id);

// ---------------------------------------------------------------------------
// Property 5: Track switch resets position and preserves playback mode
// Validates: Requirements 3.4, 16.1, 16.2
// ---------------------------------------------------------------------------

describe('Property 5: Track switch resets position and preserves playback mode', () => {
  it('always resets currentTime to 0 after dispatching LOAD_TRACK, regardless of prior status', () => {
    // Feature: echobox-music, Property 5: Track switch resets position and preserves playback mode
    fc.assert(
      fc.property(
        distinctTrackPairArb,
        fc.boolean(), // wasPlaying
        fc.integer({ min: 1, max: 3600 }), // prior playback position
        ([trackA, trackB], wasPlaying, priorTime) => {
          // Simulate a state where trackA is loaded at some position
          const priorState = {
            ...initialState,
            currentTrack: trackA,
            status: wasPlaying ? 'playing' : 'paused',
            currentTime: priorTime,
            duration: trackA.duration,
          };

          // Switch to trackB
          const nextState = playerReducer(priorState, { type: LOAD_TRACK, track: trackB });

          // currentTime MUST reset to 0 on any track switch
          expect(nextState.currentTime).toBe(0);
        }
      ),
      { numRuns: 200 }
    );
  });

  it('sets currentTrack to the new track after dispatching LOAD_TRACK', () => {
    // Feature: echobox-music, Property 5: Track switch resets position and preserves playback mode
    fc.assert(
      fc.property(distinctTrackPairArb, fc.boolean(), ([trackA, trackB], wasPlaying) => {
        const priorState = {
          ...initialState,
          currentTrack: trackA,
          status: wasPlaying ? 'playing' : 'paused',
          currentTime: 60,
        };

        const nextState = playerReducer(priorState, { type: LOAD_TRACK, track: trackB });

        expect(nextState.currentTrack).toBe(trackB);
        expect(nextState.currentTrack.id).toBe(trackB.id);
        // Must not still reference the old track
        expect(nextState.currentTrack.id).not.toBe(trackA.id);
      }),
      { numRuns: 200 }
    );
  });

  it('always sets status to loading immediately after LOAD_TRACK, regardless of prior playing state', () => {
    // Feature: echobox-music, Property 5: Track switch resets position and preserves playback mode
    fc.assert(
      fc.property(distinctTrackPairArb, fc.boolean(), ([trackA, trackB], wasPlaying) => {
        const priorState = {
          ...initialState,
          currentTrack: trackA,
          status: wasPlaying ? 'playing' : 'paused',
          currentTime: 30,
        };

        const nextState = playerReducer(priorState, { type: LOAD_TRACK, track: trackB });

        // The reducer always moves to 'loading' on LOAD_TRACK; the audio engine
        // subsequently calls play() (if wasPlaying) once canplay fires, transitioning
        // to 'playing'. The reducer itself does not know about wasPlaying — the engine
        // does. This property verifies the reducer contract (Req 3.4, 16.2).
        expect(nextState.status).toBe('loading');
      }),
      { numRuns: 200 }
    );
  });

  it('preserves all other state fields (volume, queue, error) across a track switch', () => {
    // Feature: echobox-music, Property 5: Track switch resets position and preserves playback mode
    fc.assert(
      fc.property(
        distinctTrackPairArb,
        fc.float({ min: 0, max: 1, noNaN: true }),
        ([trackA, trackB], volume) => {
          const priorState = {
            ...initialState,
            currentTrack: trackA,
            status: 'playing',
            currentTime: 45,
            volume,
            queue: {
              tracks: [trackA, trackB],
              currentIndex: 0,
              sourceId: 'pl-test',
            },
          };

          const nextState = playerReducer(priorState, { type: LOAD_TRACK, track: trackB });

          // Volume must not be affected by track switch
          expect(nextState.volume).toBe(volume);

          // Error must remain unchanged (null in this case)
          expect(nextState.error).toBeNull();

          // Queue is unchanged when no queue is provided to LOAD_TRACK
          expect(nextState.queue).toEqual(priorState.queue);
        }
      ),
      { numRuns: 200 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 4: Pause retains playback position
// Validates: Requirements 3.2, 3.3
// ---------------------------------------------------------------------------

describe('Property 4: Pause retains playback position', () => {
  // Feature: echobox-music, Property 4: Pause retains playback position
  //
  // The reducer's PAUSE action must retain currentTime unchanged.
  // The reducer's PLAY action must not reset currentTime.
  // This verifies the reducer contract for requirements 3.2 and 3.3.

  it('PAUSE action retains currentTime at the exact paused position', () => {
    // Feature: echobox-music, Property 4: Pause retains playback position
    fc.assert(
      fc.property(
        trackArb,
        fc.integer({ min: 1, max: 3600 }), // playback position in seconds
        (track, position) => {
          const playingState = {
            ...initialState,
            currentTrack: track,
            status: 'playing',
            currentTime: position,
            duration: track.duration,
          };

          const afterPause = playerReducer(playingState, { type: 'PAUSE' });

          // Pause must not change currentTime
          expect(afterPause.currentTime).toBe(position);
          expect(afterPause.status).toBe('paused');
        }
      ),
      { numRuns: 200 }
    );
  });

  it('PLAY action on a paused state does not reset currentTime to 0', () => {
    // Feature: echobox-music, Property 4: Pause retains playback position
    fc.assert(
      fc.property(
        trackArb,
        fc.integer({ min: 1, max: 3600 }), // non-zero position
        (track, position) => {
          const pausedState = {
            ...initialState,
            currentTrack: track,
            status: 'paused',
            currentTime: position,
            duration: track.duration,
          };

          const afterPlay = playerReducer(pausedState, { type: 'PLAY' });

          // Play must not reset currentTime — it must resume from the paused position
          expect(afterPlay.currentTime).toBe(position);
          expect(afterPlay.status).toBe('playing');
        }
      ),
      { numRuns: 200 }
    );
  });

  it('round-trip: PLAY → PAUSE → PLAY preserves the same currentTime', () => {
    // Feature: echobox-music, Property 4: Pause retains playback position
    fc.assert(
      fc.property(
        trackArb,
        fc.integer({ min: 1, max: 3600 }),
        (track, position) => {
          const playingState = {
            ...initialState,
            currentTrack: track,
            status: 'playing',
            currentTime: position,
            duration: track.duration,
          };

          const afterPause = playerReducer(playingState, { type: 'PAUSE' });
          const afterResume = playerReducer(afterPause, { type: 'PLAY' });

          expect(afterResume.currentTime).toBe(position);
          expect(afterResume.status).toBe('playing');
        }
      ),
      { numRuns: 200 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 6: Final action wins under rapid play/pause
// Validates: Requirements 3.6, 16.3
// ---------------------------------------------------------------------------

describe('Property 6: Final action wins under rapid play/pause', () => {
  // Feature: echobox-music, Property 6: Final action wins under rapid play/pause
  //
  // The reducer must be idempotent for repeated PLAY or PAUSE dispatches:
  // dispatching PLAY n times leaves status as 'playing'; dispatching PAUSE
  // n times leaves status as 'paused'. The final action determines the outcome.

  it('dispatching PLAY multiple times always results in playing status', () => {
    // Feature: echobox-music, Property 6: Final action wins under rapid play/pause
    fc.assert(
      fc.property(
        trackArb,
        fc.integer({ min: 2, max: 10 }), // number of rapid PLAY dispatches
        (track, count) => {
          let state = {
            ...initialState,
            currentTrack: track,
            status: 'paused',
            currentTime: 10,
            duration: track.duration,
          };

          // Simulate rapid PLAY dispatches — the last one (PLAY) must win
          for (let i = 0; i < count; i++) {
            state = playerReducer(state, { type: 'PLAY' });
          }

          expect(state.status).toBe('playing');
          // currentTime must be untouched by PLAY dispatches
          expect(state.currentTime).toBe(10);
        }
      ),
      { numRuns: 200 }
    );
  });

  it('dispatching PAUSE multiple times always results in paused status', () => {
    // Feature: echobox-music, Property 6: Final action wins under rapid play/pause
    fc.assert(
      fc.property(
        trackArb,
        fc.integer({ min: 2, max: 10 }),
        (track, count) => {
          let state = {
            ...initialState,
            currentTrack: track,
            status: 'playing',
            currentTime: 30,
            duration: track.duration,
          };

          for (let i = 0; i < count; i++) {
            state = playerReducer(state, { type: 'PAUSE' });
          }

          expect(state.status).toBe('paused');
          expect(state.currentTime).toBe(30);
        }
      ),
      { numRuns: 200 }
    );
  });

  it('alternating PLAY/PAUSE sequence: final action status always matches the last dispatch', () => {
    // Feature: echobox-music, Property 6: Final action wins under rapid play/pause
    fc.assert(
      fc.property(
        trackArb,
        // A sequence of booleans: true = PLAY, false = PAUSE
        fc.array(fc.boolean(), { minLength: 1, maxLength: 20 }),
        (track, sequence) => {
          let state = {
            ...initialState,
            currentTrack: track,
            status: 'paused',
            currentTime: 5,
            duration: track.duration,
          };

          for (const isPlay of sequence) {
            state = playerReducer(state, { type: isPlay ? 'PLAY' : 'PAUSE' });
          }

          // The final status must match the last action in the sequence
          const lastWasPlay = sequence[sequence.length - 1];
          expect(state.status).toBe(lastWasPlay ? 'playing' : 'paused');
        }
      ),
      { numRuns: 200 }
    );
  });
});
