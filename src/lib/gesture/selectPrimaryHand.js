import { boxArea } from "./boxArea"

/**
 * Index (box.index) of the largest-area hand box — the "primary" hand that
 * drives sequences/swipe. Ties broken by lowest box.index. -1 if no boxes.
 * @param {Array<{index:number,width:number,height:number}>} boxes
 * @returns {number}
 */
export function selectPrimaryHand(boxes) {
  if (!boxes || boxes.length === 0) return -1
  let bestIndex = -1
  let bestArea = -1
  for (const b of boxes) {
    const area = boxArea(b)
    if (area > bestArea || (area === bestArea && bestIndex >= 0 && b.index < bestIndex)) {
      bestArea = area
      bestIndex = b.index
    }
  }
  return bestIndex
}
