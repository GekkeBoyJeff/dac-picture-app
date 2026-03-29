"use client"

import { useSyncExternalStore } from "react"

export function useOnlineStatus() {
  const isOnline = useSyncExternalStore(
    (callback) => {
      window.addEventListener("online", callback)
      window.addEventListener("offline", callback)
      return () => {
        window.removeEventListener("online", callback)
        window.removeEventListener("offline", callback)
      }
    },
    () => navigator.onLine,
    () => true,
  )

  return isOnline
}
