import { describe, it, expect, beforeEach } from "vitest"

// --- cameraStore ---
describe("cameraStore", () => {
  let useCameraStore

  beforeEach(async () => {
    const mod = await import("@/features/camera/store")
    useCameraStore = mod.useCameraStore
    useCameraStore.setState({
      isReady: false,
      isRecalibrating: false,
      isSwitching: false,
      isMirrored: true,
      error: null,
      devices: [],
      selectedDeviceId: null,
    })
  })

  it("initializes with default state", () => {
    const state = useCameraStore.getState()
    expect(state.isReady).toBe(false)
    expect(state.isMirrored).toBe(true)
    expect(state.error).toBeNull()
    expect(state.devices).toEqual([])
  })

  it("setReady updates isReady", () => {
    useCameraStore.getState().setReady(true)
    expect(useCameraStore.getState().isReady).toBe(true)
  })

  it("setError stores error message", () => {
    useCameraStore.getState().setError("Camera niet gevonden")
    expect(useCameraStore.getState().error).toBe("Camera niet gevonden")
  })

  it("setDevices stores device list", () => {
    const devices = [
      { deviceId: "abc", label: "Front Camera" },
      { deviceId: "def", label: "Back Camera" },
    ]
    useCameraStore.getState().setDevices(devices)
    expect(useCameraStore.getState().devices).toHaveLength(2)
    expect(useCameraStore.getState().devices[0].label).toBe("Front Camera")
  })
})

// --- uiStore ---
describe("uiStore", () => {
  let useUiStore

  beforeEach(async () => {
    const mod = await import("@/stores/uiStore")
    useUiStore = mod.useUiStore
    useUiStore.setState({
      appState: "camera",
      modals: {
        gallery: false,
        mascotPicker: false,
        layoutPicker: false,
        layoutSlider: false,
        about: false,
        settings: false,
      },
      debugEnabled: false,
      gesturesEnabled: true,
      detectionIntervalMs: 120,
      triggerMinScore: 0.35,
      gestureHoldMs: 1500,
    })
  })

  it("initializes with camera appState", () => {
    expect(useUiStore.getState().appState).toBe("camera")
  })

  it("setAppState transitions correctly", () => {
    useUiStore.getState().setAppState("countdown")
    expect(useUiStore.getState().appState).toBe("countdown")
    useUiStore.getState().setAppState("capturing")
    expect(useUiStore.getState().appState).toBe("capturing")
  })

  it("openModal / closeModal toggle individual modals", () => {
    useUiStore.getState().openModal("gallery")
    expect(useUiStore.getState().modals.gallery).toBe(true)
    expect(useUiStore.getState().modals.settings).toBe(false)

    useUiStore.getState().closeModal("gallery")
    expect(useUiStore.getState().modals.gallery).toBe(false)
  })

  it("closeAllModals resets everything", () => {
    useUiStore.getState().openModal("gallery")
    useUiStore.getState().openModal("settings")
    useUiStore.getState().closeAllModals()

    const modals = useUiStore.getState().modals
    expect(Object.values(modals).every((v) => v === false)).toBe(true)
  })

  it("toggleDebug flips debugEnabled", () => {
    expect(useUiStore.getState().debugEnabled).toBe(false)
    useUiStore.getState().toggleDebug()
    expect(useUiStore.getState().debugEnabled).toBe(true)
    useUiStore.getState().toggleDebug()
    expect(useUiStore.getState().debugEnabled).toBe(false)
  })
})

// --- overlayStore ---
describe("overlayStore", () => {
  let useOverlayStore, selectLayout, selectMascot

  beforeEach(async () => {
    const mod = await import("@/features/overlay/store")
    useOverlayStore = mod.useOverlayStore
    selectLayout = mod.selectLayout
    selectMascot = mod.selectMascot
    useOverlayStore.setState({ layoutId: "classic", mascotId: "amelia" })
  })

  it("initializes with classic layout and amelia mascot", () => {
    const state = useOverlayStore.getState()
    expect(state.layoutId).toBe("classic")
    expect(state.mascotId).toBe("amelia")
  })

  it("selectLayout resolves the layout object", () => {
    const layout = selectLayout(useOverlayStore.getState())
    expect(layout.id).toBe("classic")
    expect(layout.name).toBe("Classic")
  })

  it("selectMascot resolves the mascot object", () => {
    const mascot = selectMascot(useOverlayStore.getState())
    expect(mascot.id).toBe("amelia")
    expect(mascot.name).toBe("Amelia")
  })

  it("setLayoutId changes layout", () => {
    useOverlayStore.getState().setLayoutId("flipped")
    expect(useOverlayStore.getState().layoutId).toBe("flipped")
    const layout = selectLayout(useOverlayStore.getState())
    expect(layout.name).toBe("Flipped")
  })

  it("setMascotId changes mascot", () => {
    useOverlayStore.getState().setMascotId("amelia-v2")
    const mascot = selectMascot(useOverlayStore.getState())
    expect(mascot.name).toBe("Amelia v2")
  })

  it("falls back to first layout for unknown id", () => {
    useOverlayStore.setState({ layoutId: "nonexistent" })
    const layout = selectLayout(useOverlayStore.getState())
    expect(layout.id).toBe("classic")
  })
})