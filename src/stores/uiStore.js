import { create } from "zustand"
import { persist } from "zustand/middleware"
import { DEFAULT_GESTURE_HOLD_MS } from "@/lib/config"

const INITIAL_MODALS = {
  gallery: false,
  mascotPicker: false,
  layoutPicker: false,
  layoutSlider: false,
  about: false,
  settings: false,
}

const LOW_POWER_SETTINGS = {
  debugEnabled: false,
  gesturesEnabled: false,
  stripModeEnabled: false,
  forceLowPower: true,
  lowPowerOverride: false,
  detectionIntervalMs: 400,
  triggerMinScore: 0.5,
  numHands: 2,
  minDetectionConfidence: 0.65,
  minPresenceConfidence: 0.65,
  minTrackingConfidence: 0.6,
}

const HIGH_POWER_SETTINGS = {
  forceLowPower: false,
  lowPowerOverride: false,
  gesturesEnabled: true,
  detectionIntervalMs: 0,
  triggerMinScore: 0.25,
  numHands: 8,
  minDetectionConfidence: 0.4,
  minPresenceConfidence: 0.4,
  minTrackingConfidence: 0.4,
}

export const useUiStore = create(
  persist(
    (set) => ({
      // -- App phase (not persisted) --
      appState: "camera",

      // -- Modal state (not persisted) --
      modals: { ...INITIAL_MODALS },

      // -- Settings (persisted) --
      debugEnabled: false,
      gesturesEnabled: false,
      stripModeEnabled: false,
      flashEnabled: true,
      forceLowPower: false,
      lowPowerOverride: false,
      detectionIntervalMs: 0,
      numHands: 8,
      minDetectionConfidence: 0.4,
      minPresenceConfidence: 0.4,
      minTrackingConfidence: 0.4,
      triggerMinScore: 0.25,
      gestureHoldMs: DEFAULT_GESTURE_HOLD_MS,

      // -- Actions --
      setAppState: (appState) => set({ appState }),

      openModal: (name) =>
        set((state) => ({
          modals: { ...state.modals, [name]: true },
        })),

      closeModal: (name) =>
        set((state) => ({
          modals: { ...state.modals, [name]: false },
        })),

      closeAllModals: () => set({ modals: { ...INITIAL_MODALS } }),

      toggleDebug: () => set((s) => ({ debugEnabled: !s.debugEnabled })),
      toggleGestures: () => set((s) => ({ gesturesEnabled: !s.gesturesEnabled })),
      toggleStripMode: () => set((s) => ({ stripModeEnabled: !s.stripModeEnabled })),
      toggleFlash: () => set((s) => ({ flashEnabled: !s.flashEnabled })),

      applyLowPowerPreset: () => set({ ...LOW_POWER_SETTINGS }),
      applyHighPowerPreset: () => set({ ...HIGH_POWER_SETTINGS }),

      toggleForceLowPower: () =>
        set((state) => {
          const enabling = !state.forceLowPower
          return enabling ? { ...LOW_POWER_SETTINGS } : { ...HIGH_POWER_SETTINGS }
        }),

      toggleLowPowerOverride: () => set((s) => ({ lowPowerOverride: !s.lowPowerOverride })),

      setDetectionInterval: (detectionIntervalMs) => set({ detectionIntervalMs }),
      setNumHands: (numHands) => set({ numHands }),
      setMinDetectionConfidence: (minDetectionConfidence) => set({ minDetectionConfidence }),
      setMinPresenceConfidence: (minPresenceConfidence) => set({ minPresenceConfidence }),
      setMinTrackingConfidence: (minTrackingConfidence) => set({ minTrackingConfidence }),
      setTriggerScore: (triggerMinScore) => set({ triggerMinScore }),
      setGestureHold: (gestureHoldMs) => set({ gestureHoldMs }),

      applyScenePreset: (preset) =>
        set({
          numHands: preset.numHands,
          minDetectionConfidence: preset.minDetectionConfidence,
          minPresenceConfidence: preset.minPresenceConfidence,
          minTrackingConfidence: preset.minTrackingConfidence,
        }),
    }),
    {
      name: "ui-settings",
      partialize: (state) => ({
        debugEnabled: state.debugEnabled,
        gesturesEnabled: state.gesturesEnabled,
        stripModeEnabled: state.stripModeEnabled,
        flashEnabled: state.flashEnabled,
        forceLowPower: state.forceLowPower,
        lowPowerOverride: state.lowPowerOverride,
        detectionIntervalMs: state.detectionIntervalMs,
        numHands: state.numHands,
        minDetectionConfidence: state.minDetectionConfidence,
        minPresenceConfidence: state.minPresenceConfidence,
        minTrackingConfidence: state.minTrackingConfidence,
        triggerMinScore: state.triggerMinScore,
        gestureHoldMs: state.gestureHoldMs,
      }),
    },
  ),
)

// -- Selectors --

export const selectAppState = (state) => state.appState
export const selectModals = (state) => state.modals
export const selectDebugEnabled = (state) => state.debugEnabled
export const selectGesturesEnabled = (state) => state.gesturesEnabled
export const selectStripModeEnabled = (state) => state.stripModeEnabled
export const selectFlashEnabled = (state) => state.flashEnabled
export const selectForceLowPower = (state) => state.forceLowPower
export const selectLowPowerOverride = (state) => state.lowPowerOverride
export const selectGestureHoldMs = (state) => state.gestureHoldMs