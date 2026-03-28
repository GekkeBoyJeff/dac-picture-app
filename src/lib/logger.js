/**
 * Structured logger with tag-based filtering.
 * Replaces raw console.log usage and MediaPipe console suppression hacks.
 *
 * Usage:
 *   import { logger } from "@/lib/logger"
 *   logger.info("camera", "Stream started", { deviceId })
 *   logger.debug("gesture", "Frame processed", { fps })
 */

const isDev = process.env.NODE_ENV !== "production"

/** Tags to suppress even in dev (e.g. noisy MediaPipe internals) */
const SUPPRESSED_TAGS = new Set(["tflite", "mediapipe-internal"])

function shouldLog(tag) {
  return !SUPPRESSED_TAGS.has(tag)
}

function formatTag(tag) {
  return `[${tag}]`
}

export const logger = {
  /** Only logs in development, respects suppressed tags */
  debug(tag, ...args) {
    if (isDev && shouldLog(tag)) {
      console.debug(formatTag(tag), ...args)
    }
  },

  /** Always logs, respects suppressed tags */
  info(tag, ...args) {
    if (shouldLog(tag)) {
      console.info(formatTag(tag), ...args)
    }
  },

  /** Always logs */
  warn(tag, ...args) {
    console.warn(formatTag(tag), ...args)
  },

  /** Always logs */
  error(tag, ...args) {
    console.error(formatTag(tag), ...args)
  },
}