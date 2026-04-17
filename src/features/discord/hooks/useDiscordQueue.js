import { useEffect, useState, useCallback } from "react"
import { processNextInQueue, sendOrQueue } from "@/features/discord/lib/sendQueue"
import { useSendQueueStore } from "@/features/discord/store"
import { useGalleryStore } from "@/features/gallery/store"
import { createUploadEntry } from "@/components/ui/UploadStatus"
import { trackEvent } from "@/features/analytics/lib/analytics"
import { logger } from "@/lib/logger"

/**
 * Updates the status of a specific upload entry immutably.
 *
 * @param {string} id
 * @param {string} status
 * @returns {(prev: Array) => Array}
 */
function updateEntryStatus(id, status) {
  return (prev) => prev.map((e) => (e.id === id ? { ...e, status } : e))
}

/**
 * Manages Discord send queue: drain loop + send-and-track for new photos.
 *
 * - Adds captured photos to the gallery
 * - Sends to Discord (or enqueues for retry)
 * - Tracks upload status per entry
 * - Drains the queue on mount and on window.online events
 * - Respects retryAfterMs from rate-limited responses
 *
 * @returns {{
 *   uploadEntries: Array<{ id: string, status: string }>,
 *   dismissEntry: (id: string) => void,
 *   sendAndTrack: (blob: Blob, opts?: { isStrip?: boolean }) => Promise<void>,
 * }}
 */
export function useDiscordQueue() {
  const loadQueue = useSendQueueStore((s) => s.loadQueue)
  const addPhoto = useGalleryStore((s) => s.addPhoto)

  const [uploadEntries, setUploadEntries] = useState([])

  const dismissEntry = useCallback((id) => {
    setUploadEntries((prev) => prev.filter((e) => e.id !== id))
  }, [])

  const sendAndTrack = useCallback(
    async (blob, { isStrip = false } = {}) => {
      await addPhoto(blob)

      const entry = createUploadEntry()
      setUploadEntries((prev) => [...prev, entry])

      const update = (status) => setUploadEntries(updateEntryStatus(entry.id, status))

      const storeActions = useSendQueueStore.getState()
      let result
      try {
        result = await sendOrQueue(blob, storeActions)
      } catch {
        update("error")
        trackEvent("discord_failed", { isStrip })
        return
      }

      if (result.success) {
        update("success")
        trackEvent("discord_sent", { isStrip })
      } else if (result.queued) {
        update("queued")
        trackEvent("discord_queued", { isStrip })
      } else {
        update("error")
        trackEvent("discord_failed", { isStrip })
      }

      logger.info("capture", "Photo captured", {
        sent: result.success,
        queued: result.queued,
        isStrip,
      })
    },
    [addPhoto],
  )

  // Drain queue on mount and when coming back online
  useEffect(() => {
    let cancelled = false

    async function drain() {
      while (!cancelled) {
        const storeActions = useSendQueueStore.getState()
        const result = await processNextInQueue(storeActions)
        await loadQueue()

        if (result.retryAfterMs) {
          await new Promise((r) => setTimeout(r, result.retryAfterMs))
          continue
        }

        if (!result.processed || result.remaining === 0) break
      }
    }

    drain()

    const handleOnline = () => drain()
    window.addEventListener("online", handleOnline)
    return () => {
      cancelled = true
      window.removeEventListener("online", handleOnline)
    }
  }, [loadQueue])

  return { uploadEntries, dismissEntry, sendAndTrack }
}