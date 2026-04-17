"use client"

import { useState, useEffect, useCallback, useRef } from "react"

const IDLE_EVENTS = ["pointerdown", "pointermove", "keydown", "touchstart"]

/**
 * Returns true when the user has been idle for the given timeout.
 * Resets on pointer, touch, or keyboard activity.
 *
 * @param {number} [timeoutMs=60000] - Idle threshold in milliseconds
 * @returns {boolean}
 */
export function useIdleTimer(timeoutMs = 60_000) {
  const [isIdle, setIsIdle] = useState(false)
  const timerRef = useRef(null)

  const scheduleIdleTimeout = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setIsIdle(true), timeoutMs)
  }, [timeoutMs])

  const resetTimer = useCallback(() => {
    setIsIdle(false)
    scheduleIdleTimeout()
  }, [scheduleIdleTimeout])

  useEffect(() => {
    scheduleIdleTimeout()

    for (const event of IDLE_EVENTS) {
      window.addEventListener(event, resetTimer, { passive: true })
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      for (const event of IDLE_EVENTS) {
        window.removeEventListener(event, resetTimer)
      }
    }
  }, [resetTimer, scheduleIdleTimeout])

  return isIdle
}