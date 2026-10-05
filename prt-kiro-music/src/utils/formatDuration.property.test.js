// Feature: echobox-music, Property 1: Duration formatting correctness

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { formatDuration } from './formatDuration.js';

/**
 * Property 1: Duration formatting correctness
 * Validates: Requirements 1.2, 4.5
 *
 * For any non-negative integer number of seconds s in [0, 86399]:
 * - The returned string has the form "M+:SS"
 * - The minutes part equals Math.floor(s / 60)
 * - The seconds part equals s % 60, zero-padded to two digits
 */
describe('formatDuration — Property 1: Duration formatting correctness', () => {
  it('formats any valid duration into the correct M+:SS representation', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 86399 }),
        (s) => {
          const result = formatDuration(s);

          const expectedMinutes = Math.floor(s / 60);
          const expectedSeconds = s % 60;
          const expectedSecondsStr = expectedSeconds.toString().padStart(2, '0');

          // Overall shape: one or more digits, colon, exactly two digits
          expect(result).toMatch(/^\d+:\d{2}$/);

          // Split and verify each part
          const [minutesPart, secondsPart] = result.split(':');

          expect(Number(minutesPart)).toBe(expectedMinutes);
          expect(secondsPart).toBe(expectedSecondsStr);
        }
      ),
      { numRuns: 200 }
    );
  });
});
