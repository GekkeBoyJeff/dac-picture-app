import { sendToDiscord } from "./sendToDiscord"
import { logger } from "@/lib/logger"

const MAX_ATTEMPTS = 10
const BASE_DELAY_MS = 1200
const MAX_DELAY_MS = 15000

/**
 * Calculate backoff delay with jitter.
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
 * Receives store actions as params to stay pure.
 *
 * @param {Blob} blob
 * @param {{ enqueue: (blob: Blob) => Promise<string | null> }} storeActions
 * @returns {Promise<{ success: boolean, queued: boolean }>}
 */
export async function sendOrQueue(blob, storeActions) {
  try {
    const isOffline = typeof navigator !== "undefined" && navigator.onLine === false
    if (!isOffline) {
      const result = await sendToDiscord(blob)
      if (result.ok) return { success: true, queued: false }
    }

    await storeActions.enqueue(blob)
    logger.info("queue", "Photo queued for retry")
    return { success: false, queued: true }
  } catch (err) {
    logger.error("queue", "Failed to send or queue", err)
    return { success: false, queued: false }
  }
}

/**
 * Process the next pending item in the queue.
 * Receives store actions as params to stay pure.
 *
 * @param {{ queue: Array, dequeue: (id: string) => Promise<void>, markAttempt: (id: string) => Promise<void>, getBlob: (id: string) => Promise<Blob | undefined> }} storeActions
 * @returns {Promise<{ processed: boolean, remaining: number, retryAfterMs?: number }>}
 */
export async function processNextInQueue(storeActions) {
  const pending = storeActions.queue.filter((q) => !q.failed)
  if (pending.length === 0) return { processed: false, remaining: 0 }

  const item = pending[0]
  const blob = await storeActions.getBlob(item.id)

  if (!blob) {
    await storeActions.dequeue(item.id)
    return { processed: false, remaining: pending.length - 1 }
  }

  const result = await sendToDiscord(blob)

  if (result.ok) {
    await storeActions.dequeue(item.id)
    logger.info("queue", "Queued photo sent successfully", { id: item.id })
    return { processed: true, remaining: pending.length - 1 }
  }

  // Respect Discord rate-limit
  if (result.retryAfterMs) {
    logger.warn("queue", "Rate limited, backing off", {
      id: item.id,
      retryAfterMs: result.retryAfterMs,
    })
    return { processed: false, remaining: pending.length, retryAfterMs: result.retryAfterMs }
  }

  // Mark attempt
  await storeActions.markAttempt(item.id)
  const attempts = (item.attempts || 0) + 1
  const failed = attempts >= MAX_ATTEMPTS

  if (failed) {
    logger.warn("queue", "Photo permanently failed after max attempts", { id: item.id })
  }

  return { processed: false, remaining: pending.length }
}