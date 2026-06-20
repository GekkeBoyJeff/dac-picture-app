"use client"

import { useOnlineStatus } from "@/hooks/useOnlineStatus"
import { useSendQueueStore } from "@/stores/sendQueueStore"

const SLOW_QUEUE_THRESHOLD = 5

export function OfflineBadge() {
  const isOnline = useOnlineStatus()
  const queueLength = useSendQueueStore((s) => s.queue.filter((q) => !q.failed).length)

  const isOffline = !isOnline
  const isSlow = isOnline && queueLength >= SLOW_QUEUE_THRESHOLD

  if (!isOffline && !isSlow) return null

  return (
    <div
      className={`absolute left-4 top-4 z-30 flex items-center gap-2 rounded-full border px-3.5 py-2 backdrop-blur-md ${
        isOffline ? "border-danger/40 bg-danger/15" : "border-warning/40 bg-warning/15"
      }`}
    >
      <span
        className={`h-2.5 w-2.5 rounded-full ${isOffline ? "bg-danger" : "bg-warning"} animate-pulse`}
      />
      <span className="text-xs font-medium text-ink">
        {isOffline ? "Geen internet" : `Traag internet (${queueLength} in wachtrij)`}
      </span>
    </div>
  )
}