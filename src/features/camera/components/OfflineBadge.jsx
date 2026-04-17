"use client"

import { useOnlineStatus } from "@/hooks/useOnlineStatus"
import { useSendQueueStore } from "@/features/discord/store"

const SLOW_QUEUE_THRESHOLD = 5

/**
 * Small badge in top-left when offline or queue is slow.
 * Pi-safe: no backdrop-blur.
 */
export function OfflineBadge() {
  const isOnline = useOnlineStatus()
  const queueLength = useSendQueueStore((s) => s.queue.filter((q) => !q.failed).length)

  const isOffline = !isOnline
  const isSlow = isOnline && queueLength >= SLOW_QUEUE_THRESHOLD

  if (!isOffline && !isSlow) return null

  return (
    <div className="absolute top-4 left-4 z-30 flex items-center gap-2 px-3 py-1.5 rounded-none border border-white/20 bg-black">
      <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
      <span className="text-white text-xs font-mono">
        {isOffline ? "Geen internet" : `Sloom internet (${queueLength} in wachtrij)`}
      </span>
    </div>
  )
}
