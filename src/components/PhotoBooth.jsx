"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { useCamera } from "@/hooks/useCamera"
import { useGallery } from "@/hooks/useGallery"
import { useInstallPrompt } from "@/hooks/useInstallPrompt"
import { useToast } from "@/hooks/useToast"
import { useHandGesture } from "@/hooks/useHandGesture"
import { useOverlaySettings } from "@/hooks/useOverlaySettings"
import { useModalState } from "@/hooks/useModalState"
import { useSendQueue } from "@/hooks/useSendQueue"
import { compositePhoto } from "@/lib/compositePhoto"
import { STORAGE_KEYS, readStorage, writeStorage } from "@/lib/storage/localStorage"
import { BUTTON_STYLES } from "@/lib/styles/buttons"
import { COUNTDOWN_SECONDS, LOOK_UP_PROMPT_ENABLED, DEFAULT_GESTURE_HOLD_MS } from "@/lib/config"
import { validateConfigShapes } from "@/lib/config/validate"
import { CameraProvider, OverlayProvider, ModalProvider, UIProvider } from "@/context"
import { CameraView } from "./camera"
import { WarningIcon } from "./icons"
import { Countdown } from "./Countdown"
import { FlashEffect } from "./FlashEffect"
import { Gallery } from "./Gallery"
import { InstallBanner } from "./InstallBanner"

const clampInterval = (value) => Math.min(1200, Math.max(0, Number(value) || 0))
const clampTrigger = (value) => Math.min(1, Math.max(0, Number(value) || 0))
const DEFAULT_DEBUG_ENABLED = false
const DEFAULT_GESTURES_ENABLED = true
const DEFAULT_DETECTION_INTERVAL = 120
const DEFAULT_TRIGGER_MIN_SCORE = 0.35
const clampHoldMs = (value) => Math.min(5000, Math.max(0, Number(value) || 0))

