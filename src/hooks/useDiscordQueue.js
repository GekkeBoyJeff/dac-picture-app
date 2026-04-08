import { useEffect, useState, useCallback } from "react"
import { processNextInQueue, sendOrQueue } from "@/lib/discord/sendQueue"
import { useSendQueueStore } from "@/stores/sendQueueStore"
import { useGalleryStore } from "@/stores/galleryStore"
import { createUploadEntry } from "@/components/ui/UploadStatus"
import { trackEvent } from "@/lib/storage/analytics"
import { logger } from "@/lib/logger"

/**
 * Manages Discord send queue: drain loop + send-and-track for new photos.
 *
 * @returns {{
 *   uploadEntries: Array,
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

      const update = (status) =>
        setUploadEntries((prev) => prev.map((e) => (e.id === entry.id ? { ...e, status } : e)))

      let result
      try {
        result = await sendOrQueue(blob)
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
        const result = await processNextInQueue()
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
