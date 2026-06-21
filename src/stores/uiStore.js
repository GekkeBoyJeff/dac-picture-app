import { create } from "zustand"
import { persist } from "zustand/middleware"
import { DEFAULT_GESTURE_HOLD_MS } from "@/lib/config"

export const useUiStore = create(
  persist(
    (set) => ({
      // --- App phase (not persisted) ---
      appState: "camera", // "camera" | "countdown" | "capturing" | "result"

      // --- Transient captured photo for the result overlay (not persisted).
      // { url: objectURL, isStrip: boolean } | null. The object URL is created
      // and revoked by PhotoBooth/PhotoResultOverlay, never persisted.
      capturedPhoto: null,

      // --- Modal state (not persisted) ---
      modals: {
        gallery: false,
        mascotPicker: false,
        layoutPicker: false,
        layoutSlider: false,
        about: false,
        settings: false,
      },

      // --- Gallery lightbox (not persisted) — null = grid/closed, number = photo
      // index. Drives the on-booth lightbox; also remote-controllable from /admin.
      galleryLightboxIndex: null,

      // --- Settings (persisted) ---
      debugEnabled: false,
      gesturesEnabled: false,
      stripModeEnabled: false,
      flashEnabled: true,
      // On the big kiosk (>=1200px) the on-screen capture button is hidden in
      // favour of gestures. Operators can force it back on (manual fallback when
      // gestures misbehave) via Settings → Advanced. Persisted so it sticks.
      forceCaptureButton: false,
      // Diagnostic: show the gesture-detection health panel (top-left). Off by
      // default; flipped in Settings → Advanced. The hand boxes are always-on
      // and independent of this flag.
      gestureHealthEnabled: false,
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
      setCapturedPhoto: (capturedPhoto) => set({ capturedPhoto }),

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

      openGalleryLightbox: (i = 0) => set({ galleryLightboxIndex: i }),
      setGalleryLightboxIndex: (galleryLightboxIndex) => set({ galleryLightboxIndex }),
      galleryNext: (count) =>
        set((state) => ({
          galleryLightboxIndex:
            state.galleryLightboxIndex == null
              ? count > 0
                ? 0
                : null
              : Math.min(state.galleryLightboxIndex + 1, count - 1),
        })),
      galleryPrev: () =>
        set((state) => ({
          galleryLightboxIndex:
            state.galleryLightboxIndex == null ? null : Math.max(0, state.galleryLightboxIndex - 1),
        })),
      closeGalleryLightbox: () => set({ galleryLightboxIndex: null }),
      toggleDebug: () => set((state) => ({ debugEnabled: !state.debugEnabled })),
      toggleGestures: () => set((state) => ({ gesturesEnabled: !state.gesturesEnabled })),
      toggleStripMode: () => set((state) => ({ stripModeEnabled: !state.stripModeEnabled })),
      toggleFlash: () => set((state) => ({ flashEnabled: !state.flashEnabled })),
      toggleForceCaptureButton: () =>
        set((state) => ({ forceCaptureButton: !state.forceCaptureButton })),
      toggleGestureHealth: () =>
        set((state) => ({ gestureHealthEnabled: !state.gestureHealthEnabled })),
      applyLowPowerPreset: () =>
        set({
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
        }),
      applyHighPowerPreset: () =>
        set({
          forceLowPower: false,
          lowPowerOverride: false,
          gesturesEnabled: true,
          detectionIntervalMs: 0,
          triggerMinScore: 0.25,
          numHands: 8,
          minDetectionConfidence: 0.4,
          minPresenceConfidence: 0.4,
          minTrackingConfidence: 0.4,
        }),
      toggleForceLowPower: () =>
        set((state) => {
          const enabling = !state.forceLowPower
          if (enabling) {
            return {
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
          }
          return {
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
      onRehydrateStorage: () => (state) => {
        // appState/capturedPhoto are never persisted; force transient defaults
        // after any rehydrate so a reload can never resurrect a "result" frame.
        if (state) {
          state.appState = "camera"
          state.capturedPhoto = null
        }
      },
      name: "ui-settings",
      partialize: (state) => ({
        debugEnabled: state.debugEnabled,
        gesturesEnabled: state.gesturesEnabled,
        stripModeEnabled: state.stripModeEnabled,
        flashEnabled: state.flashEnabled,
        forceCaptureButton: state.forceCaptureButton,
        gestureHealthEnabled: state.gestureHealthEnabled,
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