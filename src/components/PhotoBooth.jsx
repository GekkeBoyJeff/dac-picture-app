"use client"

import { useRef, useState, useCallback, useEffect, lazy, Suspense } from "react"
import { CameraView } from "@/features/camera/components/CameraView"
import { Countdown } from "@/features/capture/components/Countdown"
import { FlashEffect } from "@/features/capture/components/FlashEffect"
import { LayoutSlider } from "@/features/pickers/components/LayoutSlider"
import { UploadStatus } from "@/components/ui/UploadStatus"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { useCamera } from "@/features/camera/hooks/useCamera"
import { useToast } from "@/hooks/useToast"
import { useInstallPrompt } from "@/hooks/useInstallPrompt"
import { useIdleTimer } from "@/hooks/useIdleTimer"
import { useStripCapture } from "@/features/capture/hooks/useStripCapture"
import { useCaptureFlow } from "@/features/capture/hooks/useCaptureFlow"
import { useDiscordQueue } from "@/features/discord/hooks/useDiscordQueue"
import { useGestureDetection } from "@/features/gestures/hooks/useGestureDetection"
import { useGestureHold } from "@/features/gestures/hooks/useGestureHold"
import { useGestureSequence } from "@/features/gestures/hooks/useGestureSequence"
import { useGestureSwipe } from "@/features/gestures/hooks/useGestureSwipe"
import { useUiStore } from "@/stores/uiStore"
import { useGalleryStore } from "@/features/gallery/store"
import { useSendQueueStore, selectPendingCount } from "@/features/discord/store"
import { useOverlayStore } from "@/features/overlay/store"
import { BOOT_STAGES, useBootStore } from "@/stores/bootStore"
import {
  COUNTDOWN_SECONDS,
  LOOK_UP_PROMPT_ENABLED,
  GESTURE_SEQUENCE_OPEN,
  GESTURE_SEQUENCE_CLOSE,
  MASCOTS,
} from "@/lib/config"
import { trackEvent } from "@/features/analytics/lib/analytics"
import { logger } from "@/lib/logger"

