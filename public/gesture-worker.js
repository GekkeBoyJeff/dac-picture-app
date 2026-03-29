// Web Worker for MediaPipe GestureRecognizer inference.
// Keeps the heavy recognizeForVideo() call off the main thread.

// MediaPipe's bundler compiled import(url) into self.import(url), which doesn't
// exist in module workers. The WASM loader scripts need to run in global scope
// (like importScripts) to set self.ModuleFactory, so we use fetch + eval.
self.import = async (url) => {
  const res = await fetch(url)
  const text = await res.text()
  ;(0, eval)(text)
}

let recognizer = null

async function initRecognizer(opts = {}) {
  const { GestureRecognizer, FilesetResolver } = await import(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.33/vision_bundle.mjs"
  )
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
    numHands: opts.numHands ?? 6,
    minHandDetectionConfidence: opts.minHandDetectionConfidence ?? 0.5,
    minHandPresenceConfidence: opts.minHandPresenceConfidence ?? 0.5,
    minTrackingConfidence: opts.minTrackingConfidence ?? 0.5,
  }

  try {
    recognizer = await GestureRecognizer.createFromOptions(vision, modelOptions)
    self.postMessage({ type: "ready", delegate: "GPU" })
  } catch {
    try {
      recognizer = await GestureRecognizer.createFromOptions(vision, {
        ...modelOptions,
        baseOptions: { ...modelOptions.baseOptions, delegate: "CPU" },
      })
      self.postMessage({ type: "ready", delegate: "CPU" })
    } catch (err) {
      self.postMessage({ type: "error", message: err?.message || "Failed to init" })
    }
  }
}

self.addEventListener("message", async (e) => {
  const { type } = e.data

  if (type === "init") {
    try {
      await initRecognizer(e.data)
    } catch (err) {
      self.postMessage({ type: "error", message: err?.message || "Init crashed" })
    }
    return
  }

  if (type === "detect") {
    const { bitmap, timestamp } = e.data
    if (!recognizer) {
      bitmap.close()
      self.postMessage({ type: "result", gestures: [], landmarks: [], timestamp })
      return
    }
    try {
      const result = recognizer.recognizeForVideo(bitmap, timestamp)
      const gestures = (result?.gestures || []).map((hand) =>
        hand.map((g) => ({ categoryName: g.categoryName, score: g.score })),
      )
      const landmarks = (result?.landmarks || []).map((hand) =>
        hand.map((p) => ({ x: p.x, y: p.y, z: p.z })),
      )
      self.postMessage({ type: "result", gestures, landmarks, timestamp })
    } catch {
      // Skip failed frames
    } finally {
      bitmap.close()
    }
    return
  }

  if (type === "setOptions") {
    if (recognizer) {
      try {
        recognizer.setOptions(e.data.options)
      } catch {
        // Unsupported option — silently ignore
      }
    }
    return
  }

  if (type === "close") {
    recognizer?.close()
    recognizer = null
    self.close()
  }
})
