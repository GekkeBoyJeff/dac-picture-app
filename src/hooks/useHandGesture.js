"use client"

import { useEffect, useRef, useCallback, useState } from "react"
import { GestureRecognizer, FilesetResolver } from "@mediapipe/tasks-vision"

// Default 0ms = every animation frame for snappy box drawing.
const DEFAULT_DETECTION_INTERVAL_MS = 0
const MIN_INTERVAL_MS = 0
const MAX_INTERVAL_MS = 1200
// Slightly lower threshold to improve detection on low-light webcams.
const CONFIDENCE_THRESHOLD = 0.001
// Require a stronger score to actually trigger an action.
const TRIGGER_MIN_SCORE = 0.35
const TRIGGER_GESTURES = new Set(["Victory", "ILoveYou", "Deuces"])
// Hold last seen boxes briefly when detection drops to reduce flicker
const BOX_HOLD_MS = 700
const MIN_DRAW_INTERVAL_MS = 33

const clampInterval = (value) => Math.min(MAX_INTERVAL_MS, Math.max(MIN_INTERVAL_MS, value ?? DEFAULT_DETECTION_INTERVAL_MS))

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

  const clampedMinX = Math.max(0, xMin)
  const clampedMaxX = Math.min(1, xMax)
  const clampedMinY = Math.max(0, yMin)
  const clampedMaxY = Math.min(1, yMax)

  return {
    x: clampedMinX,
    y: clampedMinY,
    width: Math.max(0, clampedMaxX - clampedMinX),
    height: Math.max(0, clampedMaxY - clampedMinY),
  }
}

const isTwoFingerVictory = (landmarks) => {
  if (!landmarks?.length) return false
  const wrist = landmarks[0]
  const distance = (a, b) => {
    const dx = a.x - b.x
    const dy = a.y - b.y
    const dz = (a.z || 0) - (b.z || 0)
    return Math.hypot(dx, dy, dz)
  }
  const isExtended = (pipIdx, tipIdx) => {
    const pip = landmarks[pipIdx]
    const tip = landmarks[tipIdx]
    const tipLen = distance(tip, wrist)
    const pipLen = distance(pip, wrist)
    return tipLen - pipLen > 0.1
  }
  const indexUp = isExtended(5, 8)
  const middleUp = isExtended(9, 12)
  const ringUp = isExtended(13, 16)
  const pinkyUp = isExtended(17, 20)
  return indexUp && middleUp && !ringUp && !pinkyUp
}

export function useHandGesture(
  videoRef,
  enabled,
  callbacks,
  isMirrored = false,
  detectionIntervalMs = DEFAULT_DETECTION_INTERVAL_MS,
  triggerMinScore = TRIGGER_MIN_SCORE,
  gestureActionsEnabled = true,
  holdDurationMs = 1500
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
  const victoryFiredRef = useRef(false)
  const [holdProgress, setHoldProgress] = useState(null)

  // Reset so a new countdown can be triggered after the previous one completes
  useEffect(() => {
    victoryFiredRef.current = false
    gestureStartRef.current = null
    lastSeenRef.current = new Map()
    setActiveGesture(null)
    setHoldProgress(null)
    setHandBoxes([])
    setGestureBoxes([])
  }, [enabled])

  const initRecognizer = useCallback(async () => {
    if (recognizerRef.current) return

    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
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

    // MediaPipe WASM logs "INFO: Created TensorFlow Lite XNNPACK delegate"
    // via stderr which Next.js dev overlay catches as an error. Suppress it.
    const origError = console.error
    const origWarn = console.warn
    console.error = (...args) => {
      if (typeof args[0] === "string" && args[0].includes("TensorFlow Lite")) return
      origError(...args)
    }
    console.warn = (...args) => {
      if (typeof args[0] === "string" && args[0].includes("TensorFlow Lite")) return
      origWarn(...args)
    }

    try {
      recognizerRef.current = await GestureRecognizer.createFromOptions(vision, modelOptions)
    } catch {
      // GPU delegate failed (e.g. external webcam codec issue) — fall back to CPU
      recognizerRef.current = await GestureRecognizer.createFromOptions(vision, {
        ...modelOptions,
        baseOptions: { ...modelOptions.baseOptions, delegate: "CPU" },
      })
    } finally {
      console.error = origError
      console.warn = origWarn
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

        if (
          video &&
          recognizer &&
          video.readyState >= 2 &&
          video.videoWidth > 0
        ) {
          const now = performance.now()
          if (now > lastTimestampRef.current) {
            lastTimestampRef.current = now
            try {
              // MediaPipe spams console with non-actionable warnings per frame
              const origError = console.error
              const origWarn = console.warn
              console.error = () => {}
              console.warn = () => {}
              let result
              try {
                result = recognizer.recognizeForVideo(video, now)
              } finally {
                console.error = origError
                console.warn = origWarn
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
                    if (
                      TRIGGER_GESTURES.has(g.categoryName) &&
                      g.score >= effectiveTriggerMin &&
                      g.score > triggerScore
                    ) {
                      triggerScore = g.score
                      triggerHandIndex = idx
                    }
                  })
                })
              }

              allLandmarks.forEach((landmarks, idx) => {
                if (!landmarks || landmarks.length === 0) return

                const box = computeBox(landmarks, isMirrored)
                if (box) {
                  boxes.push({ ...box, index: idx })
                  lastSeenRef.current.set(idx, now)
                }

                if (shouldEvaluateGesture && triggerHandIndex < 0) {
                  if (isTwoFingerVictory(landmarks)) {
                    triggerHandIndex = idx
                  }
                }
              })

              if (boxes.length === 0 && prevBoxesRef.current.length > 0) {
                const held = prevBoxesRef.current.filter((prev) => {
                  const seenAt = lastSeenRef.current.get(prev.index) || 0
                  return now - seenAt < BOX_HOLD_MS
                })

                if (held.length > 0) {
                  boxes.push(...held)
                }
              }

              const sameLength = boxes.length === prevBoxesRef.current.length
              const unchanged =
                sameLength &&
                boxes.every((b, idx) => {
                  const p = prevBoxesRef.current[idx]
                  if (!p) return false
                  return (
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

              if (shouldEvaluateGesture) {
                lastGestureEvalRef.current = now
                setGestureBoxes(boxes)
                if (triggerHandIndex >= 0) {
                  if (gestureStartRef.current === null) {
                    gestureStartRef.current = now
                  }
                  const elapsed = now - gestureStartRef.current
                  const progress = Math.min(1, elapsed / Math.max(1, holdDurationMs))
                  setActiveGesture("Victory")
                  setHoldProgress(progress)

                  if (progress >= 1 && !victoryFiredRef.current) {
                    victoryFiredRef.current = true
                    setActiveGesture(null)
                    setHoldProgress(null)
                    callbacks.onVictory()
                    return
                  }
                } else {
                  gestureStartRef.current = null
                  setActiveGesture(null)
                  setHoldProgress(null)
                }
              }
            } catch {
              // Keep previous boxes when detection hiccups to avoid flicker
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
  return { activeGesture, handBoxes, gestureBoxes, holdProgress }
}