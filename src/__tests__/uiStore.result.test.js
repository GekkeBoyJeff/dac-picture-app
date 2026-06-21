// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from "vitest"

describe("uiStore — result state + capturedPhoto", () => {
  let useUiStore

  beforeEach(async () => {
    // Mock localStorage and storage APIs BEFORE importing the store
    const mockStorage = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    }
    global.localStorage = mockStorage
    // Also provide a getStorage function in case anything checks for it
    global.window = { localStorage: mockStorage }

    // Clear module cache and re-import with storage available
    vi.resetModules()
    const mod = await import("@/stores/uiStore")
    useUiStore = mod.useUiStore
    useUiStore.setState({ appState: "camera", capturedPhoto: null })
  })

  it("defaults capturedPhoto to null", () => {
    expect(useUiStore.getState().capturedPhoto).toBeNull()
  })

  it("setCapturedPhoto stores the photo descriptor", () => {
    useUiStore.getState().setCapturedPhoto({ url: "blob:abc", isStrip: true })
    expect(useUiStore.getState().capturedPhoto).toEqual({ url: "blob:abc", isStrip: true })
  })

  it("setCapturedPhoto(null) clears it", () => {
    useUiStore.getState().setCapturedPhoto({ url: "blob:abc", isStrip: false })
    useUiStore.getState().setCapturedPhoto(null)
    expect(useUiStore.getState().capturedPhoto).toBeNull()
  })

  it("setAppState accepts result", () => {
    useUiStore.getState().setAppState("result")
    expect(useUiStore.getState().appState).toBe("result")
  })

  it("does not persist appState or capturedPhoto", () => {
    const persisted = useUiStore.persist.getOptions().partialize({
      appState: "result",
      capturedPhoto: { url: "blob:x", isStrip: false },
      flashEnabled: true,
      gesturesEnabled: false,
    })
    expect("appState" in persisted).toBe(false)
    expect("capturedPhoto" in persisted).toBe(false)
    expect(persisted.flashEnabled).toBe(true)
  })
})