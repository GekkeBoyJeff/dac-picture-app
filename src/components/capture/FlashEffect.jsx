"use client"

import { useCallback, useEffect, useRef } from "react"
import { playShutter } from "@/lib/audio"

export function FlashEffect({ onComplete }) {
  const firedRef = useRef(false)
  const onCompleteRef = useRef(onComplete)

  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  const handleComplete = useCallback(() => {
    if (firedRef.current) return
    firedRef.current = true
    onCompleteRef.current()
  }, [])

  // Haptic feedback + shutter sound on capture
  useEffect(() => {
    if (navigator.vibrate) navigator.vibrate(100)
    playShutter()
  }, [])

  useEffect(() => {
    const timeout = setTimeout(handleComplete, 600)
    return () => clearTimeout(timeout)
  }, [handleComplete])

  return (
    <div
      className="fixed inset-0 z-50 bg-white animate-flash pointer-events-none"
      onAnimationEnd={handleComplete}
    />
  )
}