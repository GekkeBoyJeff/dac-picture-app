"use client"

import { useEffect, useRef, useCallback, useState } from "react"
import { useUiStore } from "@/stores/uiStore"
import { logger } from "@/lib/logger"
import {
  createGestureWorker,
  updateWorkerOptions,
  closeWorker,
} from "@/features/gestures/lib/gestureWorkerBridge"
import { computeBox, isTwoFingerVictory } from "@/features/gestures/lib/handMath"

const MIN_INTERVAL_MS = 0
const MAX_INTERVAL_MS = 1200
const DEFAULT_DETECTION_INTERVAL_MS = 0
const CONFIDENCE_THRESHOLD = 0.001
const TRIGGER_MIN_SCORE = 0.35
const TRIGGER_GESTURES = new Set(["Victory", "ILoveYou", "Deuces"])
const BOX_HOLD_MS = 700
const MIN_DRAW_INTERVAL_MS = 33
const clampInterval = (v) =>
  Math.min(MAX_INTERVAL_MS, Math.max(MIN_INTERVAL_MS, v ?? DEFAULT_DETECTION_INTERVAL_MS))

/** Worker lifecycle, rAF loop, frame dispatch. Outputs raw gesture data for downstream hooks. */
export function useGestureDetection(
  videoRef,
  enabled,
  {
    isMirrored = false,
    detectionIntervalMs = DEFAULT_DETECTION_INTERVAL_MS,
    triggerMinScore = TRIGGER_MIN_SCORE,
    gestureActionsEnabled = true,
    onFrameTick = null,
  } = {},
) {
  const workerRef = useRef(null)
  const animFrameRef = useRef(0)
  const lastDetectRef = useRef(-1)
  const busyRef = useRef(false)
  const pendingResultRef = useRef(null)

  const rawGestureNameRef = useRef("None")
  const primaryHandLandmarksRef = useRef(null)
  const [handBoxes, setHandBoxes] = useState([])
  const [gestureBoxes, setGestureBoxes] = useState([])
  const [gestureLoading, setGestureLoading] = useState(false)
  const gestureLoadingRef = useRef(false)
  const prevBoxesRef = useRef([])
  const lastSeenRef = useRef(new Map())
  const lastDrawRef = useRef(0)
  const triggerHandIndexRef = useRef(-1)
  const isMirroredRef = useRef(isMirrored)
  const intervalRef = useRef(clampInterval(detectionIntervalMs))
  const triggerMinScoreRef = useRef(triggerMinScore)
  const gestureActionsRef = useRef(gestureActionsEnabled)
  const onFrameTickRef = useRef(onFrameTick)

  useEffect(() => {
    isMirroredRef.current = isMirrored
  }, [isMirrored])
  useEffect(() => {
    intervalRef.current = clampInterval(detectionIntervalMs)
  }, [detectionIntervalMs])
  useEffect(() => {
    triggerMinScoreRef.current = triggerMinScore
  }, [triggerMinScore])
  useEffect(() => {
    gestureActionsRef.current = gestureActionsEnabled
  }, [gestureActionsEnabled])
  useEffect(() => {
    onFrameTickRef.current = onFrameTick
  }, [onFrameTick])

  useEffect(() => {
    lastSeenRef.current = new Map()
    const timeout = setTimeout(() => {
      setHandBoxes([])
      setGestureBoxes([])
    }, 0)
    return () => clearTimeout(timeout)
  }, [enabled])

  useEffect(() => {
    if (!gestureActionsEnabled) {
      const timeout = setTimeout(() => setGestureBoxes([]), 0)
      return () => clearTimeout(timeout)
    }
  }, [gestureActionsEnabled])

  const initWorker = useCallback(() => {
    if (workerRef.current) return

    const { numHands, minDetectionConfidence, minPresenceConfidence, minTrackingConfidence } =
      useUiStore.getState()

    const worker = createGestureWorker({
      numHands,
      minHandDetectionConfidence: minDetectionConfidence,
      minHandPresenceConfidence: minPresenceConfidence,
      minTrackingConfidence,
    })

    worker.addEventListener("message", (e) => {
      const { type } = e.data
      if (type === "ready") {
        logger.info("gesture", `MediaPipe initialized in worker (${e.data.delegate})`)
        if (gestureLoadingRef.current) {
          gestureLoadingRef.current = false
          setGestureLoading(false)
        }
      } else if (type === "result") {
        pendingResultRef.current = e.data
        busyRef.current = false
      } else if (type === "error") {
        logger.warn("gesture", "Worker error:", e.data.message)
        busyRef.current = false
      }
    })

    worker.addEventListener("error", (e) => {
      logger.warn("gesture", "Worker crashed:", e.message)
    })

    workerRef.current = worker
  }, [])

  const numHands = useUiStore((s) => s.numHands)
  const minDetectionConfidence = useUiStore((s) => s.minDetectionConfidence)
  const minPresenceConfidence = useUiStore((s) => s.minPresenceConfidence)
  const minTrackingConfidence = useUiStore((s) => s.minTrackingConfidence)

  useEffect(() => {
    updateWorkerOptions(workerRef.current, {
      numHands,
      minHandDetectionConfidence: minDetectionConfidence,
      minHandPresenceConfidence: minPresenceConfidence,
      minTrackingConfidence,
    })
  }, [numHands, minDetectionConfidence, minPresenceConfidence, minTrackingConfidence])

  useEffect(() => {
    if (!enabled) return

    let stopped = false

    busyRef.current = false
    pendingResultRef.current = null
    lastDetectRef.current = -1
    triggerHandIndexRef.current = -1

    if (!workerRef.current) {
      gestureLoadingRef.current = true
      setTimeout(() => setGestureLoading(true), 0)
    }

    initWorker()

    const tick = () => {
      if (stopped) return

      const now = performance.now()
      const interval = intervalRef.current
      const actionsEnabled = gestureActionsRef.current
      const mirrored = isMirroredRef.current

      const result = pendingResultRef.current
      if (result) {
        pendingResultRef.current = null

        const gestures = result.gestures || []
        const allLandmarks = result.landmarks || []

        let triggerIdx = -1
        let triggerScore = 0
        const boxes = []

        const effectiveMin = Math.max(
          CONFIDENCE_THRESHOLD,
          triggerMinScoreRef.current ?? TRIGGER_MIN_SCORE,
        )

        if (actionsEnabled) {
          gestures.forEach((gestureList, idx) => {
            gestureList.forEach((g) => {
              if (
                TRIGGER_GESTURES.has(g.categoryName) &&
                g.score >= effectiveMin &&
                g.score > triggerScore
              ) {
                triggerScore = g.score
                triggerIdx = idx
              }
            })
          })
        }

        const topGesture = gestures[0]?.[0]
        rawGestureNameRef.current = topGesture?.categoryName ?? "None"
        primaryHandLandmarksRef.current = allLandmarks[0] ?? null

        allLandmarks.forEach((landmarks, idx) => {
          if (!landmarks || landmarks.length === 0) return
          const box = computeBox(landmarks, mirrored)
          if (box) {
            boxes.push({ ...box, index: idx })
            lastSeenRef.current.set(idx, now)
          }
          if (actionsEnabled && triggerIdx < 0 && isTwoFingerVictory(landmarks)) {
            triggerIdx = idx
          }
        })

        if (boxes.length === 0 && prevBoxesRef.current.length > 0) {
          const held = prevBoxesRef.current.filter((prev) => {
            const seenAt = lastSeenRef.current.get(prev.index) || 0
            return now - seenAt < BOX_HOLD_MS
          })
          if (held.length > 0) boxes.push(...held)
        }

        const sameLength = boxes.length === prevBoxesRef.current.length
        const unchanged =
          sameLength &&
          boxes.every((b, i) => {
            const p = prevBoxesRef.current[i]
            return (
              p &&
              Math.abs(b.x - p.x) < 0.003 &&
              Math.abs(b.y - p.y) < 0.003 &&
              Math.abs(b.width - p.width) < 0.003 &&
              Math.abs(b.height - p.height) < 0.003 &&
              b.index === p.index
            )
          })

        if (!unchanged && now - lastDrawRef.current >= MIN_DRAW_INTERVAL_MS) {
          prevBoxesRef.current = boxes
          setHandBoxes(boxes)
          lastDrawRef.current = now
        }

        if (actionsEnabled) {
          setGestureBoxes(boxes)
          triggerHandIndexRef.current = triggerIdx
        }
      }

      const video = videoRef.current
      const worker = workerRef.current
      if (video && worker && !busyRef.current && video.readyState >= 2 && video.videoWidth > 0) {
        const timeSinceLast = now - lastDetectRef.current
        if (interval <= 0 || timeSinceLast >= interval) {
          lastDetectRef.current = now
          busyRef.current = true
          createImageBitmap(video)
            .then((bitmap) => {
              if (stopped) {
                bitmap.close()
                return
              }
              worker.postMessage({ type: "detect", bitmap, timestamp: now }, [bitmap])
            })
            .catch(() => {
              busyRef.current = false
            })
        }
      }

      if (onFrameTickRef.current) onFrameTickRef.current()
      animFrameRef.current = requestAnimationFrame(tick)
    }

    animFrameRef.current = requestAnimationFrame(tick)

    return () => {
      stopped = true
      cancelAnimationFrame(animFrameRef.current)
    }
  }, [enabled, videoRef, initWorker])

  useEffect(() => {
    return () => {
      closeWorker(workerRef.current)
      workerRef.current = null
    }
  }, [])

  return {
    rawGestureNameRef,
    primaryHandLandmarksRef,
    handBoxes,
    gestureBoxes,
    gestureLoading,
    triggerHandIndexRef,
  }
}