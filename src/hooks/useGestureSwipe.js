"use client"

import { useRef, useCallback, useMemo } from "react"
import { GESTURE_SWIPE_ENGAGE_MS, GESTURE_SWIPE_DEAD_ZONE } from "@/lib/config"

/**
 * Tracks hand-swipe gestures for navigating the layout slider.
 *
 * Fully ref-based — never causes re-renders.  The LayoutSlider reads
 * the refs directly via requestAnimationFrame for smooth animation.
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

  const lastLogRef = useRef(0)

  const tick = useCallback(() => {
    if (!enabled) {
      if (isEngagedRef.current || swipeDeltaRef.current !== 0) {
        console.log("[GestureSwipe] disabled → reset")
        reset()
      }
      return
    }

    const gesture = rawGestureNameRef.current
    const isPalm = gesture === "Open_Palm"
    const now = performance.now()

    if (!isPalm) {
      if (isEngagedRef.current) {
        console.log(`[GestureSwipe] disengage (gesture="${gesture}", delta=${swipeDeltaRef.current.toFixed(3)})`)
      }
      palmStartRef.current = null
      anchorXRef.current = null
      isEngagedRef.current = false
      return
    }

    if (!palmStartRef.current) {
      palmStartRef.current = now
    }

    const palmX = primaryHandLandmarksRef.current?.[9]?.x

    if (!isEngagedRef.current) {
      const held = Math.round(now - palmStartRef.current)
      if (now - lastLogRef.current > 500) {
        lastLogRef.current = now
        console.log(`[GestureSwipe] palm held=${held}ms / ${GESTURE_SWIPE_ENGAGE_MS}ms (waiting to engage)`)
      }
      if (held >= GESTURE_SWIPE_ENGAGE_MS && palmX != null) {
        console.log(`[GestureSwipe] ENGAGED at anchorX=${palmX.toFixed(3)}`)
        isEngagedRef.current = true
        anchorXRef.current = palmX
        swipeDeltaRef.current = 0
      }
    } else if (palmX != null && anchorXRef.current != null) {
      const raw = -(palmX - anchorXRef.current)
      swipeDeltaRef.current = Math.abs(raw) < GESTURE_SWIPE_DEAD_ZONE ? 0 : raw
      if (now - lastLogRef.current > 200) {
        lastLogRef.current = now
        console.log(`[GestureSwipe] delta=${swipeDeltaRef.current.toFixed(3)} palmX=${palmX.toFixed(3)}`)
      }
    }
  }, [enabled, rawGestureNameRef, primaryHandLandmarksRef, reset])

  return useMemo(() => ({
    tick,
    isEngagedRef,
    swipeDeltaRef,
  }), [tick])
}
