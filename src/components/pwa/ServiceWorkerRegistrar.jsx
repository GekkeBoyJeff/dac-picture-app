"use client"

import { useEffect } from "react"
import { assetPath } from "@/lib/config/basePath"
import { logger } from "@/lib/logger"

export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return

    const swPath = assetPath("/sw.js")
    navigator.serviceWorker
      .register(swPath)
      .then((reg) => {
        logger.info("sw", "Service worker registered")

        // Check for updates periodically
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing
          if (!newWorker) return

          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "activated" && navigator.serviceWorker.controller) {
              logger.info("sw", "New version available")
            }
          })
        })
      })
      .catch((err) => {
        logger.warn("sw", "Registration failed", err)
      })
  }, [])

  return null
}