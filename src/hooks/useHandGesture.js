"use client"

import { useEffect, useRef, useCallback, useState } from "react"
import { logger } from "@/lib/logger"

// Default 0ms = every animation frame for snappy box drawing.
const DEFAULT_DETECTION_INTERVAL_MS = 0
const MIN_INTERVAL_MS = 0
const MAX_INTERVAL_MS = 1200
const CONFIDENCE_THRESHOLD = 0.001
const TRIGGER_MIN_SCORE = 0.35
const TRIGGER_GESTURES = new Set(["Victory", "ILoveYou", "Deuces"])
const BOX_HOLD_MS = 700
const MIN_DRAW_INTERVAL_MS = 33
const GESTURE_GRACE_MS = 100

const clampInterval = (value) => Math.min(MAX_INTERVAL_MS, Math.max(MIN_INTERVAL_MS, value ?? DEFAULT_DETECTION_INTERVAL_MS))

/**
 * Install a persistent console filter for TensorFlow Lite WASM noise.
 * MediaPipe's WASM module captures the console.error reference at init time,
 * so we must install the filter BEFORE importing MediaPipe, and keep it active
 * for the lifetime of the recognizer. Only filters specific TF Lite "INFO:" messages.
 */
let tfNoiseFilterInstalled = false
function installTfLiteNoiseFilter() {
  if (tfNoiseFilterInstalled) return
  tfNoiseFilterInstalled = true

  const origError = console.error
  const origWarn = console.warn
  const isTfNoise = (arg) =>
    typeof arg === "string" && (arg.includes("TensorFlow Lite") || arg.includes("tflite") || arg.includes("INFO: Created"))

  console.error = (...args) => { if (!isTfNoise(args[0])) origError(...args) }
  console.warn = (...args) => { if (!isTfNoise(args[0])) origWarn(...args) }
}

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
) {
  const recognizerRef = useRef(null)
  const animFrameRef = useRef(0)
  const lastTimestampRef = useRef(-1)
  const [activeGesture, setActiveGesture] = useState(null)
  const [handBoxes, setHandBoxes] = useState([])
  const [gestureBoxes, setGestureBoxes] = useState([])
  const prevBoxesRef = useRef([])
  const lastSeenRef = useRef(new Map())
  const lastDrawRef = useRef(0)
  const lastGestureEvalRef = useRef(0)

  const gestureStartRef = useRef(null)
  const lastGestureSeenRef = useRef(0)
  const victoryFiredRef = useRef(false)
  const [holdProgress, setHoldProgress] = useState(null)
  const rawGestureNameRef = useRef("None")
  const primaryHandLandmarksRef = useRef(null)
  const [gestureLoading, setGestureLoading] = useState(false)
  const gestureLoadingRef = useRef(false)

  useEffect(() => {
    victoryFiredRef.current = false
    gestureStartRef.current = null
    lastGestureSeenRef.current = 0
    lastSeenRef.current = new Map()
    setActiveGesture(null)
    setHoldProgress(null)
    setHandBoxes([])
    setGestureBoxes([])
  }, [enabled])

  // Clear gesture UI and reset hold state when actions are disabled (countdown, strip active, etc.)
  useEffect(() => {
    if (!gestureActionsEnabled) {
      setGestureBoxes([])
      setActiveGesture(null)
      setHoldProgress(null)
      gestureStartRef.current = null
      victoryFiredRef.current = false
    }
  }, [gestureActionsEnabled])

  // Dynamic import — MediaPipe only loads when gestures are first enabled
  const initRecognizer = useCallback(async () => {
    if (recognizerRef.current) return

    setGestureLoading(true)
    gestureLoadingRef.current = true
    logger.info("gesture", "Loading MediaPipe (dynamic import)...")
    installTfLiteNoiseFilter()
    const { GestureRecognizer, FilesetResolver } = await import("@mediapipe/tasks-vision")

    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.33/wasm",
    )

    const modelOptions = {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
        delegate: "GPU",
      },
      runningMode: "VIDEO",
      numHands: 2,
    }

    try {
      recognizerRef.current = await GestureRecognizer.createFromOptions(vision, modelOptions)
      logger.info("gesture", "MediaPipe initialized (GPU)")
    } catch {
      try {
        recognizerRef.current = await GestureRecognizer.createFromOptions(vision, {
          ...modelOptions,
          baseOptions: { ...modelOptions.baseOptions, delegate: "CPU" },
        })
        logger.info("gesture", "MediaPipe initialized (CPU fallback)")
      } catch (cpuErr) {
        logger.warn("gesture", "Failed to initialize (GPU + CPU):", cpuErr?.message)
        recognizerRef.current = null
      }
    } finally {
      if (!recognizerRef.current) {
        gestureLoadingRef.current = false
        setGestureLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    if (!enabled) return

    let stopped = false
    const interval = clampInterval(detectionIntervalMs)

    const run = async () => {
      await initRecognizer()
      if (stopped) return

      const detect = () => {
        if (stopped || !enabled) return

        const video = videoRef.current
        const recognizer = recognizerRef.current

        if (video && recognizer && video.readyState >= 2 && video.videoWidth > 0) {
          const now = performance.now()
          if (now > lastTimestampRef.current) {
            lastTimestampRef.current = now
            try {
              const result = recognizer.recognizeForVideo(video, now)
              if (gestureLoadingRef.current) {
                gestureLoadingRef.current = false
                setGestureLoading(false)
              }

              const gestures = result?.gestures || []
              const allLandmarks = result?.landmarks || []

              let triggerHandIndex = -1
              let triggerScore = 0
              const boxes = []

              const effectiveTriggerMin = Math.max(CONFIDENCE_THRESHOLD, triggerMinScore ?? TRIGGER_MIN_SCORE)
              const shouldEvaluateGesture = gestureActionsEnabled && (interval <= 0 || now - lastGestureEvalRef.current >= interval)

              if (shouldEvaluateGesture) {
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
                const box = computeBox(landmarks, isMirrored)
                if (box) {
                  boxes.push({ ...box, index: idx })
                  lastSeenRef.current.set(idx, now)
                }
                if (shouldEvaluateGesture && triggerHandIndex < 0 && isTwoFingerVictory(landmarks)) {
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

              if (shouldEvaluateGesture) {
                lastGestureEvalRef.current = now
                setGestureBoxes(boxes)
                if (triggerHandIndex >= 0) {
                  if (gestureStartRef.current === null) gestureStartRef.current = now
                  lastGestureSeenRef.current = now
                  setActiveGesture("Victory")
                } else if (gestureStartRef.current !== null && now - lastGestureSeenRef.current > GESTURE_GRACE_MS) {
                  gestureStartRef.current = null
                  setActiveGesture(null)
                  setHoldProgress(null)
                }
              }

              if (gestureStartRef.current !== null && !victoryFiredRef.current) {
                const elapsed = now - gestureStartRef.current
                const progress = Math.min(1, elapsed / Math.max(1, holdDurationMs))
                setHoldProgress(progress)

                if (progress >= 1) {
                  victoryFiredRef.current = true
                  gestureStartRef.current = null
                  setActiveGesture(null)
                  setHoldProgress(null)
                  callbacks.onVictory()
                  return
                }
              }
            } catch {
              // Keep previous boxes when detection hiccups
            }
          }
        }

        animFrameRef.current = requestAnimationFrame(detect)
      }

      animFrameRef.current = requestAnimationFrame(detect)
    }

    run()

    return () => {
      stopped = true
      cancelAnimationFrame(animFrameRef.current)
    }
  }, [enabled, videoRef, callbacks, initRecognizer, isMirrored, detectionIntervalMs, triggerMinScore, gestureActionsEnabled, holdDurationMs])

  useEffect(() => {
    return () => {
      recognizerRef.current?.close()
      recognizerRef.current = null
    }
  }, [])

  return { activeGesture, handBoxes, gestureBoxes, holdProgress, gestureLoading, rawGestureNameRef, primaryHandLandmarksRef }
}