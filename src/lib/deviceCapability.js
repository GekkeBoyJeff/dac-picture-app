/**
 * Device capability detection and recommended settings.
 *
 * Detects ARM / low-power devices (e.g. Raspberry Pi) and exposes
 * tuned defaults for camera resolution, canvas caps, and gesture
 * detection so the app stays smooth on constrained hardware.
 */

// Cached after first probe
let _isLowPower = null

/**
 * Heuristic check for ARM / low-memory / low-core devices.
 * Runs once per session and caches the result.
 */
export function isLowPowerDevice() {
  if (_isLowPower !== null) return _isLowPower
  if (typeof navigator === "undefined") return false

  const ua = navigator.userAgent.toLowerCase()
  const isARM =
    /armv?\d|aarch/i.test(ua) ||
    // Chromium on RPi typically includes "Linux armv" or "aarch64"
    (navigator.platform && /arm|aarch/i.test(navigator.platform))

  const lowMemory =
    typeof navigator.deviceMemory === "number" && navigator.deviceMemory <= 2

  const lowCores =
    typeof navigator.hardwareConcurrency === "number" &&
    navigator.hardwareConcurrency <= 4

  _isLowPower = isARM || (lowMemory && lowCores)
  return _isLowPower
}

// ---------------------------------------------------------------------------
// Camera resolution presets
// ---------------------------------------------------------------------------

/**
 * Returns ideal camera constraints for the given context.
 *
 * Strategy: always request `ideal` so the browser negotiates the highest
 * resolution the camera actually supports. On low-power devices we set a
 * lower ideal to avoid the GPU having to down-scale a 4K feed.
 *
 * @param {"single" | "strip"} mode
 * @param {boolean} isPortrait
 * @param {boolean} [lowPower] — override; falls back to hardware detection
 */
export function getCameraIdeal(mode, isPortrait, lowPower) {
  if (lowPower === undefined) lowPower = isLowPowerDevice()

  // Strip photos are composited into small cells (1000×460), so we don't
  // need ultra-high source frames — 1080p is more than enough.
  if (mode === "strip") {
    const long = lowPower ? 1280 : 1920
    const short = lowPower ? 720 : 1080
    return {
      width: { ideal: isPortrait ? short : long },
      height: { ideal: isPortrait ? long : short },
    }
  }

  // Single photo — go as high as the device can handle.
  if (lowPower) {
    const long = 1920
    const short = 1080
    return {
      width: { ideal: isPortrait ? short : long },
      height: { ideal: isPortrait ? long : short },
    }
  }

  // Full-power device — let the camera deliver its maximum.
  return {
    width: { ideal: 4096 },
    height: { ideal: 4096 },
  }
}

// ---------------------------------------------------------------------------
// Canvas pixel budget
// ---------------------------------------------------------------------------

/**
 * Maximum pixel budget for the compositing canvas.
 *
 * @param {"single" | "strip"} mode
 * @param {boolean} [lowPower] — override; falls back to hardware detection
 */
export function getMaxCanvasPixels(mode, lowPower) {
  if (lowPower === undefined) lowPower = isLowPowerDevice()

  if (mode === "strip") {
    // Strip source frames are small — keep the budget tight.
    return lowPower ? 1280 * 720 : 1920 * 1080
  }

  // Single photo
  return lowPower ? 1920 * 1080 : 2560 * 1440
}

// ---------------------------------------------------------------------------
// Gesture detection
// ---------------------------------------------------------------------------

/**
 * Recommended detection interval (ms) for the gesture loop.
 *
 * @param {boolean} [lowPower] — override; falls back to hardware detection
 */
export function getGestureDefaults(lowPower) {
  if (lowPower === undefined) lowPower = isLowPowerDevice()
  return {
    detectionIntervalMs: lowPower ? 250 : 120,
    numHands: lowPower ? 2 : 6,
  }
}
