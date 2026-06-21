// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useIsTouch } from "@/hooks/useIsTouch"

function mockMatchMedia(matchesByQuery) {
  const listeners = new Set()
  const mql = (query) => ({
    matches: !!matchesByQuery[query],
    media: query,
    addEventListener: (_e, cb) => listeners.add(cb),
    removeEventListener: (_e, cb) => listeners.delete(cb),
  })
  window.matchMedia = vi.fn(mql)
  return {
    fire: () => listeners.forEach((cb) => cb()),
  }
}

describe("useIsTouch", () => {
  let originalMM
  let originalMTP
  beforeEach(() => {
    originalMM = window.matchMedia
    originalMTP = Object.getOwnPropertyDescriptor(navigator, "maxTouchPoints")
  })
  afterEach(() => {
    window.matchMedia = originalMM
    if (originalMTP) Object.defineProperty(navigator, "maxTouchPoints", originalMTP)
  })

  it("returns false when not a touch device", () => {
    mockMatchMedia({})
    Object.defineProperty(navigator, "maxTouchPoints", { value: 0, configurable: true })
    const { result } = renderHook(() => useIsTouch())
    expect(result.current).toBe(false)
  })

  it("returns true when pointer is coarse", () => {
    mockMatchMedia({ "(pointer: coarse)": true })
    Object.defineProperty(navigator, "maxTouchPoints", { value: 0, configurable: true })
    const { result } = renderHook(() => useIsTouch())
    expect(result.current).toBe(true)
  })

  it("returns true when hover is none", () => {
    mockMatchMedia({ "(hover: none)": true })
    Object.defineProperty(navigator, "maxTouchPoints", { value: 0, configurable: true })
    const { result } = renderHook(() => useIsTouch())
    expect(result.current).toBe(true)
  })

  it("returns true when navigator.maxTouchPoints > 0", () => {
    mockMatchMedia({})
    Object.defineProperty(navigator, "maxTouchPoints", { value: 5, configurable: true })
    const { result } = renderHook(() => useIsTouch())
    expect(result.current).toBe(true)
  })

  it("updates when the media query changes", () => {
    const matches = { "(pointer: coarse)": false }
    const ctrl = mockMatchMediaDynamic(matches)
    Object.defineProperty(navigator, "maxTouchPoints", { value: 0, configurable: true })
    const { result } = renderHook(() => useIsTouch())
    expect(result.current).toBe(false)
    act(() => {
      matches["(pointer: coarse)"] = true
      ctrl.fire()
    })
    expect(result.current).toBe(true)
  })
})

function mockMatchMediaDynamic(matchesByQuery) {
  const listeners = new Set()
  window.matchMedia = vi.fn((query) => ({
    get matches() {
      return !!matchesByQuery[query]
    },
    media: query,
    addEventListener: (_e, cb) => listeners.add(cb),
    removeEventListener: (_e, cb) => listeners.delete(cb),
  }))
  return { fire: () => listeners.forEach((cb) => cb()) }
}