export function PhotoBooth() {
  const [appState, setAppState] = useState("camera")
  const [showFlash, setShowFlash] = useState(false)
  const [debugEnabled, setDebugEnabled] = useState(DEFAULT_DEBUG_ENABLED)
  const [gesturesEnabled, setGesturesEnabled] = useState(DEFAULT_GESTURES_ENABLED)
  const [detectionIntervalMs, setDetectionIntervalMs] = useState(DEFAULT_DETECTION_INTERVAL)
  const [triggerMinScore, setTriggerMinScore] = useState(DEFAULT_TRIGGER_MIN_SCORE)
  const [gestureHoldMs, setGestureHoldMs] = useState(DEFAULT_GESTURE_HOLD_MS)
  const { modals, openModal, closeModal } = useModalState({
    gallery: false,
    mascotPicker: false,
    layoutPicker: false,
    about: false,
    settings: false,
  })
  const containerRef = useRef(null)
  const [splashDone, setSplashDone] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setSplashDone(true), 1500)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const storedDebug = readStorage(STORAGE_KEYS.UI_DEBUG, String(DEFAULT_DEBUG_ENABLED)) === "true"
    const storedGestures = readStorage(STORAGE_KEYS.UI_GESTURES, String(DEFAULT_GESTURES_ENABLED)) !== "false"
    const storedInterval = clampInterval(readStorage(STORAGE_KEYS.UI_DETECTION_INTERVAL, String(DEFAULT_DETECTION_INTERVAL)))
    const storedTrigger = clampTrigger(readStorage(STORAGE_KEYS.UI_TRIGGER_MIN_SCORE, String(DEFAULT_TRIGGER_MIN_SCORE)))
    const storedHoldMs = clampHoldMs(readStorage(STORAGE_KEYS.UI_GESTURE_HOLD_MS, String(DEFAULT_GESTURE_HOLD_MS)))

    setDebugEnabled(storedDebug)
    setGesturesEnabled(storedGestures)
    setDetectionIntervalMs(storedInterval)
    setTriggerMinScore(storedTrigger)
    setGestureHoldMs(storedHoldMs)
  }, [])

  useEffect(() => {
    validateConfigShapes()
  }, [])

  const {
    videoRef,
    isReady,
    isRecalibrating,
    isSwitching,
    error,
    devices,
    selectedDeviceId,
    isMirrored,
    startCamera,
    switchCamera,
  } = useCamera()
  const { photos, addPhoto, removePhoto } = useGallery()
  const { canInstall, promptInstall, showBanner, isIOS, dismissBanner } = useInstallPrompt()
  const toast = useToast()
  const { layout, mascot, activeConvention, setLayoutId, setMascotId } = useOverlaySettings()
  const { sendWithQueue, failedCount, pendingCount } = useSendQueue()
  const failedToastRef = useRef(failedCount)

  const toggleDebug = useCallback(() => {
    setDebugEnabled((prev) => {
      const next = !prev
      writeStorage(STORAGE_KEYS.UI_DEBUG, String(next))
      return next
    })
  }, [])

  const toggleGestures = useCallback(() => {
    setGesturesEnabled((prev) => {
      const next = !prev
      writeStorage(STORAGE_KEYS.UI_GESTURES, String(next))
      return next
    })
  }, [])

  const setDetectionInterval = useCallback((value) => {
    const clamped = clampInterval(value)
    setDetectionIntervalMs(clamped)
    writeStorage(STORAGE_KEYS.UI_DETECTION_INTERVAL, String(clamped))
  }, [])

  const setTriggerScore = useCallback((value) => {
    const clamped = clampTrigger(value)
    setTriggerMinScore(clamped)
    writeStorage(STORAGE_KEYS.UI_TRIGGER_MIN_SCORE, String(clamped))
  }, [])

  const setGestureHold = useCallback((value) => {
    const clamped = clampHoldMs(value)
    setGestureHoldMs(clamped)
    writeStorage(STORAGE_KEYS.UI_GESTURE_HOLD_MS, String(clamped))
  }, [])

  const openGallery = useCallback(() => openModal("gallery"), [openModal])
  const closeGallery = useCallback(() => closeModal("gallery"), [closeModal])
  const openMascotPicker = useCallback(() => openModal("mascotPicker"), [openModal])
  const closeMascotPicker = useCallback(() => closeModal("mascotPicker"), [closeModal])
  const openLayoutPicker = useCallback(() => openModal("layoutPicker"), [openModal])
  const closeLayoutPicker = useCallback(() => closeModal("layoutPicker"), [closeModal])
  const openAbout = useCallback(() => openModal("about"), [openModal])
  const closeAbout = useCallback(() => closeModal("about"), [closeModal])
  const openSettings = useCallback(() => openModal("settings"), [openModal])
  const closeSettings = useCallback(() => closeModal("settings"), [closeModal])
  const clearFlash = useCallback(() => setShowFlash(false), [])

  const handlePeaceSign = useCallback(() => {
    if (appState === "camera" && isReady) {
      setAppState("countdown")
    }
  }, [appState, isReady])

  const gestureCallbacks = useMemo(() => ({
    onVictory: handlePeaceSign,
  }), [handlePeaceSign])

  const gesturesEnabledForTracking = appState === "camera" && isReady && (gesturesEnabled || debugEnabled)
  const gestureActionsEnabled = appState === "camera" && isReady && gesturesEnabled

  const { activeGesture, handBoxes, gestureBoxes, holdProgress } = useHandGesture(
    videoRef,
    gesturesEnabledForTracking,
    gestureCallbacks,
    isMirrored,
    detectionIntervalMs,
    triggerMinScore,
    gestureActionsEnabled,
    gestureHoldMs
  )

  useEffect(() => {
    startCamera()
  }, [startCamera])

  useEffect(() => {
    if (failedCount > failedToastRef.current) {
      toast.show("Verzenden naar Discord mislukt, probeer opnieuw vanaf de wachtrij")
    }
    failedToastRef.current = failedCount
  }, [failedCount, toast])

  const handleCapture = useCallback(() => {
    if (!isReady) return
    if (appState === "camera") {
      setAppState("countdown")
      return
    }

    if (appState === "countdown") {
      setAppState("camera")
    }
  }, [appState, isReady])

  const resetTimerRef = useRef(null)

  useEffect(() => {
    return () => clearTimeout(resetTimerRef.current)
  }, [])

  const handleCountdownComplete = useCallback(async () => {
    setAppState("capturing")
    setShowFlash(true)

    try {
      const video = videoRef.current
      if (!video) throw new Error("Video element not available")

      const container = containerRef.current
      if (!container) throw new Error("Container element not available")

      const { exportBlob, galleryDataUrl } = await compositePhoto(
        video,
        container,
        isMirrored
      )

      addPhoto(galleryDataUrl)

      // Fire-and-forget: send in background, show toast for result
      sendWithQueue(exportBlob, galleryDataUrl).then((result) => {
        if (result.success) {
          toast.show("Verzonden!")
        } else if (result.queued) {
          toast.show("In wachtrij geplaatst")
        } else {
          toast.show("Verzenden naar Discord mislukt")
        }
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : "Er ging iets mis"
      toast.show(message)
    } finally {
      resetTimerRef.current = setTimeout(() => setAppState("camera"), 800)
    }
  }, [videoRef, addPhoto, toast, isMirrored, sendWithQueue])

  const cameraContextValue = useMemo(() => ({
    videoRef,
    containerRef,
    isReady,
    splashDone,
    isRecalibrating,
    isSwitching,
    isMirrored,
    devices,
    selectedDeviceId,
    switchCamera,
    onCapture: handleCapture,
    disabled: appState !== "camera" && appState !== "countdown",
    activeGesture,
    handBoxes,
    gestureBoxes,
    holdProgress,
  }), [
    videoRef, containerRef, isReady, splashDone, isRecalibrating, isSwitching, isMirrored,
    devices, selectedDeviceId, switchCamera, handleCapture, appState, activeGesture, handBoxes,
    gestureBoxes, holdProgress,
  ])

  const overlayContextValue = useMemo(() => ({
    layout,
    mascot,
    activeConvention,
    setLayoutId,
    setMascotId,
  }), [layout, mascot, activeConvention, setLayoutId, setMascotId])

  const modalContextValue = useMemo(() => ({
    showMascotPicker: modals.mascotPicker,
    showLayoutPicker: modals.layoutPicker,
    openMascotPicker,
    closeMascotPicker,
    openLayoutPicker,
    closeLayoutPicker,
    showAbout: modals.about,
    openAbout,
    closeAbout,
    showSettings: modals.settings,
    openSettings,
    closeSettings,
  }), [
    modals.mascotPicker, modals.layoutPicker,
    openMascotPicker, closeMascotPicker,
    openLayoutPicker, closeLayoutPicker,
    modals.about, openAbout, closeAbout,
    modals.settings, openSettings, closeSettings,
  ])

  const uiContextValue = useMemo(() => ({
    galleryCount: photos.length,
    openGallery,
    canInstall,
    onInstall: promptInstall,
    debugEnabled,
    toggleDebug,
    gesturesEnabled,
    toggleGestures,
    detectionIntervalMs,
    setDetectionInterval,
    triggerMinScore,
    setTriggerMinScore: setTriggerScore,
    gestureHoldMs,
    setGestureHoldMs: setGestureHold,
  }), [photos.length, openGallery, canInstall, promptInstall, debugEnabled, detectionIntervalMs, triggerMinScore, gesturesEnabled, toggleDebug, toggleGestures, setDetectionInterval, setTriggerScore, gestureHoldMs, setGestureHold])

  if (error) {
    return (
      <div className="w-dvw h-dvh bg-black flex items-center justify-center">
        <div className="text-center p-8 max-w-md">
          <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
            <WarningIcon className="w-10 h-10 text-red-400" />
          </div>
          <p className="text-white/80 text-lg mb-4">{error}</p>
          <button
            onClick={() => startCamera()}
            className={BUTTON_STYLES.primary}
          >
            Opnieuw proberen
          </button>

          {devices.length > 1 && (
            <div className="mt-6">
              <p className="text-white/50 text-xs uppercase tracking-widest mb-3">Andere camera kiezen</p>
              <div className="flex flex-col gap-2">
                {devices.map((device) => (
                  <button
                    key={device.deviceId}
                    onClick={() => switchCamera(device.deviceId)}
                    className={`px-4 py-3 rounded-xl text-sm transition-colors cursor-pointer ${
                      device.deviceId === selectedDeviceId
                        ? "bg-white/15 text-white font-medium"
                        : "bg-white/5 text-white/70 hover:bg-white/10"
                    }`}
                  >
                    {device.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <CameraProvider value={cameraContextValue}>
      <OverlayProvider value={overlayContextValue}>
        <ModalProvider value={modalContextValue}>
          <UIProvider value={uiContextValue}>
            <CameraView />

            {appState === "countdown" && (
              <Countdown
                seconds={COUNTDOWN_SECONDS}
                onComplete={handleCountdownComplete}
                showLookUp={LOOK_UP_PROMPT_ENABLED}
              />
            )}

            {showFlash && <FlashEffect onComplete={clearFlash} />}

            {toast.message && (
              <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl bg-white/15 backdrop-blur-xl border border-white/20 text-white text-sm font-medium animate-fade-in">
                {toast.message}
              </div>
            )}

            {pendingCount > 5 && (
              <div className="fixed bottom-6 left-6 z-50 px-4 py-3 rounded-xl bg-amber-500/15 border border-amber-400/30 backdrop-blur text-amber-100 text-sm shadow-lg animate-fade-in">
                <p className="font-semibold">Wachtrij actief ({pendingCount})</p>
                <p className="text-amber-100/80 text-xs">Foto&apos;s worden verstuurd zodra er verbinding is.</p>
              </div>
            )}

            <Gallery
              photos={photos}
              isOpen={modals.gallery}
              onClose={closeGallery}
              onRemove={removePhoto}
            />

            {showBanner && (
              <InstallBanner
                isIOS={isIOS}
                onInstall={promptInstall}
                onDismiss={dismissBanner}
              />
            )}
          </UIProvider>
        </ModalProvider>
      </OverlayProvider>
    </CameraProvider>
  )
}