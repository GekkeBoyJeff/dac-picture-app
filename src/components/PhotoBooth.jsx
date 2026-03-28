"use client"

import { useRef, useState, useCallback, useEffect, useMemo } from "react"
import { CameraView } from "./camera/CameraView"
import { Countdown } from "./capture/Countdown"
import { FlashEffect } from "./capture/FlashEffect"
import { Gallery } from "./gallery/Gallery"
import { MascotPicker } from "./pickers/MascotPicker"
import { LayoutPicker } from "./pickers/LayoutPicker"
import { LayoutSlider } from "./pickers/LayoutSlider"
import { SettingsDrawer } from "./drawers/SettingsDrawer"
import { AboutDrawer } from "./drawers/AboutDrawer"
import { InstallBanner } from "./pwa/InstallBanner"
import { ErrorBoundary } from "./ErrorBoundary"
import { useCamera } from "@/hooks/useCamera"
import { useToast } from "@/hooks/useToast"
import { useInstallPrompt } from "@/hooks/useInstallPrompt"
import { useIdleTimer } from "@/hooks/useIdleTimer"
import { useStripCapture } from "@/hooks/useStripCapture"
import { useHandGesture } from "@/hooks/useHandGesture"
import { useGestureSequence } from "@/hooks/useGestureSequence"
import { useGestureSwipe } from "@/hooks/useGestureSwipe"
import { useCameraStore } from "@/stores/cameraStore"
import { useUiStore } from "@/stores/uiStore"
import { useGalleryStore } from "@/stores/galleryStore"
import { useSendQueueStore } from "@/stores/sendQueueStore"
import { compositePhoto } from "@/lib/canvas/compositePhoto"
import { sendOrQueue } from "@/lib/discord/sendQueue"
import {
  COUNTDOWN_SECONDS, LOOK_UP_PROMPT_ENABLED,
  GESTURE_SEQUENCE_OPEN, GESTURE_SEQUENCE_CLOSE,
} from "@/lib/config"
import { logger } from "@/lib/logger"
import { trackEvent } from "@/lib/storage/analytics"
import { useOverlayStore } from "@/stores/overlayStore"

const SPLASH_DURATION_MS = 1500

