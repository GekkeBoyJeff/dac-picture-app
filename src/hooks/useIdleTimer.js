"use client"

import { useState, useEffect, useCallback, useRef } from "react"

const IDLE_EVENTS = ["pointerdown", "pointermove", "keydown", "touchstart"]

/**
 * Returns `true` when the user has been idle for `timeoutMs`.
 * Resets on pointer/touch/key activity.
 */
export function useIdleTimer(timeoutMs = 60_000) {
  const [isIdle, setIsIdle] = useState(false)
  const timerRef = useRef(null)

  const resetTimer = useCallback(() => {
    setIsIdle(false)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setIsIdle(true), timeoutMs)
  }, [timeoutMs])

  useEffect(() => {
    resetTimer()

    for (const event of IDLE_EVENTS) {
      window.addEventListener(event, resetTimer, { passive: true })
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      for (const event of IDLE_EVENTS) {
        window.removeEventListener(event, resetTimer)
      }
    }
  }, [resetTimer])

  return isIdle
}
