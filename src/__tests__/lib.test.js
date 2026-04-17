import { describe, it, expect } from "vitest"
import { pickRandom } from "@/lib/random"
import { getVideoCrop, getCanvasSize } from "@/lib/canvas/videoFrame"
import { measureBoxRect, measureContainRect } from "@/lib/canvas/overlayMeasurer"
import { getBackoffDelay } from "@/features/discord/lib/sendQueue"

// --- pickRandom ---
describe("pickRandom", () => {
  it("picks from list", () => {
    const list = ["a", "b", "c"]
    const result = pickRandom(list)
    expect(list).toContain(result)
  })

  it("excludes given value", () => {
    const list = ["a", "b"]
    expect(pickRandom(list, "a")).toBe("b")
  })

  it("works with single item", () => {
    expect(pickRandom(["only"])).toBe("only")
  })
})

// --- getVideoCrop ---
describe("getVideoCrop", () => {
  it("crops wider video to match container aspect", () => {
    const video = { videoWidth: 1920, videoHeight: 1080 }
    const containerRect = { width: 400, height: 600 }
    const crop = getVideoCrop(video, containerRect)

    expect(crop.srcW).toBeLessThan(1920)
    expect(crop.srcH).toBe(1080)
    expect(crop.srcX).toBeGreaterThan(0)
  })

  it("crops taller video to match container aspect", () => {
    const video = { videoWidth: 1080, videoHeight: 1920 }
    const containerRect = { width: 600, height: 400 }
    const crop = getVideoCrop(video, containerRect)

    expect(crop.srcW).toBe(1080)
    expect(crop.srcH).toBeLessThan(1920)
  })

  it("no crop needed when aspects match", () => {
    const video = { videoWidth: 1920, videoHeight: 1080 }
    const containerRect = { width: 960, height: 540 }
    const crop = getVideoCrop(video, containerRect)

    expect(crop.srcX).toBe(0)
    expect(crop.srcY).toBe(0)
    expect(crop.srcW).toBe(1920)
    expect(crop.srcH).toBe(1080)
  })
})

// --- getCanvasSize ---
describe("getCanvasSize", () => {
  it("caps at maxPixels for large sources", () => {
    const maxPixels = 1920 * 1080
    const { canvasW, canvasH } = getCanvasSize(3840, 2160, maxPixels)
    expect(canvasW * canvasH).toBeLessThanOrEqual(maxPixels * 1.01)
  })

  it("preserves aspect ratio when scaling down", () => {
    const maxPixels = 1920 * 1080
    const { canvasW, canvasH } = getCanvasSize(3840, 2160, maxPixels)
    const original = 3840 / 2160
    const scaled = canvasW / canvasH
    expect(Math.abs(original - scaled)).toBeLessThan(0.01)
  })

  it("does not scale small sources", () => {
    const maxPixels = 1920 * 1080
    const { canvasW, canvasH } = getCanvasSize(800, 600, maxPixels)
    expect(canvasW).toBe(800)
    expect(canvasH).toBe(600)
  })
})

// --- overlayMeasurer ---
describe("measureBoxRect", () => {
  it("converts screen to canvas coords", () => {
    const elRect = { left: 110, top: 220, width: 50, height: 50 }
    const containerRect = { left: 100, top: 200 }
    const result = measureBoxRect(elRect, containerRect, 2, 2)

    expect(result.x).toBe(20)
    expect(result.y).toBe(40)
    expect(result.w).toBe(100)
    expect(result.h).toBe(100)
  })
})

describe("measureContainRect", () => {
  it("centers image in box", () => {
    const elRect = { left: 100, top: 200, width: 200, height: 100 }
    const containerRect = { left: 0, top: 0 }
    const result = measureContainRect(elRect, containerRect, 1, 1, 1)

    expect(result.w).toBe(100)
    expect(result.h).toBe(100)
    expect(result.x).toBe(150)
    expect(result.y).toBe(200)
  })
})

// --- getBackoffDelay ---
describe("getBackoffDelay", () => {
  it("returns a positive delay", () => {
    expect(getBackoffDelay(0)).toBeGreaterThan(0)
  })

  it("increases with attempts", () => {
    expect(getBackoffDelay(5)).toBeGreaterThanOrEqual(1200)
  })

  it("caps at maximum delay", () => {
    const d = getBackoffDelay(100)
    expect(d).toBeLessThanOrEqual(15600)
  })
})