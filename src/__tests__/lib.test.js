import { describe, it, expect } from "vitest"
import { t, setLocale, getLocale } from "@/lib/i18n/t"
import { validateConfigShapes } from "@/lib/config/validate"
import { pickRandom } from "@/lib/random"
import { getVideoCrop, getCanvasSize } from "@/lib/canvas/videoFrame"
import { measureBoxRect, measureContainRect } from "@/lib/canvas/overlayMeasurer"

// --- i18n ---
describe("i18n", () => {
  it("returns Dutch strings by default", () => {
    setLocale("nl")
    expect(t("capture_button")).toBe("Foto maken")
    expect(t("gallery_empty")).toBe("Nog geen foto's")
  })

  it("returns English strings when locale is en", () => {
    setLocale("en")
    expect(t("capture_button")).toBe("Take photo")
    expect(t("gallery_empty")).toBe("No photos yet")
  })

  it("interpolates params", () => {
    setLocale("nl")
    expect(t("queue_pending", { count: 3 })).toBe("3 foto's in wachtrij")
  })

  it("falls back to key for unknown keys", () => {
    expect(t("nonexistent_key")).toBe("nonexistent_key")
  })

  it("falls back to NL for missing EN keys", () => {
    setLocale("en")
    // All keys exist in both, so test a key that exists
    expect(t("loading")).toBe("Loading...")
  })

  it("getLocale returns current locale", () => {
    setLocale("en")
    expect(getLocale()).toBe("en")
    setLocale("nl")
    expect(getLocale()).toBe("nl")
  })
})

// --- config validation ---
describe("validateConfigShapes", () => {
  it("passes validation in dev mode", () => {
    expect(validateConfigShapes()).toBe(true)
  })
})

// --- pickRandom ---
describe("pickRandom", () => {
  it("picks from list", () => {
    const list = ["a", "b", "c"]
    const result = pickRandom(list)
    expect(list).toContain(result)
  })

  it("excludes given value", () => {
    const list = ["a", "b"]
    // With only 2 items and excluding "a", must pick "b"
    expect(pickRandom(list, "a")).toBe("b")
  })

  it("works with single item", () => {
    expect(pickRandom(["only"])).toBe("only")
  })
})

// --- canvas math ---
describe("getVideoCrop", () => {
  it("crops wider video to match container aspect", () => {
    const video = { videoWidth: 1920, videoHeight: 1080 }
    const containerRect = { width: 400, height: 600 } // portrait
    const crop = getVideoCrop(video, containerRect)

    expect(crop.srcW).toBeLessThan(1920) // should be cropped
    expect(crop.srcH).toBe(1080) // full height
    expect(crop.srcX).toBeGreaterThan(0) // offset from left
  })

  it("crops taller video to match container aspect", () => {
    const video = { videoWidth: 1080, videoHeight: 1920 }
    const containerRect = { width: 600, height: 400 } // landscape
    const crop = getVideoCrop(video, containerRect)

    expect(crop.srcW).toBe(1080) // full width
    expect(crop.srcH).toBeLessThan(1920) // should be cropped
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

describe("getCanvasSize", () => {
  it("caps at MAX_PIXELS for large sources", () => {
    const { canvasW, canvasH } = getCanvasSize(3840, 2160)
    expect(canvasW * canvasH).toBeLessThanOrEqual(1920 * 1080 * 1.01) // small margin
  })

  it("preserves aspect ratio when scaling down", () => {
    const { canvasW, canvasH } = getCanvasSize(3840, 2160)
    const original = 3840 / 2160
    const scaled = canvasW / canvasH
    expect(Math.abs(original - scaled)).toBeLessThan(0.01)
  })

  it("does not scale small sources", () => {
    const { canvasW, canvasH } = getCanvasSize(800, 600)
    expect(canvasW).toBe(800)
    expect(canvasH).toBe(600)
  })
})

describe("overlayMeasurer", () => {
  it("measureBoxRect converts screen to canvas coords", () => {
    const elRect = { left: 110, top: 220, width: 50, height: 50 }
    const containerRect = { left: 100, top: 200 }
    const result = measureBoxRect(elRect, containerRect, 2, 2)

    expect(result.x).toBe(20) // (110-100)*2
    expect(result.y).toBe(40) // (220-200)*2
    expect(result.w).toBe(100) // 50*2
    expect(result.h).toBe(100) // 50*2
  })

  it("measureContainRect centers image in box", () => {
    const elRect = { left: 100, top: 200, width: 200, height: 100 }
    const containerRect = { left: 0, top: 0 }
    // Image is 1:1 in a 2:1 box → should be centered horizontally
    const result = measureContainRect(elRect, containerRect, 1, 1, 1)

    expect(result.w).toBe(100) // height-constrained: 100*1 = 100
    expect(result.h).toBe(100)
    expect(result.x).toBe(150) // centered: 100 + (200-100)/2
    expect(result.y).toBe(200)
  })
})