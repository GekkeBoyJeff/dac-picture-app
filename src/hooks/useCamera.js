"use client"

import { useRef, useCallback, useEffect } from "react"
import { useCameraStore } from "@/stores/cameraStore"
import { logger } from "@/lib/logger"

export function useCamera() {
  const videoRef = useRef(null)
  const streamRef = useRef(null)

  const {
    isReady, isRecalibrating, isSwitching, isMirrored, error,
    devices, selectedDeviceId,
    setReady, setRecalibrating, setSwitching, setMirrored,
    setError, setDevices, setSelectedDevice,
  } = useCameraStore()

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    setReady(false)
  }, [setReady])

  const enumerateDevices = useCallback(async () => {
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = allDevices
        .filter((d) => d.kind === "videoinput")
        .map((d) => ({
          deviceId: d.deviceId,
          label: d.label || `Camera ${d.deviceId.slice(0, 6)}`,
        }))
      setDevices(videoDevices)
      return videoDevices
    } catch {
      return []
    }
  }, [setDevices])

  const startCamera = useCallback(
    async (deviceId) => {
      try {
        setError(null)
        stopCamera()

        const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)
        const isPortrait = window.innerHeight > window.innerWidth
        const constraints = {
          video: {
            ...(deviceId
              ? { deviceId: { exact: deviceId } }
              : isMobile
                ? { facingMode: "user" }
                : {}),
            ...(isMobile
              ? {
                  width: { ideal: 4096 },
                  height: { ideal: 4096 },
                }
              : {
                  width: { ideal: 4096 },
                  height: { ideal: 4096 },
                  aspectRatio: { ideal: isPortrait ? 9 / 16 : 16 / 9 },
                }),
          },
        }

        const stream = await navigator.mediaDevices.getUserMedia(constraints)
        streamRef.current = stream

        const track = stream.getVideoTracks()[0]
        const settings = track?.getSettings()
        const activeDeviceId = settings?.deviceId ?? deviceId ?? null
        setSelectedDevice(activeDeviceId)

        const facingMode = settings?.facingMode
        const label = track?.label?.toLowerCase() ?? ""
        const isExternal =
          label.includes("elgato") ||
          label.includes("logitech") ||
          label.includes("external") ||
          label.includes("usb") ||
          label.includes("capture")
        setMirrored(facingMode ? facingMode === "user" : !isExternal)

        // Widest zoom angle for group photos; stabilization reduces shake.
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

        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
          setReady(true)
          setRecalibrating(false)
          setSwitching(false)
        }

        await enumerateDevices()
        logger.info("camera", "Camera started", { deviceId: activeDeviceId })
      } catch (err) {
        if (err instanceof DOMException) {
          const messages = {
            NotAllowedError: "Camera toegang geweigerd. Sta camera toe in je browser.",
            NotFoundError: "Geen camera gevonden op dit apparaat.",
          }
          setError(messages[err.name] ?? `Camera fout: ${err.message}`)
        } else {
          setError("Onbekende camera fout.")
        }
        await enumerateDevices()
      }
    },
    [stopCamera, enumerateDevices, setError, setSelectedDevice, setMirrored, setReady, setRecalibrating, setSwitching],
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
      }, 500)
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