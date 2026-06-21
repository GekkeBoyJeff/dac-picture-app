import { describe, it, expect } from "vitest"
import { boxArea } from "@/lib/gesture/boxArea"
import { selectTriggerHand } from "@/lib/gesture/selectTriggerHand"
import { selectPrimaryHand } from "@/lib/gesture/selectPrimaryHand"
import { shouldReinitNumHands } from "@/lib/gesture/shouldReinitNumHands"

const box = (index, w, h) => ({ index, x: 0, y: 0, width: w, height: h })
const TRIGGERS = new Set(["Victory", "ILoveYou", "Deuces"])

describe("boxArea", () => {
  it("multiplies width by height", () => {
    expect(boxArea({ x: 0, y: 0, width: 0.4, height: 0.5 })).toBeCloseTo(0.2)
  })
  it("returns 0 for null or dimensionless box", () => {
    expect(boxArea(null)).toBe(0)
    expect(boxArea({ x: 0, y: 0 })).toBe(0)
  })
})

describe("selectPrimaryHand", () => {
  it("returns -1 for no boxes", () => {
    expect(selectPrimaryHand([])).toBe(-1)
  })
  it("picks the largest-area box index", () => {
    const boxes = [box(0, 0.2, 0.2), box(1, 0.5, 0.5), box(2, 0.3, 0.3)]
    expect(selectPrimaryHand(boxes)).toBe(1)
  })
  it("breaks ties by lowest index", () => {
    const boxes = [box(2, 0.4, 0.4), box(0, 0.4, 0.4)]
    expect(selectPrimaryHand(boxes)).toBe(0)
  })
})

describe("selectTriggerHand", () => {
  it("returns -1 when no hand shows a trigger gesture", () => {
    const gestures = [[{ categoryName: "Open_Palm", score: 0.9 }]]
    const boxes = [box(0, 0.5, 0.5)]
    expect(selectTriggerHand({ gestures, boxes, triggerGestures: TRIGGERS, minScore: 0.35 })).toBe(-1)
  })
  it("ignores trigger gestures below minScore", () => {
    const gestures = [[{ categoryName: "Victory", score: 0.2 }]]
    const boxes = [box(0, 0.5, 0.5)]
    expect(selectTriggerHand({ gestures, boxes, triggerGestures: TRIGGERS, minScore: 0.35 })).toBe(-1)
  })
  it("picks the LARGEST-box triggering hand, not the highest score", () => {
    const gestures = [
      [{ categoryName: "Victory", score: 0.95 }],
      [{ categoryName: "Victory", score: 0.5 }],
    ]
    const boxes = [box(0, 0.1, 0.1), box(1, 0.6, 0.6)]
    expect(selectTriggerHand({ gestures, boxes, triggerGestures: TRIGGERS, minScore: 0.35 })).toBe(1)
  })
  it("breaks box-area ties by lowest index", () => {
    const gestures = [
      [{ categoryName: "Victory", score: 0.5 }],
      [{ categoryName: "Deuces", score: 0.5 }],
    ]
    const boxes = [box(0, 0.4, 0.4), box(1, 0.4, 0.4)]
    expect(selectTriggerHand({ gestures, boxes, triggerGestures: TRIGGERS, minScore: 0.35 })).toBe(0)
  })
  it("matches boxes to gestures by box.index, not array position", () => {
    const gestures = [
      [{ categoryName: "Open_Palm", score: 0.9 }],
      [{ categoryName: "Victory", score: 0.6 }],
    ]
    const boxes = [box(1, 0.5, 0.5)]
    expect(selectTriggerHand({ gestures, boxes, triggerGestures: TRIGGERS, minScore: 0.35 })).toBe(1)
  })
})

describe("shouldReinitNumHands", () => {
  it("re-inits when the count changes", () => {
    expect(shouldReinitNumHands(2, 6)).toBe(true)
  })
  it("does not re-init when the count is unchanged", () => {
    expect(shouldReinitNumHands(6, 6)).toBe(false)
  })
  it("does not re-init on null/undefined next", () => {
    expect(shouldReinitNumHands(6, null)).toBe(false)
    expect(shouldReinitNumHands(6, undefined)).toBe(false)
  })
  it("re-inits from null current to a real next", () => {
    expect(shouldReinitNumHands(null, 4)).toBe(true)
  })
})