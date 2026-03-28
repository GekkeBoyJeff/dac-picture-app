"use client"

import { useRef, useCallback, useMemo } from "react"
import {
  GESTURE_SEQUENCE_OPEN,
  GESTURE_SEQUENCE_STEP_HOLD_MS,
  GESTURE_SEQUENCE_TIMEOUT_MS,
} from "@/lib/config"
import { logger } from "@/lib/logger"

/**
 * State machine that tracks a gesture sequence.
 * Driven entirely by refs — never causes re-renders.
 */
export function useGestureSequence(rawGestureNameRef, { onComplete, enabled = true, sequence: customSequence }) {
  const sequence = customSequence || GESTURE_SEQUENCE_OPEN
  const currentStepRef = useRef(0)
  const isActiveRef = useRef(false)
  const stepStartRef = useRef(null)
  const sequenceStartRef = useRef(null)
  const waitingForTransitionRef = useRef(false)

  const reset = useCallback(() => {
    currentStepRef.current = 0
    isActiveRef.current = false
    stepStartRef.current = null
    sequenceStartRef.current = null
    waitingForTransitionRef.current = false
  }, [])

  const tick = useCallback(() => {
    if (!enabled) {
      if (isActiveRef.current || currentStepRef.current !== 0) reset()
      return
    }

    const gesture = rawGestureNameRef.current
    const now = performance.now()
    const expected = sequence[0]

    // Not yet started — check if current gesture matches step 0
    if (!isActiveRef.current) {
      if (gesture === expected) {
        if (!stepStartRef.current) {
          stepStartRef.current = now
        } else if (now - stepStartRef.current >= GESTURE_SEQUENCE_STEP_HOLD_MS) {
          logger.debug("gesture-seq", "step 0 complete → sequence ACTIVE")
          isActiveRef.current = true
          sequenceStartRef.current = now
          currentStepRef.current = 1
          stepStartRef.current = null
          waitingForTransitionRef.current = true
        }
      } else {
        stepStartRef.current = null
      }
      return
    }

    // Sequence is active — check timeout
    if (sequenceStartRef.current && now - sequenceStartRef.current > GESTURE_SEQUENCE_TIMEOUT_MS) {
      logger.debug("gesture-seq", "TIMEOUT → reset")
      reset()
      return
    }

    const stepIdx = currentStepRef.current
    if (stepIdx >= sequence.length) return

    const target = sequence[stepIdx]

    // Must transition away from previous gesture first
    if (waitingForTransitionRef.current) {
      const prevTarget = sequence[stepIdx - 1]
      if (gesture !== prevTarget) {
        waitingForTransitionRef.current = false
      }
      stepStartRef.current = null
      return
    }

    if (gesture === target) {
      if (!stepStartRef.current) {
        stepStartRef.current = now
      } else if (now - stepStartRef.current >= GESTURE_SEQUENCE_STEP_HOLD_MS) {
        const nextStep = stepIdx + 1
        if (nextStep >= sequence.length) {
          logger.debug("gesture-seq", "SEQUENCE COMPLETE!")
          reset()
          onComplete?.()
        } else {
          logger.debug("gesture-seq", `step ${stepIdx} complete → step ${nextStep}`)
          currentStepRef.current = nextStep
          stepStartRef.current = null
          waitingForTransitionRef.current = true
        }
      }
    } else {
      stepStartRef.current = null
    }
  }, [enabled, rawGestureNameRef, onComplete, reset, sequence])

  return useMemo(() => ({
    tick,
    currentStepRef,
    isActiveRef,
    totalSteps: sequence.length,
    sequence,
  }), [tick, sequence])
}