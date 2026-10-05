/**
 * Formats a duration in seconds into a "M+:SS" string with zero-padded seconds.
 * Returns "0:00" for any non-finite, NaN, or negative input.
 *
 * @param {number} s
 * @returns {string}
 */
export function formatDuration(s) {
  if (!isFinite(s) || isNaN(s) || s < 0) return '0:00';
  const totalSeconds = Math.floor(s);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
