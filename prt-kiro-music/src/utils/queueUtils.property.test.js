// Feature: echobox-music, Property 7: Seek percentage is always in range
// Feature: echobox-music, Property 8: Seek clamp always produces valid position

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { seekPercent, clampSeek } from './queueUtils.js';

/**
 * Property 7: Seek percentage is always in range
 * Validates: Requirements 4.1
 *
 * For any current time t in [0, d] and duration d > 0,
 * seekPercent(t, d) must be a number in [0, 100] and equal (t / d) * 100.
 *
 * When d <= 0, result must be 0.
 */
describe('seekPercent — Property 7: Seek percentage is always in range', () => {
  it('returns a value in [0, 100] and equals (t/d)*100 for any valid t in [0, d] with d > 0', () => {
    // Use two correlated arbitraries: generate d first, then t in [0, d]
    const validPair = fc
      .float({ min: Number.EPSILON, max: 1e6, noNaN: true })
      .chain((d) =>
        fc.tuple(
          fc.constant(d),
          fc.float({ min: 0, max: d, noNaN: true })
        )
      );

    fc.assert(
      fc.property(validPair, ([d, t]) => {
        const result = seekPercent(t, d);

        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThanOrEqual(100);
        expect(result).toBeCloseTo((t / d) * 100, 5);
      }),
      { numRuns: 200 }
    );
  });

  it('returns 0 when duration is 0', () => {
    fc.assert(
      fc.property(
        fc.float({ noNaN: true }),
        (t) => {
          expect(seekPercent(t, 0)).toBe(0);
        }
      )
    );
  });

  it('returns 0 when duration is negative', () => {
    fc.assert(
      fc.property(
        fc.float({ noNaN: true }),
        fc.float({ max: -Number.EPSILON, noNaN: true }),
        (t, d) => {
          expect(seekPercent(t, d)).toBe(0);
        }
      )
    );
  });

  it('returns 0 when duration is -Infinity (covered by d <= 0 guard)', () => {
    // -Infinity <= 0 is true, so the guard returns 0
    expect(seekPercent(100, -Infinity)).toBe(0);
    expect(seekPercent(0, -Infinity)).toBe(0);
  });
});

/**
 * Property 8: Seek clamp always produces valid position
 * Validates: Requirements 4.3
 *
 * For any seek target value (including negative numbers, values above duration,
 * NaN, and Infinity) and any valid duration d > 0,
 * clampSeek(target, d) must return a finite number in [0, d].
 */
describe('clampSeek — Property 8: Seek clamp always produces valid position', () => {
  it('always returns a finite value in [0, duration] for arbitrary float targets', () => {
    fc.assert(
      fc.property(
        // arbitrary float target including NaN
        fc.float({ noNaN: false }),
        // valid positive finite duration
        fc.float({ min: Number.EPSILON, max: 1e6, noNaN: true }),
        (target, duration) => {
          const result = clampSeek(target, duration);

          // Result must be a finite number (no NaN, no Infinity)
          expect(Number.isFinite(result)).toBe(true);

          // Result must be in [0, duration]
          expect(result).toBeGreaterThanOrEqual(0);
          expect(result).toBeLessThanOrEqual(duration);
        }
      ),
      { numRuns: 200 }
    );
  });

  it('clamps negative targets to 0', () => {
    fc.assert(
      fc.property(
        fc.float({ max: -Number.EPSILON, noNaN: true }),
        fc.float({ min: Number.EPSILON, max: 1e6, noNaN: true }),
        (target, duration) => {
          expect(clampSeek(target, duration)).toBe(0);
        }
      )
    );
  });

  it('clamps targets above duration to duration', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 1e6, noNaN: true }),
        (duration) => {
          // target strictly greater than duration
          const target = duration + 1;
          expect(clampSeek(target, duration)).toBe(duration);
        }
      )
    );
  });

  it('returns 0 for NaN target', () => {
    expect(clampSeek(NaN, 100)).toBe(0);
    expect(clampSeek(NaN, 0)).toBe(0);
  });

  it('clamps Infinity target to duration, clamps -Infinity to 0', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 1e6, noNaN: true }),
        (duration) => {
          expect(clampSeek(Infinity, duration)).toBe(duration);
          expect(clampSeek(-Infinity, duration)).toBe(0);
        }
      )
    );
  });

  it('preserves targets that are already within [0, duration]', () => {
    // Generate a duration, then a target in [0, duration] — both as correlated floats
    const validPair = fc
      .float({ min: Number.EPSILON, max: 1e6, noNaN: true })
      .chain((d) =>
        fc.tuple(
          fc.constant(d),
          fc.float({ min: 0, max: d, noNaN: true })
        )
      );

    fc.assert(
      fc.property(validPair, ([duration, target]) => {
        expect(clampSeek(target, duration)).toBe(target);
      }),
      { numRuns: 200 }
    );
  });
});
