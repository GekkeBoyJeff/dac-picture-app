import { create } from "zustand"
import { persist } from "zustand/middleware"
import { DEFAULT_GESTURE_HOLD_MS } from "@/lib/config"

export const useUiStore = create(
  persist(
    (set) => ({
      // --- App phase (not persisted) ---
      appState: "camera", // "camera" | "countdown" | "capturing"

      // --- Modal state (not persisted) ---
      modals: {
        gallery: false,
        mascotPicker: false,
        layoutPicker: false,
        layoutSlider: false,
        about: false,
        settings: false,
      },

      // --- Settings (persisted) ---
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

      // --- Actions ---
      setAppState: (appState) => set({ appState }),

      openModal: (name) =>
        set((state) => ({
          modals: { ...state.modals, [name]: true },
        })),

      closeModal: (name) =>
        set((state) => ({
          modals: { ...state.modals, [name]: false },
        })),

      closeAllModals: () =>
        set({
          modals: {
            gallery: false,
            mascotPicker: false,
            layoutPicker: false,
            layoutSlider: false,
            about: false,
            settings: false,
          },
        }),

      toggleDebug: () => set((state) => ({ debugEnabled: !state.debugEnabled })),
      toggleGestures: () => set((state) => ({ gesturesEnabled: !state.gesturesEnabled })),
      toggleStripMode: () => set((state) => ({ stripModeEnabled: !state.stripModeEnabled })),
      toggleFlash: () => set((state) => ({ flashEnabled: !state.flashEnabled })),
      toggleForceLowPower: () =>
        set((state) => {
          const enabling = !state.forceLowPower
          if (enabling) {
            // Enforce low-power defaults
            return {
              forceLowPower: true,
              lowPowerOverride: false,
              gesturesEnabled: false,
              detectionIntervalMs: 400,
              triggerMinScore: 0.5,
              numHands: 2,
              minDetectionConfidence: 0.65,
              minPresenceConfidence: 0.65,
              minTrackingConfidence: 0.6,
            }
          }
          return { forceLowPower: false }
        }),
      toggleLowPowerOverride: () => set((state) => ({ lowPowerOverride: !state.lowPowerOverride })),
      setDetectionInterval: (detectionIntervalMs) => set({ detectionIntervalMs }),
      setNumHands: (numHands) => set({ numHands }),
      setMinDetectionConfidence: (minDetectionConfidence) => set({ minDetectionConfidence }),
      setMinPresenceConfidence: (minPresenceConfidence) => set({ minPresenceConfidence }),
      setMinTrackingConfidence: (minTrackingConfidence) => set({ minTrackingConfidence }),
      applyScenePreset: (preset) =>
        set({
          numHands: preset.numHands,
          minDetectionConfidence: preset.minDetectionConfidence,
          minPresenceConfidence: preset.minPresenceConfidence,
          minTrackingConfidence: preset.minTrackingConfidence,
        }),
      setTriggerScore: (triggerMinScore) => set({ triggerMinScore }),
      setGestureHold: (gestureHoldMs) => set({ gestureHoldMs }),
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