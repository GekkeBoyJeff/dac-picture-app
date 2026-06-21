/**
 * Whether a numHands change requires re-creating the recognizer. MediaPipe
 * does not reliably honor a changed numHands via setOptions on a live VIDEO
 * recognizer, so we re-create instead. Returns true only when next is a finite
 * number that differs from current.
 * @param {number|null|undefined} current
 * @param {number|null|undefined} next
 * @returns {boolean}
 */
export function shouldReinitNumHands(current, next) {
  if (typeof next !== "number" || !Number.isFinite(next)) return false
  return current !== next
}
