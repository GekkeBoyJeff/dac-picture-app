/**
 * Device capability detection and recommended settings.
 *
 * Detects ARM / low-power devices (e.g. Raspberry Pi) and exposes
 * tuned defaults for camera resolution and canvas pixel budgets
 * so the app stays smooth on constrained hardware.
 */

let cachedResult = null

/**
 * Heuristic check for ARM / low-memory / low-core devices.
 * Enhanced: also checks WebGL renderer for Pi GPU (V3D).
 * Runs once per session and caches the result.
 * @returns {boolean}
 */
export function isLowPowerDevice() {
  if (cachedResult !== null) return cachedResult
  if (typeof navigator === "undefined") return false

  const ua = navigator.userAgent.toLowerCase()

  // Check UA for ARM / AArch64
  const isARM =
    /armv?\d|aarch/i.test(ua) || (navigator.platform && /arm|aarch/i.test(navigator.platform))

  // Check WebGL renderer for Raspberry Pi GPU
  let isV3DGpu = false
  try {
    const canvas = document.createElement("canvas")
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl")
    if (gl) {
      const debugExt = gl.getExtension("WEBGL_debug_renderer_info")
      if (debugExt) {
        const renderer = gl.getParameter(debugExt.UNMASKED_RENDERER_WEBGL) || ""
        isV3DGpu = /v3d/i.test(renderer)
      }
    }
  } catch {
    // WebGL detection not available
  }

  // Check memory and cores
  const lowMemory = typeof navigator.deviceMemory === "number" && navigator.deviceMemory <= 2
  const lowCores =
    typeof navigator.hardwareConcurrency === "number" && navigator.hardwareConcurrency <= 4

  cachedResult = isARM || isV3DGpu || (lowMemory && lowCores)
  return cachedResult
}

// -- Camera resolution presets --

/**
 * Returns ideal camera constraints for the given context.
 * Strategy: request `ideal` so the browser negotiates the highest
 * resolution the camera supports. Low-power devices use smaller ideals
 * to avoid GPU down-scaling of 4K feeds.
 *
 * @param {"single" | "strip"} mode
 * @param {boolean} isPortrait
 * @param {boolean} lowPower
 * @returns {{ width: { ideal: number }, height: { ideal: number } }}
 */
export function getCameraIdeal(mode, isPortrait, lowPower) {
  if (mode === "strip") {
    const long = lowPower ? 1280 : 1920
    const short = lowPower ? 720 : 1080
    return {
      width: { ideal: isPortrait ? short : long },
      height: { ideal: isPortrait ? long : short },
    }
  }

  // Single photo — go as high as the device can handle
  if (lowPower) {
    const long = 1920
    const short = 1080
    return {
      width: { ideal: isPortrait ? short : long },
      height: { ideal: isPortrait ? long : short },
    }
  }

  // Full-power device — let the camera deliver its maximum
  return {
    width: { ideal: 4096 },
    height: { ideal: 4096 },
  }
}

// -- Canvas pixel budget --

/**
 * Maximum pixel budget for the compositing canvas.
 * @param {"single" | "strip"} mode
 * @param {boolean} lowPower
 * @returns {number}
 */
export function getMaxCanvasPixels(mode, lowPower) {
  if (mode === "strip") {
    return lowPower ? 1280 * 720 : 1920 * 1080
  }

  return lowPower ? 1920 * 1080 : 2560 * 1440
}