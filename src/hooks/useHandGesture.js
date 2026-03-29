"use client"

import { useEffect, useRef, useCallback, useState } from "react"
import { useUiStore } from "@/stores/uiStore"
import { logger } from "@/lib/logger"

const DEFAULT_DETECTION_INTERVAL_MS = 0
const MIN_INTERVAL_MS = 0
const MAX_INTERVAL_MS = 1200
const CONFIDENCE_THRESHOLD = 0.001
const TRIGGER_MIN_SCORE = 0.35
const TRIGGER_GESTURES = new Set(["Victory", "ILoveYou", "Deuces"])
const BOX_HOLD_MS = 700
const MIN_DRAW_INTERVAL_MS = 33
const GESTURE_GRACE_MS = 300

const clampInterval = (value) => Math.min(MAX_INTERVAL_MS, Math.max(MIN_INTERVAL_MS, value ?? DEFAULT_DETECTION_INTERVAL_MS))

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || ""

const computeBox = (landmarks, isMirrored) => {
  if (!landmarks?.length) return null
  const xs = landmarks.map((p) => p.x)
  const ys = landmarks.map((p) => p.y)

  let xMin = Math.min(...xs)
  let xMax = Math.max(...xs)
  const yMin = Math.min(...ys)
  const yMax = Math.max(...ys)

  if (isMirrored) {
    const mirroredMin = 1 - xMax
    const mirroredMax = 1 - xMin
    xMin = mirroredMin
    xMax = mirroredMax
  }

  return {
    x: Math.max(0, xMin),
    y: Math.max(0, yMin),
    width: Math.max(0, Math.min(1, xMax) - Math.max(0, xMin)),
    height: Math.max(0, Math.min(1, yMax) - Math.max(0, yMin)),
  }
}

const isTwoFingerVictory = (landmarks) => {
  if (!landmarks?.length) return false
  const wrist = landmarks[0]
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, (a.z || 0) - (b.z || 0))
  const isExtended = (pipIdx, tipIdx) => distance(landmarks[tipIdx], wrist) - distance(landmarks[pipIdx], wrist) > 0.1
  return isExtended(5, 8) && isExtended(9, 12) && !isExtended(13, 16) && !isExtended(17, 20)
}

