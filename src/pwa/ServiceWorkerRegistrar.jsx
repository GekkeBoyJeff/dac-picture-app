"use client"

import { useEffect, useState } from "react"
import { assetPath } from "@/lib/config/basePath"
import { logger } from "@/lib/logger"

export function ServiceWorkerRegistrar() {
  const [updateAvailable, setUpdateAvailable] = useState(false)

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return

    const swPath = assetPath("/sw.js")
    navigator.serviceWorker
      .register(swPath)
      .then((reg) => {
        logger.info("sw", "Service worker registered")

        reg.update().catch(() => {})

        const interval = setInterval(() => reg.update().catch(() => {}), 30 * 60 * 1000)

        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing
          if (!newWorker) return

          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              logger.info("sw", "New version available")
              setUpdateAvailable(true)
            }
          })
        })

        return () => clearInterval(interval)
      })
      .catch((err) => {
        logger.warn("sw", "Registration failed", err)
      })
  }, [])

  if (!updateAvailable) return null

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
      <button
        onClick={() => window.location.reload()}
        className="flex items-center gap-3 px-5 py-3 rounded-none bg-[#e6c189] text-black text-sm font-bold cursor-pointer hover:bg-[#d4af72] transition-colors active:scale-95"
      >
        <span>Nieuwe versie beschikbaar</span>
        <span className="text-black/60 font-mono">Tik om te updaten</span>
      </button>
    </div>
  )
}
