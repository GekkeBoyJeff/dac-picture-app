/**
 * Area of a normalized hand bounding box. Returns 0 for a null box or one
 * missing width/height (treated as "no box, cannot win arbitration").
 * @param {{width?:number, height?:number}|null} box
 * @returns {number}
 */
export function boxArea(box) {
  if (!box || typeof box.width !== "number" || typeof box.height !== "number") return 0
  return box.width * box.height
}
