"use client"

import { useRef, useCallback, useEffect } from "react"
import { useCameraStore } from "@/features/camera/store"
import { useUiStore } from "@/stores/uiStore"
import { getCameraIdeal } from "@/lib/deviceCapability"
import { logger } from "@/lib/logger"

const ORIENTATION_DEBOUNCE_MS = 500

const EXTERNAL_CAMERA_LABELS = ["elgato", "logitech", "external", "usb", "capture"]

function isMobileBrowser() {
  return /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)
}

function detectMirrored(facingMode, trackLabel) {
  if (facingMode) return facingMode === "user"
  const label = (trackLabel ?? "").toLowerCase()
  const isExternal = EXTERNAL_CAMERA_LABELS.some((k) => label.includes(k))
  return !isExternal
}

/**
 * Enumerates video input devices after permission is granted.
 * Returns a simplified list with deviceId and label.
 */
async function listVideoDevices() {
  try {
    const allDevices = await navigator.mediaDevices.enumerateDevices()
    return allDevices
      .filter((d) => d.kind === "videoinput")
      .map((d) => ({
        deviceId: d.deviceId,
        label: d.label || `Camera ${d.deviceId.slice(0, 6)}`,
      }))
  } catch {
    return []
  }
}

/**
 * Attempts to apply zoom-out and stabilization to a video track.
 * Silently ignored on unsupported browsers/devices.
 */
async function applyPostStartTuning(track) {
  try {
    const caps = track?.getCapabilities?.()
    const advanced = []

    if (caps?.zoom) {
      advanced.push({ zoom: caps.zoom.min })
    }

    if (caps?.imageStabilization?.includes("on")) {
      advanced.push({ imageStabilization: "on" })
    }

    if (advanced.length > 0) {
      await track.applyConstraints({ advanced })
    }
  } catch {
    // Not all browsers/devices support these capabilities
  }
}

/**
 * Camera stream lifecycle hook.
 *
 * Manages device enumeration, stream acquisition, mirror detection,
 * resolution negotiation, post-start tuning, and orientation changes.
 *
 * @returns {{
 *   videoRef: React.RefObject<HTMLVideoElement>,
 *   startCamera: (deviceId?: string) => Promise<void>,
 *   switchCamera: (deviceId: string) => void,
 *   isReady: boolean,
 *   isRecalibrating: boolean,
 *   isSwitching: boolean,
 *   isMirrored: boolean,
 *   error: string | null,
 *   selectedDeviceId: string | null,
 *   devices: Array<{ deviceId: string, label: string }>,
 * }}
 */
export function useCamera() {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const requestSeqRef = useRef(0)

  const {
    isReady,
    isRecalibrating,
    isSwitching,
    isMirrored,
    error,
    devices,
    selectedDeviceId,
    setReady,
    setRecalibrating,
    setSwitching,
    setMirrored,
    setError,
    setDevices,
    setSelectedDevice,
  } = useCameraStore()

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    setReady(false)
  }, [setReady])

  const enumerateDevices = useCallback(async () => {
    const videoDevices = await listVideoDevices()
    setDevices(videoDevices)
    return videoDevices
  }, [setDevices])

  const startCamera = useCallback(
    async (deviceId) => {
      const requestId = ++requestSeqRef.current

      try {
        setError(null)
        stopCamera()

        const mobile = isMobileBrowser()
        const isPortrait = window.innerHeight > window.innerWidth
        const { stripModeEnabled } = useUiStore.getState()
        const mode = stripModeEnabled ? "strip" : "single"
        const resolution = getCameraIdeal(mode, isPortrait, false)

        const videoConstraints = {
          ...(deviceId ? { deviceId: { exact: deviceId } } : mobile ? { facingMode: "user" } : {}),
          ...resolution,
          ...(!mobile && {
            aspectRatio: { ideal: isPortrait ? 9 / 16 : 16 / 9 },
          }),
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints,
        })

        // Discard stale results (e.g. React Strict Mode double-effects)
        if (requestId !== requestSeqRef.current) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }

        streamRef.current = stream

        const track = stream.getVideoTracks()[0]
        const settings = track?.getSettings()
        const activeDeviceId = settings?.deviceId ?? deviceId ?? null
        setSelectedDevice(activeDeviceId)
        setMirrored(detectMirrored(settings?.facingMode, track?.label))

        await applyPostStartTuning(track)

        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
          setError(null)
          setReady(true)
          setRecalibrating(false)
          setSwitching(false)
        }

        await enumerateDevices()
        logger.info("camera", "Camera started", { deviceId: activeDeviceId })
      } catch (err) {
        if (requestId !== requestSeqRef.current) return

        if (err instanceof DOMException) {
          const messages = {
            NotAllowedError: "Camera access denied. Allow camera in your browser settings.",
            NotFoundError: "No camera found on this device.",
          }
          setError(messages[err.name] ?? `Camera error: ${err.message}`)
        } else {
          setError("Unknown camera error.")
        }
        await enumerateDevices()
      }
    },
    [
      stopCamera,
      enumerateDevices,
      setError,
      setSelectedDevice,
      setMirrored,
      setReady,
      setRecalibrating,
      setSwitching,
    ],
  )

  const switchCamera = useCallback(
    (deviceId) => {
      setSwitching(true)
      startCamera(deviceId)
    },
    [startCamera, setSwitching],
  )

  // Orientation change requires new constraints and zoom reset
  useEffect(() => {
    if (!isReady) return

    let timeout
    const handler = () => {
      clearTimeout(timeout)
      setRecalibrating(true)
      timeout = setTimeout(() => {
        startCamera(selectedDeviceId)
      }, ORIENTATION_DEBOUNCE_MS)
    }

    window.addEventListener("resize", handler)
    window.addEventListener("orientationchange", handler)
    return () => {
      clearTimeout(timeout)
      window.removeEventListener("resize", handler)
      window.removeEventListener("orientationchange", handler)
    }
  }, [isReady, selectedDeviceId, startCamera, setRecalibrating])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      requestSeqRef.current += 1
      streamRef.current?.getTracks().forEach((track) => track.stop())
    }
  }, [])

  return {
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
  }
}