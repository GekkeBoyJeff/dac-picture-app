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

export const useSendQueueStore = create((set, get) => ({
  queue: [],

  loadQueue: async () => {
    try {
      const index = await getQueueIndex()
      set({ queue: index })
    } catch (error) {
      logger.error("queue", "Failed to load queue", error)
    }
  },

  /**
   * Add a blob to the send queue.
   * @param {Blob} blob
   * @returns {Promise<string | null>}
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
   * Remove an item from the queue after successful send.
   * @param {string} id
   */
  dequeue: async (id) => {
    try {
      await dequeueBlob(id)
      set((state) => ({
        queue: state.queue.filter((q) => q.id !== id),
      }))
    } catch (error) {
      logger.error("queue", "Failed to dequeue", error)
    }
  },

  /**
   * Mark an attempt on a queue item, flagging as failed after MAX_ATTEMPTS.
   * @param {string} id
   */
  markAttempt: async (id) => {
    try {
      const item = get().queue.find((q) => q.id === id)
      if (!item) return

      const attempts = item.attempts + 1
      const failed = attempts >= MAX_ATTEMPTS
      const updates = { attempts, failed, lastAttempt: Date.now() }
      await updateQueueItem(id, updates)

      set((state) => ({
        queue: state.queue.map((q) => (q.id === id ? { ...q, ...updates } : q)),
      }))
    } catch (error) {
      logger.error("queue", "Failed to mark attempt", error)
    }
  },

  /**
   * Get the blob for a queue item.
   * @param {string} id
   * @returns {Promise<Blob | undefined>}
   */
  getBlob: async (id) => {
    return getQueuedBlob(id)
  },
}))

// -- Selectors --

export const selectPendingCount = (state) => state.queue.filter((q) => !q.failed).length

export const selectFailedCount = (state) => state.queue.filter((q) => q.failed).length

export const selectQueue = (state) => state.queue