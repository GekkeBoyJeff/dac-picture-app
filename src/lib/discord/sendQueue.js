import { sendToDiscord } from "./sendToDiscord"
import {
  enqueueBlob,
  getQueuedBlob,
  dequeueBlob,
  getQueueIndex,
  updateQueueItem,
} from "@/lib/storage/indexedDb"
import { logger } from "@/lib/logger"

const MAX_ATTEMPTS = 10
const BASE_DELAY_MS = 1200
const MAX_DELAY_MS = 15000

/**
 * Calculate backoff delay with jitter
 * @param {number} attempts
 * @returns {number} delay in ms
 */
export function getBackoffDelay(attempts) {
  const delay = Math.min(BASE_DELAY_MS + attempts * BASE_DELAY_MS, MAX_DELAY_MS)
  const jitter = Math.random() * BASE_DELAY_MS * 0.5
  return delay + jitter
}

/**
 * Try to send a photo immediately. If it fails, enqueue for retry.
 * @param {Blob} blob
 * @returns {Promise<{success: boolean, queued: boolean}>}
 */
export async function sendOrQueue(blob) {
  try {
    // Skip immediate send if offline
    const isOffline = typeof navigator !== "undefined" && navigator.onLine === false
    if (!isOffline) {
      const result = await sendToDiscord(blob)
      if (result.ok) return { success: true, queued: false }
    }

    // Enqueue for retry
    const id = `send-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    await enqueueBlob(id, blob)
    logger.info("queue", "Photo queued for retry", { id })
    return { success: false, queued: true }
  } catch (err) {
    logger.error("queue", "Failed to send or queue", err)
    return { success: false, queued: false }
  }
}

/**
 * Process the next item in the queue.
 * @returns {Promise<{processed: boolean, remaining: number}>}
 */
export async function processNextInQueue() {
  const index = await getQueueIndex()
  const pending = index.filter((q) => !q.failed)
  if (pending.length === 0) return { processed: false, remaining: 0 }

  const item = pending[0]
  const blob = await getQueuedBlob(item.id)
  if (!blob) {
    await dequeueBlob(item.id)
    return { processed: false, remaining: pending.length - 1 }
  }

  const result = await sendToDiscord(blob)

  if (result.ok) {
    await dequeueBlob(item.id)
    logger.info("queue", "Queued photo sent successfully", { id: item.id })
    return { processed: true, remaining: pending.length - 1 }
  }

  // Respect Discord rate-limit — bubble up so the caller waits
  if (result.retryAfterMs) {
    logger.warn("queue", "Rate limited, backing off", { id: item.id, retryAfterMs: result.retryAfterMs })
    return { processed: false, remaining: pending.length, retryAfterMs: result.retryAfterMs }
  }

  // Mark attempt
  const attempts = (item.attempts || 0) + 1
  const failed = attempts >= MAX_ATTEMPTS
  await updateQueueItem(item.id, { attempts, failed, lastAttempt: Date.now() })

  if (failed) {
    logger.warn("queue", "Photo permanently failed after max attempts", { id: item.id })
  }

  return { processed: false, remaining: pending.length }
}