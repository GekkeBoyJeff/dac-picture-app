/**
 * Compute a normalised bounding box from MediaPipe hand landmarks.
 *
 * @param {Array<{x:number,y:number}>} landmarks  21 hand landmarks (0-1 range).
 * @param {boolean}                     isMirrored Whether the video feed is horizontally flipped.
 * @returns {{x:number,y:number,width:number,height:number}|null}
 */
export function computeBox(landmarks, isMirrored) {
  if (!landmarks?.length) return null

  const xs = landmarks.map((p) => p.x)
  const ys = landmarks.map((p) => p.y)

  let xMin = Math.min(...xs)
  let xMax = Math.max(...xs)
  const yMin = Math.min(...ys)
  const yMax = Math.max(...ys)

  if (isMirrored) {
    const mirroredMin = 1 - xMax
    const mirroredMax = 1 - xMin
    xMin = mirroredMin
    xMax = mirroredMax
  }

  return {
    x: Math.max(0, xMin),
    y: Math.max(0, yMin),
    width: Math.max(0, Math.min(1, xMax) - Math.max(0, xMin)),
    height: Math.max(0, Math.min(1, yMax) - Math.max(0, yMin)),
  }
}

/**
 * Geometric two-finger-victory check.
 *
 * Index (tips 8, PIP 5) and middle (tips 12, PIP 9) must be extended while
 * ring (tips 16, PIP 13) and pinky (tips 20, PIP 17) must be curled.
 *
 * @param {Array<{x:number,y:number,z?:number}>} landmarks
 * @returns {boolean}
 */
export function isTwoFingerVictory(landmarks) {
  if (!landmarks?.length) return false

  const wrist = landmarks[0]
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, (a.z || 0) - (b.z || 0))

  const isExtended = (pipIdx, tipIdx) =>
    distance(landmarks[tipIdx], wrist) - distance(landmarks[pipIdx], wrist) > 0.1

  return isExtended(5, 8) && isExtended(9, 12) && !isExtended(13, 16) && !isExtended(17, 20)
}