export function useHandGesture(
  videoRef,
  enabled,
  callbacks,
  isMirrored = false,
  detectionIntervalMs = DEFAULT_DETECTION_INTERVAL_MS,
  triggerMinScore = TRIGGER_MIN_SCORE,
  gestureActionsEnabled = true,
  holdDurationMs = 1500,
  onFrameTick = null,
) {
  const workerRef = useRef(null)
  const animFrameRef = useRef(0)
  const lastDetectRef = useRef(-1)
  const busyRef = useRef(false)
  const [activeGesture, setActiveGesture] = useState(null)
  const [handBoxes, setHandBoxes] = useState([])
  const [gestureBoxes, setGestureBoxes] = useState([])
  const prevBoxesRef = useRef([])
  const lastSeenRef = useRef(new Map())
  const lastDrawRef = useRef(0)
  const gestureStartRef = useRef(null)
  const lastGestureSeenRef = useRef(0)
  const victoryFiredRef = useRef(false)
  const holdProgressRef = useRef(null)
  const rawGestureNameRef = useRef("None")
  const primaryHandLandmarksRef = useRef(null)
  const [gestureLoading, setGestureLoading] = useState(false)
  const gestureLoadingRef = useRef(false)
  const pendingResultRef = useRef(null)

  // Config refs — read inside the animation loop without restarting it
  const isMirroredRef = useRef(isMirrored)
  const intervalRef = useRef(clampInterval(detectionIntervalMs))
  const triggerMinScoreRef = useRef(triggerMinScore)
  const gestureActionsRef = useRef(gestureActionsEnabled)
  const holdDurationRef = useRef(holdDurationMs)
  const callbacksRef = useRef(callbacks)
  const onFrameTickRef = useRef(onFrameTick)

  useEffect(() => { isMirroredRef.current = isMirrored }, [isMirrored])
  useEffect(() => { intervalRef.current = clampInterval(detectionIntervalMs) }, [detectionIntervalMs])
  useEffect(() => { triggerMinScoreRef.current = triggerMinScore }, [triggerMinScore])
  useEffect(() => { gestureActionsRef.current = gestureActionsEnabled }, [gestureActionsEnabled])
  useEffect(() => { holdDurationRef.current = holdDurationMs }, [holdDurationMs])
  useEffect(() => { callbacksRef.current = callbacks }, [callbacks])
  useEffect(() => { onFrameTickRef.current = onFrameTick }, [onFrameTick])

  useEffect(() => {
    victoryFiredRef.current = false
    gestureStartRef.current = null
    lastGestureSeenRef.current = 0
    lastSeenRef.current = new Map()
    setActiveGesture(null)
    holdProgressRef.current = null
    setHandBoxes([])
    setGestureBoxes([])
  }, [enabled])

  useEffect(() => {
    if (!gestureActionsEnabled) {
      setGestureBoxes([])
      setActiveGesture(null)
      holdProgressRef.current = null
      gestureStartRef.current = null
      victoryFiredRef.current = false
    }
  }, [gestureActionsEnabled])

  const initWorker = useCallback(() => {
    if (workerRef.current) return

    setGestureLoading(true)
    gestureLoadingRef.current = true
    logger.info("gesture", "Spawning gesture worker...")

    const worker = new Worker(`${BASE_PATH}/gesture-worker.js`, { type: "module" })
    workerRef.current = worker

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

    const {
      numHands: nh,
      minDetectionConfidence: mdc,
      minPresenceConfidence: mpc,
      minTrackingConfidence: mtc,
    } = useUiStore.getState()
    worker.postMessage({
      type: "init",
      numHands: nh,
      minHandDetectionConfidence: mdc,
      minHandPresenceConfidence: mpc,
      minTrackingConfidence: mtc,
    })
  }, [])

  // Sync recognizer options to running worker without reloading the model
  const numHands = useUiStore((s) => s.numHands)
  const minDetectionConfidence = useUiStore((s) => s.minDetectionConfidence)
  const minPresenceConfidence = useUiStore((s) => s.minPresenceConfidence)
  const minTrackingConfidence = useUiStore((s) => s.minTrackingConfidence)
  useEffect(() => {
    workerRef.current?.postMessage({
      type: "setOptions",
      options: {
        numHands,
        minHandDetectionConfidence: minDetectionConfidence,
        minHandPresenceConfidence: minPresenceConfidence,
        minTrackingConfidence,
      },
    })
  }, [numHands, minDetectionConfidence, minPresenceConfidence, minTrackingConfidence])

  useEffect(() => {
    if (!enabled) return

    let stopped = false

    // Reset state so stale refs don't block the new loop
    gestureStartRef.current = null
    victoryFiredRef.current = false
    busyRef.current = false
    pendingResultRef.current = null
    lastDetectRef.current = -1

    setActiveGesture(null)
    holdProgressRef.current = null

    initWorker()

    const tick = () => {
      if (stopped) return

      const now = performance.now()
      const interval = intervalRef.current
      const actionsEnabled = gestureActionsRef.current
      const mirrored = isMirroredRef.current

      // Process pending worker result
      const result = pendingResultRef.current
      if (result) {
        pendingResultRef.current = null

        const gestures = result.gestures || []
        const allLandmarks = result.landmarks || []

        let triggerHandIndex = -1
        let triggerScore = 0
        const boxes = []

        const effectiveTriggerMin = Math.max(CONFIDENCE_THRESHOLD, triggerMinScoreRef.current ?? TRIGGER_MIN_SCORE)

        if (actionsEnabled) {
          gestures.forEach((gestureList, idx) => {
            gestureList.forEach((g) => {
              if (TRIGGER_GESTURES.has(g.categoryName) && g.score >= effectiveTriggerMin && g.score > triggerScore) {
                triggerScore = g.score
                triggerHandIndex = idx
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
          if (actionsEnabled && triggerHandIndex < 0 && isTwoFingerVictory(landmarks)) {
            triggerHandIndex = idx
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
        const unchanged = sameLength && boxes.every((b, idx) => {
          const p = prevBoxesRef.current[idx]
          return p && Math.abs(b.x - p.x) < 0.003 && Math.abs(b.y - p.y) < 0.003 &&
            Math.abs(b.width - p.width) < 0.003 && Math.abs(b.height - p.height) < 0.003 && b.index === p.index
        })

        if (!unchanged && now - lastDrawRef.current >= MIN_DRAW_INTERVAL_MS) {
          prevBoxesRef.current = boxes
          setHandBoxes(boxes)
          lastDrawRef.current = now
        }

        if (actionsEnabled) {
          setGestureBoxes(boxes)
          if (triggerHandIndex >= 0) {
            lastGestureSeenRef.current = now
            if (gestureStartRef.current === null) {
              gestureStartRef.current = now
              victoryFiredRef.current = false
              setActiveGesture("Victory")
            }
          }
        }
      }

      // Hold progress — runs every frame for smooth animation
      if (gestureStartRef.current !== null && !victoryFiredRef.current) {
        if (now - lastGestureSeenRef.current > GESTURE_GRACE_MS) {
          gestureStartRef.current = null
      
          setActiveGesture(null)
          holdProgressRef.current = null
        } else {
          const elapsed = now - gestureStartRef.current
          const progress = Math.min(1, elapsed / Math.max(1, holdDurationRef.current))
          holdProgressRef.current = progress

          if (progress >= 1) {
            victoryFiredRef.current = true
            gestureStartRef.current = null
        
            setActiveGesture(null)
            holdProgressRef.current = null
            callbacksRef.current.onVictory()
          }
        }
      }

      // Send new frame to worker if not busy
      const video = videoRef.current
      const worker = workerRef.current
      if (video && worker && !busyRef.current && video.readyState >= 2 && video.videoWidth > 0) {
        const timeSinceLast = now - lastDetectRef.current
        if (interval <= 0 || timeSinceLast >= interval) {
          lastDetectRef.current = now
          busyRef.current = true
          createImageBitmap(video).then((bitmap) => {
            if (stopped) { bitmap.close(); return }
            worker.postMessage({ type: "detect", bitmap, timestamp: now }, [bitmap])
          }).catch(() => { busyRef.current = false })
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
      workerRef.current?.postMessage({ type: "close" })
      workerRef.current = null
    }
  }, [])

  return { activeGesture, handBoxes, gestureBoxes, holdProgressRef, gestureLoading, rawGestureNameRef, primaryHandLandmarksRef }
}
