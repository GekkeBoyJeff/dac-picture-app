"use client"

import { useCallback, useEffect, useRef } from "react"

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