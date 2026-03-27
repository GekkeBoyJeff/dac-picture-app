"use client"

import { useRef, useCallback, useMemo } from "react"
import {
  GESTURE_SEQUENCE_OPEN,
  GESTURE_SEQUENCE_STEP_HOLD_MS,
  GESTURE_SEQUENCE_TIMEOUT_MS,
} from "@/lib/config"

/**
 * State machine that tracks a gesture sequence.
 * Default sequence is Open_Palm → Closed_Fist → Open_Palm → Closed_Fist,
 * but any sequence of gesture names can be passed.
 *
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

  const lastLogRef = useRef(0)

  // Called every frame from the detection render cycle
  const tick = useCallback(() => {
    if (!enabled) {
      if (isActiveRef.current || currentStepRef.current !== 0) {
        console.log("[GestureSeq] disabled → reset")
        reset()
      }
      return
    }

    const gesture = rawGestureNameRef.current
    const now = performance.now()
    const expected = sequence[0]

    // Throttled log of raw gesture (every 500ms to avoid spam)
    if (now - lastLogRef.current > 500) {
      lastLogRef.current = now
      if (isActiveRef.current) {
        console.log(`[GestureSeq] step=${currentStepRef.current}/${sequence.length} gesture="${gesture}" waitTransition=${waitingForTransitionRef.current}`)
      } else if (gesture === expected) {
        const held = stepStartRef.current ? Math.round(now - stepStartRef.current) : 0
        console.log(`[GestureSeq] detecting step0: "${gesture}" held=${held}ms / ${GESTURE_SEQUENCE_STEP_HOLD_MS}ms`)
      }
    }

    // Not yet started — check if current gesture matches step 0
    if (!isActiveRef.current) {
      if (gesture === expected) {
        if (!stepStartRef.current) {
          stepStartRef.current = now
        } else if (now - stepStartRef.current >= GESTURE_SEQUENCE_STEP_HOLD_MS) {
          console.log("[GestureSeq] step 0 complete → sequence ACTIVE")
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
      console.log("[GestureSeq] TIMEOUT → reset")
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
        console.log(`[GestureSeq] transition detected (was "${prevTarget}", now "${gesture}") → ready for step ${stepIdx}`)
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
          console.log("[GestureSeq] SEQUENCE COMPLETE!")
          reset()
          onComplete?.()
        } else {
          console.log(`[GestureSeq] step ${stepIdx} ("${target}") complete → step ${nextStep}`)
          currentStepRef.current = nextStep
          stepStartRef.current = null
          waitingForTransitionRef.current = true
        }
      }
    } else {
      stepStartRef.current = null
    }
  }, [enabled, rawGestureNameRef, onComplete, reset])

  return useMemo(() => ({
    tick,
    currentStepRef,
    isActiveRef,
    totalSteps: sequence.length,
    sequence,
  }), [tick])
}
