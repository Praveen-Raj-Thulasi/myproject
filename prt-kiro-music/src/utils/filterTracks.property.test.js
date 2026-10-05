import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { filterTracks } from './filterTracks.js';

// Arbitrary that generates a Track object with string title, artist, and required fields
const trackArbitrary = fc.record({
  id: fc.string({ minLength: 1, maxLength: 32 }),
  title: fc.string({ minLength: 0, maxLength: 80 }),
  artist: fc.string({ minLength: 0, maxLength: 80 }),
  album: fc.string({ minLength: 0, maxLength: 80 }),
  duration: fc.integer({ min: 0, max: 3600 }),
  src: fc.string({ minLength: 1, maxLength: 64 }),
});

const catalogArbitrary = fc.array(trackArbitrary, { minLength: 0, maxLength: 20 });

describe('filterTracks — property-based tests', () => {
  // Feature: echobox-music, Property 2: Search filter containment
  it('Property 2: every result contains the query in title or artist (case-insensitive), and every matching track is returned', () => {
    fc.assert(
      fc.property(
        catalogArbitrary,
        // Non-whitespace-only query: at least one non-space character
        fc.string({ minLength: 1, maxLength: 20 }).filter((q) => q.trim().length > 0),
        (catalog, query) => {
          const result = filterTracks(catalog, query);
          const normalizedQuery = query.toLowerCase();

          // Every returned track must match the query in title or artist
          for (const track of result) {
            const titleMatch = (track.title ?? '').toLowerCase().includes(normalizedQuery);
            const artistMatch = (track.artist ?? '').toLowerCase().includes(normalizedQuery);
            expect(titleMatch || artistMatch).toBe(true);
          }

          // Every matching track in the catalog must appear in the result
          for (const track of catalog) {
            const titleMatch = (track.title ?? '').toLowerCase().includes(normalizedQuery);
            const artistMatch = (track.artist ?? '').toLowerCase().includes(normalizedQuery);
            if (titleMatch || artistMatch) {
              expect(result).toContainEqual(track);
            }
          }
        },
      ),
      { numRuns: 200 },
    );
  });

  // Feature: echobox-music, Property 3: Empty/whitespace search returns full catalog
  it('Property 3: empty or whitespace-only query returns all tracks in the catalog', () => {
    fc.assert(
      fc.property(
        catalogArbitrary,
        // Empty string or whitespace-only string
        fc.oneof(
          fc.constant(''),
          fc.string({ minLength: 1, maxLength: 20 }).map((s) => s.replace(/./g, ' ')),
        ),
        (catalog, query) => {
          const result = filterTracks(catalog, query);

          // Result must contain every track in the catalog
          expect(result).toHaveLength(catalog.length);
          for (const track of catalog) {
            expect(result).toContainEqual(track);
          }
        },
      ),
      { numRuns: 200 },
    );
  });
});
