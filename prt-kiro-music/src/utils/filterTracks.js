/**
 * Filters a track catalog by a search query.
 *
 * Returns tracks whose `title` or `artist` contains `query` as a
 * case-insensitive substring. An empty or whitespace-only `query`
 * returns the full catalog unchanged.
 *
 * @param {import('../data/catalog').Track[]} catalog - The full track list
 * @param {string} query - The search string
 * @returns {import('../data/catalog').Track[]} Filtered array of tracks
 */
export function filterTracks(catalog, query) {
  if (!query || query.trim() === '') {
    return catalog;
  }

  const normalizedQuery = query.toLowerCase();

  return catalog.filter((track) => {
    const titleMatch = track.title?.toLowerCase().includes(normalizedQuery);
    const artistMatch = track.artist?.toLowerCase().includes(normalizedQuery);
    return titleMatch || artistMatch;
  });
}
