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
import { UploadStatus } from "./ui/UploadStatus"
import { useCamera } from "@/hooks/useCamera"
import { useToast } from "@/hooks/useToast"
import { useInstallPrompt } from "@/hooks/useInstallPrompt"
import { useIdleTimer } from "@/hooks/useIdleTimer"
import { useStripCapture } from "@/hooks/useStripCapture"
import { useHandGesture } from "@/hooks/useHandGesture"
import { useGestureSequence } from "@/hooks/useGestureSequence"
import { useGestureSwipe } from "@/hooks/useGestureSwipe"
import { useCaptureFlow } from "@/hooks/useCaptureFlow"
import { useDiscordQueue } from "@/hooks/useDiscordQueue"
import { useUiStore } from "@/stores/uiStore"
import { useGalleryStore } from "@/stores/galleryStore"
import { useSendQueueStore, selectPendingCount } from "@/stores/sendQueueStore"
import { useOverlayStore } from "@/stores/overlayStore"
import { BOOT_STAGES, useBootStore } from "@/stores/bootStore"
import {
  COUNTDOWN_SECONDS,
  LOOK_UP_PROMPT_ENABLED,
  GESTURE_SEQUENCE_OPEN,
  GESTURE_SEQUENCE_CLOSE,
  MASCOTS,
  STRIP_CANVAS,
  IMAGE,
} from "@/lib/config"
import { logger } from "@/lib/logger"
import { trackEvent } from "@/lib/storage/analytics"

