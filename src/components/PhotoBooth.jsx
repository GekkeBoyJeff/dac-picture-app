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
import { UploadStatus, createUploadEntry } from "./ui/UploadStatus"
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
import { useOverlayStore } from "@/stores/overlayStore"
import { BOOT_STAGES, useBootStore } from "@/stores/bootStore"
import { compositePhoto } from "@/lib/canvas/compositePhoto"
import { sendOrQueue, processNextInQueue } from "@/lib/discord/sendQueue"
import {
  COUNTDOWN_SECONDS, LOOK_UP_PROMPT_ENABLED,
  GESTURE_SEQUENCE_OPEN, GESTURE_SEQUENCE_CLOSE,
  MASCOTS,
  STRIP_PHOTO_COUNT, STRIP_CANVAS, IMAGE,
} from "@/lib/config"
import { logger } from "@/lib/logger"
import { trackEvent } from "@/lib/storage/analytics"

export function PhotoBooth() {
  const containerRef = useRef(null)
  const { videoRef, startCamera, switchCamera, isReady, isMirrored, error: cameraError, selectedDeviceId, devices } = useCamera()
  const toast = useToast()
  const install = useInstallPrompt()
  const isIdle = useIdleTimer(60_000)
  const addPhoto = useGalleryStore((s) => s.addPhoto)
  const loadPhotos = useGalleryStore((s) => s.loadPhotos)
  const pendingCount = useSendQueueStore((s) => s.queue.filter((q) => !q.failed).length)
  const loadQueue = useSendQueueStore((s) => s.loadQueue)

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
  const setBootStage = useBootStore((s) => s.setBootStage)

  const [showFlash, setShowFlash] = useState(false)

  const captureTriggeredByRef = useRef("touch")
  const stripRef = useRef(null)

  // --- Shared capture helpers ---
  const captureOnePhoto = useCallback(async ({ forStrip = false } = {}) => {
    const video = videoRef.current
    const container = containerRef.current
    if (!video || !container) throw new Error("Missing video or container ref")

    const mirrored = useCameraStore.getState().isMirrored

    if (forStrip) {
      // Capture directly from camera stream at strip photo ratio.
      // Avoids double-crop: full-screen capture → strip crop = too zoomed.
      const cellW = STRIP_CANVAS.WIDTH - STRIP_CANVAS.MARGIN_X * 2
      const cellH = STRIP_CANVAS.PHOTO_HEIGHT
      const canvas = document.createElement("canvas")
      canvas.width = cellW
      canvas.height = cellH
      const ctx = canvas.getContext("2d")
      if (!ctx) throw new Error("Failed to get canvas 2D context")

      const vw = video.videoWidth
      const vh = video.videoHeight
      const videoAspect = vw / vh
      const cellAspect = cellW / cellH
      let sx = 0, sy = 0, sw = vw, sh = vh
      if (videoAspect > cellAspect) {
        sw = Math.round(vh * cellAspect)
        sx = Math.round((vw - sw) / 2)
      } else {
        sh = Math.round(vw / cellAspect)
        sy = Math.round((vh - sh) / 2)
      }

      if (mirrored) {
        ctx.translate(cellW, 0)
        ctx.scale(-1, 1)
      }
      ctx.drawImage(video, sx, sy, sw, sh, 0, 0, cellW, cellH)

      return new Promise((resolve, reject) => {
        canvas.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))),
          IMAGE.FORMAT,
          IMAGE.EXPORT_QUALITY,
        )
      })
    }

    const { exportBlob } = await compositePhoto(video, container, mirrored)
    return exportBlob
  }, [videoRef])

  const [uploadEntries, setUploadEntries] = useState([])
  const dismissEntry = useCallback((id) => {
    setUploadEntries((prev) => prev.filter((e) => e.id !== id))
  }, [])

  const sendAndTrack = useCallback(async (blob, { isStrip = false } = {}) => {
    await addPhoto(blob)

    const entry = createUploadEntry()
    setUploadEntries((prev) => [...prev, entry])

    const update = (status) =>
      setUploadEntries((prev) => prev.map((e) => (e.id === entry.id ? { ...e, status } : e)))

    let result
    try {
      result = await sendOrQueue(blob)
    } catch {
      update("error")
      trackEvent("discord_failed", { isStrip })
      return
    }

    if (result.success) {
      update("success")
      trackEvent("discord_sent", { isStrip })
    } else if (result.queued) {
      update("queued")
      trackEvent("discord_queued", { isStrip })
    } else {
      update("error")
      trackEvent("discord_failed", { isStrip })
    }

    logger.info("capture", "Photo captured", { sent: result.success, queued: result.queued, isStrip })
  }, [addPhoto])

  // --- Strip capture (hook manages its own state + refs) ---
  const handleStripComplete = useCallback(async (blob) => {
    useUiStore.getState().toggleStripMode()

    const overlayState = useOverlayStore.getState()
    trackEvent("strip_completed", {
      mascotId: overlayState.mascotId,
      layoutId: overlayState.layoutId,
    })
    sendAndTrack(blob, { isStrip: true })
    setAppState("camera")
  }, [sendAndTrack, setAppState])

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
    loadQueue()
    trackEvent("session_start", {
      userAgent: navigator.userAgent,
      screen: `${screen.width}x${screen.height}`,
    })
  }, [startCamera, loadPhotos, loadQueue])

  // Warm mascot images in idle time so opening the mascot drawer feels instant.
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

  // Restart camera when power mode changes (different resolution constraints)
  const initialPowerRef = useRef(forceLowPower)
  useEffect(() => {
    if (initialPowerRef.current === forceLowPower) return
    initialPowerRef.current = forceLowPower
    if (isReady) startCamera()
  }, [forceLowPower, isReady, startCamera])

  // --- Drain send queue on mount and when coming back online ---
  useEffect(() => {
    let cancelled = false

    async function drain() {
      while (!cancelled) {
        const { processed, remaining } = await processNextInQueue()
        await loadQueue()
        if (!processed || remaining === 0) break
      }
    }

    drain()

    const handleOnline = () => drain()
    window.addEventListener("online", handleOnline)
    return () => {
      cancelled = true
      window.removeEventListener("online", handleOnline)
    }
  }, [loadQueue])

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

  const flashEnabled = useUiStore((s) => s.flashEnabled)

  // The actual capture — called by flash (at peak brightness) or directly if flash is off
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

  const gestureEnabled = gesturesEnabled && isReady
  const gestureActionsEnabled = gestureEnabled && appState === "camera" && !modals.layoutSlider && !strip.isActive

  // Stable ref for frame tick — avoids re-creating the detection loop on every render
  const frameTickRef = useRef(null)
  const onFrameTick = useCallback(() => { frameTickRef.current?.() }, [])

  const {
    activeGesture, handBoxes, gestureBoxes, holdProgressRef, gestureLoading,
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
    onFrameTick,
  )

  const displayUploadEntries = gestureLoading
    ? [...uploadEntries, { id: "gesture-loading", status: "loading", label: "Handgebaren laden…" }]
    : uploadEntries

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

  // Drive gesture sequence/swipe ticks from useHandGesture's rAF loop (single loop)
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
    return () => { frameTickRef.current = null }
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

        {showFlash && <FlashEffect videoRef={videoRef} onCapture={doCapture} onComplete={handleFlashComplete} />}

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

        <UploadStatus entries={displayUploadEntries} onDismiss={dismissEntry} />

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