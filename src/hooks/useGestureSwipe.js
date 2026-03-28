"use client"

import { useRef, useCallback, useMemo } from "react"
import { GESTURE_SWIPE_ENGAGE_MS, GESTURE_SWIPE_DEAD_ZONE } from "@/lib/config"
import { logger } from "@/lib/logger"

/**
 * Tracks hand-swipe gestures for navigating the layout slider.
 * Fully ref-based — never causes re-renders.
 */
export function useGestureSwipe(rawGestureNameRef, primaryHandLandmarksRef, { enabled = false }) {
  const isEngagedRef = useRef(false)
  const swipeDeltaRef = useRef(0)
  const palmStartRef = useRef(null)
  const anchorXRef = useRef(null)

  const reset = useCallback(() => {
    isEngagedRef.current = false
    swipeDeltaRef.current = 0
    palmStartRef.current = null
    anchorXRef.current = null
  }, [])

  const tick = useCallback(() => {
    if (!enabled) {
      if (isEngagedRef.current || swipeDeltaRef.current !== 0) reset()
      return
    }

    const gesture = rawGestureNameRef.current
    const isPalm = gesture === "Open_Palm"

    if (!isPalm) {
      if (isEngagedRef.current) {
        logger.debug("gesture-swipe", `disengage (delta=${swipeDeltaRef.current.toFixed(3)})`)
      }
      palmStartRef.current = null
      anchorXRef.current = null
      isEngagedRef.current = false
      return
    }

    const now = performance.now()
    if (!palmStartRef.current) palmStartRef.current = now

    const palmX = primaryHandLandmarksRef.current?.[9]?.x

    if (!isEngagedRef.current) {
      const held = Math.round(now - palmStartRef.current)
      if (held >= GESTURE_SWIPE_ENGAGE_MS && palmX != null) {
        logger.debug("gesture-swipe", `ENGAGED at anchorX=${palmX.toFixed(3)}`)
        isEngagedRef.current = true
        anchorXRef.current = palmX
        swipeDeltaRef.current = 0
      }
    } else if (palmX != null && anchorXRef.current != null) {
      const raw = -(palmX - anchorXRef.current)
      swipeDeltaRef.current = Math.abs(raw) < GESTURE_SWIPE_DEAD_ZONE ? 0 : raw
    }
  }, [enabled, rawGestureNameRef, primaryHandLandmarksRef, reset])

  return useMemo(() => ({
    tick,
    isEngagedRef,
    swipeDeltaRef,
  }), [tick])
}