export function PhotoBooth() {
  const containerRef = useRef(null)
  const {
    videoRef,
    startCamera,
    switchCamera,
    isReady,
    isMirrored,
    error: cameraError,
    selectedDeviceId,
    devices,
  } = useCamera()
  const toast = useToast()
  const install = useInstallPrompt()
  const isIdle = useIdleTimer(60_000)
  const addPhoto = useGalleryStore((s) => s.addPhoto)
  const loadPhotos = useGalleryStore((s) => s.loadPhotos)
  const pendingCount = useSendQueueStore(selectPendingCount)

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
  const forceLowPower = useUiStore((s) => s.forceLowPower)
  const flashEnabled = useUiStore((s) => s.flashEnabled)
  const setBootStage = useBootStore((s) => s.setBootStage)

  const [showFlash, setShowFlash] = useState(false)
  const captureTriggeredByRef = useRef("touch")
  const stripRef = useRef(null)

  // --- Extracted hooks ---
  const { captureOnePhoto } = useCaptureFlow({ videoRef, containerRef })
  const { uploadEntries, dismissEntry, sendAndTrack } = useDiscordQueue()

  // --- Strip capture ---
  const handleStripComplete = useCallback(
    async (blob) => {
      useUiStore.getState().toggleStripMode()
      const overlayState = useOverlayStore.getState()
      trackEvent("strip_completed", {
        mascotId: overlayState.mascotId,
        layoutId: overlayState.layoutId,
      })
      sendAndTrack(blob, { isStrip: true })
      setAppState("camera")
    },
    [sendAndTrack, setAppState],
  )

  const strip = useStripCapture({
    enabled: stripModeEnabled,
    captureOne: captureOnePhoto,
    onStripComplete: handleStripComplete,
    savePhoto: addPhoto,
    setAppState,
  })
  useEffect(() => {
    stripRef.current = strip
  }, [strip])

  // --- Init ---
  useEffect(() => {
    startCamera()
    loadPhotos()
    trackEvent("session_start", {
      userAgent: navigator.userAgent,
      screen: `${screen.width}x${screen.height}`,
    })
  }, [startCamera, loadPhotos])

  // Preload mascot images during idle
  useEffect(() => {
    const preload = () => {
      MASCOTS.forEach((mascot) => {
        const img = new Image()
        img.decoding = "async"
        img.src = mascot.thumbnail
      })
    }
    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      const id = window.requestIdleCallback(preload, { timeout: 1200 })
      return () => window.cancelIdleCallback(id)
    }
    const timeout = setTimeout(preload, 250)
    return () => clearTimeout(timeout)
  }, [])

  // Restart camera when power mode changes
  const initialPowerRef = useRef(forceLowPower)
  useEffect(() => {
    if (initialPowerRef.current === forceLowPower) return
    initialPowerRef.current = forceLowPower
    if (isReady) startCamera()
  }, [forceLowPower, isReady, startCamera])

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

  const doCapture = useCallback(async () => {
    try {
      const isStrip = useUiStore.getState().stripModeEnabled
      const blob = await captureOnePhoto({ forStrip: isStrip })
      const overlayState = useOverlayStore.getState()
      trackEvent("photo_captured", {
        trigger: captureTriggeredByRef.current,
        mode: isStrip ? "strip" : "single",
        mascotId: overlayState.mascotId,
        layoutId: overlayState.layoutId,
      })
      if (isStrip) {
        await stripRef.current.addPhoto(blob)
      } else {
        setAppState("camera")
        sendAndTrack(blob)
      }
    } catch (err) {
      logger.error("capture", "Capture failed", err)
      stripRef.current.reset()
      setAppState("camera")
    }
  }, [captureOnePhoto, sendAndTrack, setAppState])

  const handleCountdownComplete = useCallback(() => {
    setAppState("capturing")
    if (flashEnabled) {
      setShowFlash(true)
    } else {
      doCapture()
    }
  }, [setAppState, flashEnabled, doCapture])

  const handleFlashComplete = useCallback(() => {
    setShowFlash(false)
  }, [])

  // --- Gesture system ---
  const gestureCallbacks = useMemo(
    () => ({
      onVictory: () => {
        if (appState === "camera" && isReady) {
          captureTriggeredByRef.current = "gesture"
          if (useUiStore.getState().stripModeEnabled) stripRef.current.start()
          setAppState("countdown")
        }
      },
    }),
    [appState, isReady, setAppState],
  )

  const gestureEnabled = gesturesEnabled && isReady
  const gestureActionsEnabled =
    gestureEnabled && appState === "camera" && !modals.layoutSlider && !strip.isActive

  const frameTickRef = useRef(null)
  const onFrameTick = useCallback(() => {
    frameTickRef.current?.()
  }, [])

  const {
    activeGesture,
    handBoxes,
    gestureBoxes,
    holdProgressRef,
    gestureLoading,
    rawGestureNameRef,
    primaryHandLandmarksRef,
  } = useHandGesture(
    videoRef,
    gestureEnabled || debugEnabled,
    gestureCallbacks,
    isMirrored,
    detectionIntervalMs,
    triggerMinScore,
    gestureActionsEnabled,
    gestureHoldMs,
    onFrameTick,
  )

  const displayUploadEntries = gestureLoading
    ? [...uploadEntries, { id: "gesture-loading", status: "loading", label: "Handgebaren laden…" }]
    : uploadEntries

  const gestureSequenceOpen = useGestureSequence(rawGestureNameRef, {
    onComplete: () => openModal("layoutSlider"),
    enabled: gestureEnabled && !modals.layoutSlider,
    sequence: GESTURE_SEQUENCE_OPEN,
  })

  const gestureSequenceClose = useGestureSequence(rawGestureNameRef, {
    onComplete: () => closeModal("layoutSlider"),
    enabled: gestureEnabled && modals.layoutSlider,
    sequence: GESTURE_SEQUENCE_CLOSE,
  })

  const gestureSwipe = useGestureSwipe(rawGestureNameRef, primaryHandLandmarksRef, {
    enabled: gestureEnabled && modals.layoutSlider,
  })

  useEffect(() => {
    if (!gestureEnabled) {
      frameTickRef.current = null
      return
    }
    frameTickRef.current = () => {
      gestureSequenceOpen.tick()
      gestureSequenceClose.tick()
      gestureSwipe.tick()
    }
    return () => {
      frameTickRef.current = null
    }
  }, [gestureEnabled, gestureSequenceOpen, gestureSequenceClose, gestureSwipe])

  return (
    <ErrorBoundary>
      <div className="relative w-dvw h-dvh overflow-hidden bg-black">
        <CameraView
          videoRef={videoRef}
          containerRef={containerRef}
          cameraError={cameraError}
          cameraDeviceCount={devices.length}
          onRetryCamera={() => {
            setBootStage(BOOT_STAGES.CAMERA_STARTING)
            startCamera(selectedDeviceId ?? undefined)
          }}
          onCapture={handleCapture}
          switchCamera={switchCamera}
          canInstall={install.canInstall}
          onInstall={install.promptInstall}
          activeGesture={activeGesture}
          handBoxes={handBoxes}
          gestureBoxes={gestureBoxes}
          holdProgressRef={holdProgressRef}
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

        {showFlash && (
          <FlashEffect videoRef={videoRef} onCapture={doCapture} onComplete={handleFlashComplete} />
        )}

        <Gallery isOpen={modals.gallery} onClose={() => closeModal("gallery")} toast={toast} />

        {modals.mascotPicker && <MascotPicker onClose={() => closeModal("mascotPicker")} />}
        {modals.layoutPicker && <LayoutPicker onClose={() => closeModal("layoutPicker")} />}

        <SettingsDrawer
          isOpen={modals.settings}
          onClose={() => closeModal("settings")}
          openAbout={() => openModal("about")}
        />

        {modals.about && <AboutDrawer onClose={() => closeModal("about")} />}

        {install.showBanner && (
          <InstallBanner
            isIOS={install.isIOS}
            onInstall={install.promptInstall}
            onDismiss={install.dismissBanner}
          />
        )}

        <UploadStatus entries={displayUploadEntries} onDismiss={dismissEntry} />

        {toast.message && (
          <div
            role="status"
            aria-live="polite"
            className="fixed bottom-28 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/15 backdrop-blur-xl border border-white/20 text-white text-sm font-medium animate-fade-in"
          >
            <span>{toast.message}</span>
            {toast.action && (
              <button
                onClick={() => {
                  toast.action.onClick()
                  toast.dismiss()
                }}
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
            <p className="text-amber-100/80 text-xs">
              Foto&apos;s worden verstuurd zodra er verbinding is.
            </p>
          </div>
        )}
      </div>
    </ErrorBoundary>
  )
}
