// Feature: echobox-music, Property 11: Queue navigation correctness and boundary behavior

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { nextTrack, previousTrack } from './queueUtils.js';

/**
 * Property 11: Queue navigation correctness and boundary behavior
 * Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5
 *
 * For any queue of length n >= 1 and current index i:
 * - If i < n - 1, nextTrack(queue) must return i + 1
 * - If i === n - 1 (last track), nextTrack(queue) must return null
 * - If i > 0, previousTrack(queue) must return i - 1
 * - If i === 0 (first track), previousTrack(queue) must return null
 * - If the queue is empty (n === 0), both must return null
 */

/** Minimal track arbitrary — only the shape matters for queue navigation */
const trackArb = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 1 }),
  artist: fc.string({ minLength: 1 }),
  album: fc.string(),
  duration: fc.nat({ max: 3600 }),
  src: fc.string({ minLength: 1 }),
});

describe('nextTrack / previousTrack — Property 11: Queue navigation correctness and boundary behavior', () => {
  it('nextTrack returns currentIndex + 1 when not at the last position', () => {
    // Requirements 6.1: pressing next loads the next track in the Queue
    fc.assert(
      fc.property(
        fc.array(trackArb, { minLength: 2, maxLength: 20 }),
        fc.integer({ min: 0 }),
        (tracks, rawIndex) => {
          // Keep index within [0, tracks.length - 2] — guaranteed to have a next track
          const currentIndex = rawIndex % (tracks.length - 1);
          const queue = { tracks, currentIndex, sourceId: null };

          expect(nextTrack(queue)).toBe(currentIndex + 1);
        }
      ),
      { numRuns: 200 }
    );
  });

  it('nextTrack returns null when at the last position', () => {
    // Requirements 6.3: last track + next → stop and clear active track state
    fc.assert(
      fc.property(
        fc.array(trackArb, { minLength: 1, maxLength: 20 }),
        (tracks) => {
          const currentIndex = tracks.length - 1;
          const queue = { tracks, currentIndex, sourceId: null };

          expect(nextTrack(queue)).toBeNull();
        }
      ),
      { numRuns: 200 }
    );
  });

  it('previousTrack returns currentIndex - 1 when not at the first position', () => {
    // Requirements 6.2: pressing previous loads the previous track in the Queue
    fc.assert(
      fc.property(
        fc.array(trackArb, { minLength: 2, maxLength: 20 }),
        fc.integer({ min: 0 }),
        (tracks, rawIndex) => {
          // Keep index within [1, tracks.length - 1] — guaranteed to have a previous track
          const currentIndex = (rawIndex % (tracks.length - 1)) + 1;
          const queue = { tracks, currentIndex, sourceId: null };

          expect(previousTrack(queue)).toBe(currentIndex - 1);
        }
      ),
      { numRuns: 200 }
    );
  });

  it('previousTrack returns null when at the first position (index 0)', () => {
    // Requirements 6.4: first track + previous → stop and clear active track state
    fc.assert(
      fc.property(
        fc.array(trackArb, { minLength: 1, maxLength: 20 }),
        (tracks) => {
          const queue = { tracks, currentIndex: 0, sourceId: null };

          expect(previousTrack(queue)).toBeNull();
        }
      ),
      { numRuns: 200 }
    );
  });

  it('both nextTrack and previousTrack return null for an empty queue', () => {
    // Requirements 6.5: empty queue → ignore input, retain current playback state
    fc.assert(
      fc.property(
        fc.integer({ min: -5, max: 5 }),
        (currentIndex) => {
          const queue = { tracks: [], currentIndex, sourceId: null };

          expect(nextTrack(queue)).toBeNull();
          expect(previousTrack(queue)).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });
});