const Gallery = lazy(() =>
  import("@/features/gallery/components/Gallery").then((m) => ({ default: m.Gallery })),
)
const MascotPicker = lazy(() =>
  import("@/features/pickers/components/MascotPicker").then((m) => ({ default: m.MascotPicker })),
)
const LayoutPicker = lazy(() =>
  import("@/features/pickers/components/LayoutPicker").then((m) => ({ default: m.LayoutPicker })),
)
const SettingsDrawer = lazy(() =>
  import("@/features/settings/components/SettingsDrawer").then((m) => ({
    default: m.SettingsDrawer,
  })),
)
const AboutDrawer = lazy(() =>
  import("@/features/settings/components/AboutDrawer").then((m) => ({ default: m.AboutDrawer })),
)
const InstallBanner = lazy(() =>
  import("@/pwa/InstallBanner").then((m) => ({ default: m.InstallBanner })),
)

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
  const { captureOnePhoto } = useCaptureFlow({ videoRef, containerRef })
  const { uploadEntries, dismissEntry, sendAndTrack } = useDiscordQueue()

  const handleStripComplete = useCallback(
    async (blob) => {
      useUiStore.getState().toggleStripMode()
      const os = useOverlayStore.getState()
      trackEvent("strip_completed", { mascotId: os.mascotId, layoutId: os.layoutId })
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

  useEffect(() => {
    startCamera()
    loadPhotos()
    trackEvent("session_start", {
      userAgent: navigator.userAgent,
      screen: `${screen.width}x${screen.height}`,
    })
  }, [startCamera, loadPhotos])

  useEffect(() => {
    const preload = () =>
      MASCOTS.forEach((m) => Object.assign(new Image(), { decoding: "async", src: m.thumbnail }))
    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      const id = window.requestIdleCallback(preload, { timeout: 1200 })
      return () => window.cancelIdleCallback(id)
    }
    const t = setTimeout(preload, 250)
    return () => clearTimeout(t)
  }, [])

  const initialPowerRef = useRef(forceLowPower)
  useEffect(() => {
    if (initialPowerRef.current === forceLowPower) return
    initialPowerRef.current = forceLowPower
    if (isReady) startCamera()
  }, [forceLowPower, isReady, startCamera])

  const handleCapture = useCallback(() => {
    const s = stripRef.current
    if (appState === "countdown") {
      setAppState("camera")
      return s.reset()
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
      const os = useOverlayStore.getState()
      trackEvent("photo_captured", {
        trigger: captureTriggeredByRef.current,
        mode: isStrip ? "strip" : "single",
        mascotId: os.mascotId,
        layoutId: os.layoutId,
      })
      if (isStrip) return await stripRef.current.addPhoto(blob)
      setAppState("camera")
      sendAndTrack(blob)
    } catch (err) {
      logger.error("capture", "Capture failed", err)
      stripRef.current.reset()
      setAppState("camera")
    }
  }, [captureOnePhoto, sendAndTrack, setAppState])

  const handleCountdownComplete = useCallback(() => {
    setAppState("capturing")
    if (flashEnabled) setShowFlash(true)
    else doCapture()
  }, [setAppState, flashEnabled, doCapture])

  const handleFlashComplete = useCallback(() => setShowFlash(false), [])
  const gestureEnabled = gesturesEnabled && isReady
  const gestureActionsEnabled =
    gestureEnabled && appState === "camera" && !modals.layoutSlider && !strip.isActive
  const onVictory = useCallback(() => {
    if (appState !== "camera" || !isReady) return
    captureTriggeredByRef.current = "gesture"
    if (useUiStore.getState().stripModeEnabled) stripRef.current.start()
    setAppState("countdown")
  }, [appState, isReady, setAppState])

  const frameTickRef = useRef(null)
  const onFrameTick = useCallback(() => frameTickRef.current?.(), [])
  const {
    rawGestureNameRef,
    primaryHandLandmarksRef,
    handBoxes,
    gestureBoxes,
    gestureLoading,
    triggerHandIndexRef,
  } = useGestureDetection(videoRef, gestureEnabled || debugEnabled, {
    isMirrored,
    detectionIntervalMs,
    triggerMinScore,
    gestureActionsEnabled,
    onFrameTick,
  })
  const {
    activeGesture,
    holdProgressRef,
    tick: holdTick,
  } = useGestureHold(triggerHandIndexRef, {
    holdDurationMs: gestureHoldMs,
    enabled: gestureActionsEnabled,
    onVictory,
  })
  const displayUploadEntries = gestureLoading
    ? [
        ...uploadEntries,
        { id: "gesture-loading", status: "loading", label: "Handgebaren laden\u2026" },
      ]
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
      holdTick()
      gestureSequenceOpen.tick()
      gestureSequenceClose.tick()
      gestureSwipe.tick()
    }
    return () => {
      frameTickRef.current = null
    }
  }, [gestureEnabled, holdTick, gestureSequenceOpen, gestureSequenceClose, gestureSwipe])

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
        <Suspense fallback={null}>
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
        </Suspense>
        <UploadStatus entries={displayUploadEntries} onDismiss={dismissEntry} />
        {toast.message && (
          <div
            role="status"
            aria-live="polite"
            className="fixed bottom-28 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-3 rounded-none bg-black border border-white/20 text-white text-sm font-mono animate-fade-in"
          >
            <span>{toast.message}</span>
            {toast.action && (
              <button
                onClick={() => {
                  toast.action.onClick()
                  toast.dismiss()
                }}
                className="font-bold text-[#e6c189] hover:text-white transition-colors cursor-pointer"
              >
                {toast.action.label}
              </button>
            )}
          </div>
        )}
        {pendingCount >= 5 && (
          <div className="fixed bottom-6 left-6 z-50 px-4 py-3 rounded-none bg-black border border-[#e6c189] text-[#e6c189] text-sm font-mono animate-fade-in">
            <p className="font-bold">Wachtrij actief ({pendingCount})</p>
            <p className="text-white/40 text-xs">
              Foto&apos;s worden verstuurd zodra er verbinding is.
            </p>
          </div>
        )}
      </div>
    </ErrorBoundary>
  )
}
