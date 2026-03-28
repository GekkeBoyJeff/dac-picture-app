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
      detectionIntervalMs: 120,
      triggerMinScore: 0.35,
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
      setDetectionInterval: (detectionIntervalMs) => set({ detectionIntervalMs }),
      setTriggerScore: (triggerMinScore) => set({ triggerMinScore }),
      setGestureHold: (gestureHoldMs) => set({ gestureHoldMs }),
    }),
    {
      name: "ui-settings",
      partialize: (state) => ({
        debugEnabled: state.debugEnabled,
        gesturesEnabled: state.gesturesEnabled,
        stripModeEnabled: state.stripModeEnabled,
        detectionIntervalMs: state.detectionIntervalMs,
        triggerMinScore: state.triggerMinScore,
        gestureHoldMs: state.gestureHoldMs,
      }),
    },
  ),
)