"use client"

import { useEffect, useRef, useState, useCallback } from "react"

const GESTURE_GRACE_MS = 300

/**
 * Hold-to-trigger logic for gesture actions (e.g. Victory → capture).
 *
 * Reads triggerHandIndexRef from useGestureDetection each rAF frame.
 * Outputs holdProgressRef (0-1, ref-based for zero re-renders) and
 * activeGesture state for the UI indicator.
 *
 * @param {import("react").MutableRefObject<number>} triggerHandIndexRef
 * @param {object}   options
 * @param {number}   options.holdDurationMs   Time in ms to hold before firing.
 * @param {boolean}  options.enabled           Whether hold logic is active.
 * @param {Function} options.onVictory         Callback fired when hold completes.
 */
export function useGestureHold(
  triggerHandIndexRef,
  { holdDurationMs = 1500, enabled = true, onVictory },
) {
  const [activeGesture, setActiveGesture] = useState(null)

  const gestureStartRef = useRef(null)
  const lastGestureSeenRef = useRef(0)
  const victoryFiredRef = useRef(false)
  const holdProgressRef = useRef(null)

  const holdDurationRef = useRef(holdDurationMs)
  const onVictoryRef = useRef(onVictory)

  useEffect(() => {
    holdDurationRef.current = holdDurationMs
  }, [holdDurationMs])
  useEffect(() => {
    onVictoryRef.current = onVictory
  }, [onVictory])

  // Reset when toggled off or re-enabled
  useEffect(() => {
    victoryFiredRef.current = false
    gestureStartRef.current = null
    lastGestureSeenRef.current = 0
    holdProgressRef.current = null

    const timeout = setTimeout(() => setActiveGesture(null), 0)
    return () => clearTimeout(timeout)
  }, [enabled])

  // Reset when hold actions are disabled externally
  useEffect(() => {
    if (!enabled) {
      holdProgressRef.current = null
      gestureStartRef.current = null
      victoryFiredRef.current = false

      const timeout = setTimeout(() => setActiveGesture(null), 0)
      return () => clearTimeout(timeout)
    }
  }, [enabled])

  /**
   * Called every rAF frame by the detection loop (or parent orchestrator).
   * Must be called *after* detection result processing so
   * triggerHandIndexRef is up to date.
   */
  const tick = useCallback(() => {
    if (!enabled) return

    const now = performance.now()
    const hasTrigger = triggerHandIndexRef.current >= 0

    // Register trigger presence
    if (hasTrigger) {
      lastGestureSeenRef.current = now
      if (gestureStartRef.current === null) {
        gestureStartRef.current = now
        victoryFiredRef.current = false
        setActiveGesture("Victory")
      }
    }

    // Progress / grace / completion
    if (gestureStartRef.current !== null && !victoryFiredRef.current) {
      if (now - lastGestureSeenRef.current > GESTURE_GRACE_MS) {
        // Lost the gesture beyond grace window
        gestureStartRef.current = null
        holdProgressRef.current = null
        setActiveGesture(null)
      } else {
        const elapsed = now - gestureStartRef.current
        const progress = Math.min(1, elapsed / Math.max(1, holdDurationRef.current))
        holdProgressRef.current = progress

        if (progress >= 1) {
          victoryFiredRef.current = true
          gestureStartRef.current = null
          holdProgressRef.current = null
          setActiveGesture(null)
          onVictoryRef.current?.()
        }
      }
    }
  }, [enabled, triggerHandIndexRef])

  return { activeGesture, holdProgressRef, tick }
}