export function PhotoBooth() {
  const containerRef = useRef(null)
  const { videoRef, startCamera, switchCamera, isReady, isMirrored } = useCamera()
  const toast = useToast()
  const install = useInstallPrompt()
  const isIdle = useIdleTimer(60_000)
  const addPhoto = useGalleryStore((s) => s.addPhoto)
  const loadPhotos = useGalleryStore((s) => s.loadPhotos)
  const pendingCount = useSendQueueStore((s) => s.queue.filter((q) => !q.failed).length)

  const appState = useUiStore((s) => s.appState)
  const setAppState = useUiStore((s) => s.setAppState)
  const modals = useUiStore((s) => s.modals)
  const openModal = useUiStore((s) => s.openModal)
  const closeModal = useUiStore((s) => s.closeModal)
  const gesturesEnabled = useUiStore((s) => s.gesturesEnabled)
  const debugEnabled = useUiStore((s) => s.debugEnabled)
  const detectionIntervalMs = useUiStore((s) => s.detectionIntervalMs)
  const triggerMinScore = useUiStore((s) => s.triggerMinScore)
  const gestureHoldMs = useUiStore((s) => s.gestureHoldMs)
  const stripModeEnabled = useUiStore((s) => s.stripModeEnabled)

  const [splashDone, setSplashDone] = useState(false)
  const [showFlash, setShowFlash] = useState(false)
  const captureTriggeredByRef = useRef("touch")
  const stripRef = useRef(null)

  // --- Shared capture helpers ---
  /** Strip photos: clean frames — vignettes + corners only. No mascot/logo/convention/text. */
  const STRIP_EXCLUDE = { excludeImageTypes: ["logo", "mascot", "convention"], excludeText: true }

  const captureOnePhoto = useCallback(async ({ forStrip = false } = {}) => {
    const video = videoRef.current
    const container = containerRef.current
    if (!video || !container) throw new Error("Missing video or container ref")

    const mirrored = useCameraStore.getState().isMirrored
    const { exportBlob } = await compositePhoto(video, container, mirrored, forStrip ? STRIP_EXCLUDE : {})
    return exportBlob
  }, [videoRef])

  const sendAndTrack = useCallback(async (blob) => {
    await addPhoto(blob)

    const result = await sendOrQueue(blob)
    if (result.success) {
      toast.show("Foto verzonden naar Discord!")
    } else if (result.queued) {
      toast.show("Foto in wachtrij — wordt verzonden zodra mogelijk")
    } else {
      toast.show("Verzenden mislukt")
    }

    const overlayState = useOverlayStore.getState()
    trackEvent("photo_captured", {
      trigger: captureTriggeredByRef.current,
      mascotId: overlayState.mascotId,
      layoutId: overlayState.layoutId,
    })
    if (result.success) {
      trackEvent("discord_sent")
    } else if (!result.queued) {
      trackEvent("discord_failed")
    }

    logger.info("capture", "Photo captured", { sent: result.success, queued: result.queued })
  }, [addPhoto, toast])

  // --- Strip capture (hook manages its own state + refs) ---
  const strip = useStripCapture({
    enabled: stripModeEnabled,
    captureOne: captureOnePhoto,
    onStripComplete: sendAndTrack,
    savePhoto: addPhoto,
    setAppState,
  })
  stripRef.current = strip

  // --- Init ---
  useEffect(() => {
    startCamera()
    loadPhotos()
    const timer = setTimeout(() => setSplashDone(true), SPLASH_DURATION_MS)
    return () => clearTimeout(timer)
  }, [startCamera, loadPhotos])

  // --- Capture flow ---
  const handleCapture = useCallback(() => {
    const s = stripRef.current
    if (appState === "countdown") {
      setAppState("camera")
      s.reset()
      return
    }
    if (appState !== "camera" || !isReady || s.isActive) return
    captureTriggeredByRef.current = "touch"

    if (stripModeEnabled) s.start()
    setAppState("countdown")
  }, [appState, isReady, setAppState, stripModeEnabled])

  const handleCountdownComplete = useCallback(async () => {
    setAppState("capturing")
    setShowFlash(true)

    try {
      const blob = await captureOnePhoto({ forStrip: stripModeEnabled })

      if (stripModeEnabled) {
        await stripRef.current.addPhoto(blob)
      } else {
        await sendAndTrack(blob)
      }
    } catch (err) {
      logger.error("capture", "Capture failed", err)
      toast.show("Foto maken mislukt")
      stripRef.current.reset()
    }
  }, [captureOnePhoto, setAppState, stripModeEnabled, sendAndTrack, toast])

  const handleFlashComplete = useCallback(() => {
    setShowFlash(false)
    setAppState("camera")
  }, [setAppState])

  // --- Gesture system ---
  // Callbacks read stripRef to avoid unstable deps that destroy gesture hold state.
  const gestureCallbacks = useMemo(() => ({
    onVictory: () => {
      if (appState === "camera" && isReady) {
        captureTriggeredByRef.current = "gesture"
        if (useUiStore.getState().stripModeEnabled) stripRef.current.start()
        setAppState("countdown")
      }
    },
  }), [appState, isReady, setAppState])

  const gestureEnabled = gesturesEnabled && isReady && splashDone
  const gestureActionsEnabled = appState === "camera" && !modals.layoutSlider && !strip.isActive

  const {
    activeGesture, handBoxes, gestureBoxes, holdProgress,
    rawGestureNameRef, primaryHandLandmarksRef,
  } = useHandGesture(
    videoRef,
    gestureEnabled || debugEnabled,
    gestureCallbacks,
    isMirrored,
    detectionIntervalMs,
    triggerMinScore,
    gestureActionsEnabled,
    gestureHoldMs,
  )

  // Gesture sequence: open layout slider
  const gestureSequenceOpen = useGestureSequence(rawGestureNameRef, {
    onComplete: () => openModal("layoutSlider"),
    enabled: gestureEnabled && !modals.layoutSlider,
    sequence: GESTURE_SEQUENCE_OPEN,
  })

  // Gesture sequence: close layout slider
  const gestureSequenceClose = useGestureSequence(rawGestureNameRef, {
    onComplete: () => closeModal("layoutSlider"),
    enabled: gestureEnabled && modals.layoutSlider,
    sequence: GESTURE_SEQUENCE_CLOSE,
  })

  // Gesture swipe: navigate layouts when slider is open
  const gestureSwipe = useGestureSwipe(rawGestureNameRef, primaryHandLandmarksRef, {
    enabled: gestureEnabled && modals.layoutSlider,
  })

  // Tick gesture hooks each frame (driven by useHandGesture's rAF)
  useEffect(() => {
    if (!gestureEnabled) return
    let running = true
    const tick = () => {
      if (!running) return
      gestureSequenceOpen.tick()
      gestureSequenceClose.tick()
      gestureSwipe.tick()
      requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
    return () => { running = false }
  }, [gestureEnabled, gestureSequenceOpen, gestureSequenceClose, gestureSwipe])

  return (
    <ErrorBoundary>
      <div className="relative w-dvw h-dvh overflow-hidden bg-black">
        <CameraView
          videoRef={videoRef}
          containerRef={containerRef}
          splashDone={splashDone}
          onCapture={handleCapture}
          switchCamera={switchCamera}
          canInstall={install.canInstall}
          onInstall={install.promptInstall}
          activeGesture={activeGesture}
          handBoxes={handBoxes}
          gestureBoxes={gestureBoxes}
          holdProgress={holdProgress}
          gestureSequenceOpen={gestureSequenceOpen}
          gestureSequenceClose={gestureSequenceClose}
          showAttract={isIdle && (!handBoxes || handBoxes.length === 0)}
          stripPhotos={strip.stripPhotos}
          stripIsActive={strip.isActive}
        />

        <LayoutSlider
          isOpen={modals.layoutSlider}
          onClose={() => closeModal("layoutSlider")}
          gestureSwipe={gestureSwipe}
          closeSequence={gestureSequenceClose}
        />

        {appState === "countdown" && (
          <Countdown
            seconds={COUNTDOWN_SECONDS}
            onComplete={handleCountdownComplete}
            showLookUp={LOOK_UP_PROMPT_ENABLED}
          />
        )}

        {showFlash && <FlashEffect onComplete={handleFlashComplete} />}

        <Gallery
          isOpen={modals.gallery}
          onClose={() => closeModal("gallery")}
          toast={toast}
        />

        {modals.mascotPicker && (
          <MascotPicker onClose={() => closeModal("mascotPicker")} />
        )}

        {modals.layoutPicker && (
          <LayoutPicker onClose={() => closeModal("layoutPicker")} />
        )}

        <SettingsDrawer
          isOpen={modals.settings}
          onClose={() => closeModal("settings")}
          openAbout={() => openModal("about")}
        />

        {modals.about && (
          <AboutDrawer onClose={() => closeModal("about")} />
        )}

        {install.showBanner && (
          <InstallBanner
            isIOS={install.isIOS}
            onInstall={install.promptInstall}
            onDismiss={install.dismissBanner}
          />
        )}

        {toast.message && (
          <div role="status" aria-live="polite" className="fixed bottom-28 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/15 backdrop-blur-xl border border-white/20 text-white text-sm font-medium animate-fade-in">
            <span>{toast.message}</span>
            {toast.action && (
              <button
                onClick={() => { toast.action.onClick(); toast.dismiss() }}
                className="font-semibold text-sky-400 hover:text-sky-300 transition-colors cursor-pointer"
              >
                {toast.action.label}
              </button>
            )}
          </div>
        )}

        {pendingCount >= 5 && (
          <div className="fixed bottom-6 left-6 z-50 px-4 py-3 rounded-xl bg-amber-500/15 border border-amber-400/30 backdrop-blur text-amber-100 text-sm shadow-lg animate-fade-in">
            <p className="font-semibold">Wachtrij actief ({pendingCount})</p>
            <p className="text-amber-100/80 text-xs">Foto&apos;s worden verstuurd zodra er verbinding is.</p>
          </div>
        )}
      </div>
    </ErrorBoundary>
  )
}
