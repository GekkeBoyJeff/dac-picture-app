import { create } from "zustand"
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

function getBackoffDelay(attempts) {
  const delay = Math.min(BASE_DELAY_MS + attempts * BASE_DELAY_MS, MAX_DELAY_MS)
  const jitter = Math.random() * BASE_DELAY_MS * 0.5
  return delay + jitter
}

export const useSendQueueStore = create((set, get) => ({
  queue: [],
  sendingId: null,
  isProcessing: false,

  /**
   * Load queue metadata from IndexedDB
   */
  loadQueue: async () => {
    try {
      const index = await getQueueIndex()
      set({ queue: index })
    } catch (error) {
      logger.error("queue", "Failed to load queue", error)
    }
  },

  /**
   * Add a photo to the send queue
   * @param {Blob} blob
   * @returns {Promise<string>} Queue item ID
   */
  enqueue: async (blob) => {
    const id = `send-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    try {
      await enqueueBlob(id, blob)
      const index = await getQueueIndex()
      set({ queue: index })
      return id
    } catch (error) {
      logger.error("queue", "Failed to enqueue", error)
      return null
    }
  },

  /**
   * Remove an item from the queue after successful send
   * @param {string} id
   */
  dequeue: async (id) => {
    try {
      await dequeueBlob(id)
      set((state) => ({
        queue: state.queue.filter((q) => q.id !== id),
        sendingId: state.sendingId === id ? null : state.sendingId,
      }))
    } catch (error) {
      logger.error("queue", "Failed to dequeue", error)
    }
  },

  /**
   * Mark an attempt on a queue item
   * @param {string} id
   */
  markAttempt: async (id) => {
    try {
      const item = get().queue.find((q) => q.id === id)
      if (!item) return

      const attempts = item.attempts + 1
      const failed = attempts >= MAX_ATTEMPTS
      await updateQueueItem(id, { attempts, failed, lastAttempt: Date.now() })

      set((state) => ({
        queue: state.queue.map((q) =>
          q.id === id ? { ...q, attempts, failed, lastAttempt: Date.now() } : q,
        ),
      }))
    } catch (error) {
      logger.error("queue", "Failed to mark attempt", error)
    }
  },

  /** Number of items pending send */
  get pendingCount() {
    return get().queue.filter((q) => !q.failed).length
  },

  /** Number of permanently failed items */
  get failedCount() {
    return get().queue.filter((q) => q.failed).length
  },

  /**
   * Get the blob for a queue item
   * @param {string} id
   * @returns {Promise<Blob|undefined>}
   */
  getBlob: async (id) => {
    return getQueuedBlob(id)
  },

  /** Get delay for next retry based on attempts */
  getRetryDelay: (attempts) => getBackoffDelay(attempts),
}))