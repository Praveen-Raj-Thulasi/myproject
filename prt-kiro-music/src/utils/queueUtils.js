/**
 * Clamps a seek target to [0, duration].
 * Returns 0 for NaN/Infinity/negative inputs, and 0 if duration is invalid.
 *
 * @param {number} target
 * @param {number} duration
 * @returns {number}
 */
export function clampSeek(target, duration) {
  // NaN is unrecoverable — return 0
  if (isNaN(target)) return 0;
  // Invalid duration — nothing to clamp to
  if (isNaN(duration) || !isFinite(duration) || duration <= 0) return 0;
  // Now clamp: negative or -Infinity → 0, above duration or +Infinity → duration
  if (target < 0) return 0;
  if (target > duration) return duration;
  return target;
}

/**
 * Calculates playback position as a percentage of total duration.
 *
 * @param {number} currentTime
 * @param {number} duration
 * @returns {number} Value in [0, 100], or 0 if duration is 0 or negative
 */
export function seekPercent(currentTime, duration) {
  if (duration <= 0) return 0;
  return Math.min(100, Math.max(0, (currentTime / duration) * 100));
}

/**
 * Returns the index of the next track, or null if the queue is exhausted.
 *
 * @param {{ tracks: Array, currentIndex: number }} queue
 * @returns {number|null}
 */
export function nextTrack(queue) {
  if (!queue || queue.tracks.length === 0) return null;
  const next = queue.currentIndex + 1;
  if (next >= queue.tracks.length) return null;
  return next;
}

/**
 * Returns the index of the previous track, or null if at the start.
 *
 * @param {{ tracks: Array, currentIndex: number }} queue
 * @returns {number|null}
 */
export function previousTrack(queue) {
  if (!queue || queue.tracks.length === 0) return null;
  if (queue.currentIndex <= 0) return null;
  return queue.currentIndex - 1;
}

/**
 * Builds a queue from a playlist, starting at track 0.
 *
 * @param {{ id: string, tracks: Array }} playlist
 * @returns {{ tracks: Array, currentIndex: number, sourceId: string }}
 */
export function populateQueueFromPlaylist(playlist) {
  return {
    tracks: [...playlist.tracks],
    currentIndex: 0,
    sourceId: playlist.id,
  };
}
