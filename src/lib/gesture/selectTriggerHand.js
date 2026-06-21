import { boxArea } from "./boxArea"

/**
 * Among hands showing a trigger gesture at/above minScore, return the box.index
 * of the one with the LARGEST box (closest person wins priority). -1 if none.
 * Ties broken by lowest box.index. Boxes are matched to gestures by box.index.
 * @param {{
 *   gestures: Array<Array<{categoryName:string, score:number}>>,
 *   boxes: Array<{index:number,width:number,height:number}>,
 *   triggerGestures: Set<string>,
 *   minScore: number,
 * }} args
 * @returns {number}
 */
export function selectTriggerHand({ gestures, boxes, triggerGestures, minScore }) {
  if (!boxes || boxes.length === 0) return -1
  let bestIndex = -1
  let bestArea = -1
  for (const b of boxes) {
    const handGestures = gestures?.[b.index] || []
    const triggers = handGestures.some(
      (g) => triggerGestures.has(g.categoryName) && g.score >= minScore,
    )
    if (!triggers) continue
    const area = boxArea(b)
    if (area > bestArea || (area === bestArea && bestIndex >= 0 && b.index < bestIndex)) {
      bestArea = area
      bestIndex = b.index
    }
  }
  return bestIndex
}
