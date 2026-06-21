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
let vision = null
// Remember the resolved base + options so we can re-create the recognizer
// (e.g. on a numHands change) without re-fetching the WASM fileset.
let basePath = ""
let currentOptions = {}
let currentDelegate = null

function modelUrl() {
  return `${basePath}/mediapipe/gesture_recognizer.task`
}

async function loadVision() {
  if (vision) return vision
  const { GestureRecognizer, FilesetResolver } = await import(
    `${basePath}/mediapipe/vision_bundle.mjs`
  )
  vision = await FilesetResolver.forVisionTasks(`${basePath}/mediapipe/wasm`)
  self.__GestureRecognizer = GestureRecognizer
  return vision
}

async function createRecognizer(opts) {
  // loadVision() must run FIRST — it imports the bundle and assigns
  // self.__GestureRecognizer. Reading it before awaiting loadVision() captures
  // `undefined` on the first init and throws "...reading 'createFromOptions'".
  const v = await loadVision()
  const GestureRecognizer = self.__GestureRecognizer

  const baseModelOptions = {
    baseOptions: { modelAssetPath: modelUrl(), delegate: "GPU" },
    runningMode: "VIDEO",
    numHands: opts.numHands ?? 6,
    minHandDetectionConfidence: opts.minHandDetectionConfidence ?? 0.5,
    minHandPresenceConfidence: opts.minHandPresenceConfidence ?? 0.5,
    minTrackingConfidence: opts.minTrackingConfidence ?? 0.5,
  }

  try {
    const r = await GestureRecognizer.createFromOptions(v, baseModelOptions)
    currentDelegate = "GPU"
    return r
  } catch (gpuErr) {
    const r = await GestureRecognizer.createFromOptions(v, {
      ...baseModelOptions,
      baseOptions: { ...baseModelOptions.baseOptions, delegate: "CPU" },
    })
    currentDelegate = "CPU"
    return r
  }
}

async function initRecognizer(opts = {}) {
  basePath = opts.basePath ?? ""
  currentOptions = {
    numHands: opts.numHands ?? 6,
    minHandDetectionConfidence: opts.minHandDetectionConfidence ?? 0.5,
    minHandPresenceConfidence: opts.minHandPresenceConfidence ?? 0.5,
    minTrackingConfidence: opts.minTrackingConfidence ?? 0.5,
  }
  recognizer = await createRecognizer(currentOptions)
  self.postMessage({
    type: "ready",
    delegate: currentDelegate,
    numHands: currentOptions.numHands,
    modelUrl: modelUrl(),
  })
}

self.addEventListener("message", async (e) => {
  const { type } = e.data

  if (type === "init") {
    try {
      await initRecognizer(e.data)
    } catch (err) {
      self.postMessage({
        type: "error",
        phase: "init",
        message: err?.message || "Init crashed",
      })
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
    if (!recognizer) return
    try {
      recognizer.setOptions(e.data.options)
      Object.assign(currentOptions, e.data.options)
    } catch (err) {
      self.postMessage({
        type: "error",
        phase: "setOptions",
        message: err?.message || "setOptions failed",
      })
    }
    return
  }

  if (type === "reinit") {
    try {
      currentOptions = {
        numHands: e.data.numHands ?? currentOptions.numHands ?? 6,
        minHandDetectionConfidence:
          e.data.minHandDetectionConfidence ?? currentOptions.minHandDetectionConfidence ?? 0.5,
        minHandPresenceConfidence:
          e.data.minHandPresenceConfidence ?? currentOptions.minHandPresenceConfidence ?? 0.5,
        minTrackingConfidence:
          e.data.minTrackingConfidence ?? currentOptions.minTrackingConfidence ?? 0.5,
      }
      const old = recognizer
      recognizer = null
      old?.close()
      recognizer = await createRecognizer(currentOptions)
      self.postMessage({
        type: "ready",
        delegate: currentDelegate,
        numHands: currentOptions.numHands,
        modelUrl: modelUrl(),
      })
    } catch (err) {
      self.postMessage({
        type: "error",
        phase: "reinit",
        message: err?.message || "Re-init failed",
      })
    }
    return
  }

  if (type === "close") {
    recognizer?.close()
    recognizer = null
    self.close()
  }
})
