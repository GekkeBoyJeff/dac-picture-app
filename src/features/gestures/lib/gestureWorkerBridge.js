import { BASE_PATH } from "@/lib/config/basePath"
import { logger } from "@/lib/logger"

/**
 * Spawn a gesture-recognition Web Worker.
 *
 * @param {object} config  Initial recognizer options forwarded to the worker.
 * @returns {Worker}
 */
export function createGestureWorker(config = {}) {
  const worker = new Worker(`${BASE_PATH}/gesture-worker.js`, { type: "module" })

  worker.postMessage({
    type: "init",
    numHands: config.numHands ?? 6,
    minHandDetectionConfidence: config.minHandDetectionConfidence ?? 0.5,
    minHandPresenceConfidence: config.minHandPresenceConfidence ?? 0.5,
    minTrackingConfidence: config.minTrackingConfidence ?? 0.5,
  })

  logger.info("gesture", "Spawning gesture worker...")
  return worker
}

/**
 * Hot-update recognizer options on a running worker (no model reload).
 *
 * @param {Worker} worker
 * @param {object} options
 */
export function updateWorkerOptions(worker, options) {
  if (!worker) return
  worker.postMessage({ type: "setOptions", options })
}

/**
 * Gracefully shut down a gesture worker.
 *
 * @param {Worker} worker
 */
export function closeWorker(worker) {
  if (!worker) return
  worker.postMessage({ type: "close" })
}