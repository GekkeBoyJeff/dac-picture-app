/**
 * Structured logger with tag-based filtering.
 *
 * Usage:
 *   import { logger } from "@/lib/logger"
 *   logger.info("camera", "Stream started", { deviceId })
 */

const IS_DEV = process.env.NODE_ENV !== "production"

// Tags to suppress even in dev (e.g. noisy MediaPipe internals)
const SUPPRESSED_TAGS = new Set(["tflite", "mediapipe-internal"])

function shouldLog(tag) {
  return !SUPPRESSED_TAGS.has(tag)
}

function formatTag(tag) {
  return `[${tag}]`
}

export const logger = {
  debug(tag, ...args) {
    if (IS_DEV && shouldLog(tag)) {
      console.debug(formatTag(tag), ...args)
    }
  },

  info(tag, ...args) {
    if (shouldLog(tag)) {
      console.info(formatTag(tag), ...args)
    }
  },

  warn(tag, ...args) {
    console.warn(formatTag(tag), ...args)
  },

  error(tag, ...args) {
    console.error(formatTag(tag), ...args)
  },
}