"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { playShutter } from "@/lib/audio"

const SAMPLE_SIZE = 8
const BRIGHTNESS_JUMP = 0.12
const BRIGHT_BASELINE = 0.7
const MAX_WAIT_MS = 300
const FIXED_DELAY_MS = 150

function sampleBrightness(video, ctx) {
  ctx.drawImage(video, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE)
  const { data } = ctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE)
  let sum = 0
  for (let i = 0; i < data.length; i += 4) {
    sum += data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114
  }
  return sum / (SAMPLE_SIZE * SAMPLE_SIZE * 255)
}

/**
 * Full-screen white flash with brightness detection from camera feed.
 * Captures at the optimal moment when the flash is visible to the camera sensor.
 */
export function FlashEffect({ videoRef, onCapture, onComplete }) {
  const [fading, setFading] = useState(false)
  const capturedRef = useRef(false)
  const completedRef = useRef(false)
  const onCaptureRef = useRef(onCapture)
  const onCompleteRef = useRef(onComplete)

  useEffect(() => {
    onCaptureRef.current = onCapture
    onCompleteRef.current = onComplete
  }, [onCapture, onComplete])

  useEffect(() => {
    if (navigator.vibrate) navigator.vibrate(100)
    playShutter()

    const fire = () => {
      if (capturedRef.current) return
      capturedRef.current = true
      onCaptureRef.current?.()
      setFading(true)
    }

    const video = videoRef?.current
    if (!video || !video.videoWidth) {
      const t = setTimeout(fire, 150)
      return () => clearTimeout(t)
    }

    const canvas = document.createElement("canvas")
    canvas.width = SAMPLE_SIZE
    canvas.height = SAMPLE_SIZE
    const ctx = canvas.getContext("2d", { willReadFrequently: true })
    if (!ctx) {
      const t = setTimeout(fire, 150)
      return () => clearTimeout(t)
    }
    const baseline = sampleBrightness(video, ctx)

    if (baseline > BRIGHT_BASELINE) {
      const t = setTimeout(fire, FIXED_DELAY_MS)
      return () => clearTimeout(t)
    }

    let rafId
    const start = performance.now()

    const poll = () => {
      if (capturedRef.current) return
      if (performance.now() - start > MAX_WAIT_MS) {
        fire()
        return
      }

      const brightness = sampleBrightness(video, ctx)
      if (brightness - baseline > BRIGHTNESS_JUMP) {
        fire()
        return
      }

      rafId = requestAnimationFrame(poll)
    }

    rafId = requestAnimationFrame(poll)
    return () => cancelAnimationFrame(rafId)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleDone = useCallback(() => {
    if (completedRef.current) return
    completedRef.current = true
    onCompleteRef.current()
  }, [])

  useEffect(() => {
    if (!fading) return
    const timeout = setTimeout(handleDone, 500)
    return () => clearTimeout(timeout)
  }, [fading, handleDone])

  return (
    <div
      className={`fixed inset-0 z-50 bg-white pointer-events-none ${fading ? "animate-flash" : ""}`}
      onAnimationEnd={handleDone}
    />
  )
}
