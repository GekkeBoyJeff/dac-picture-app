"use client"

import { useEffect } from "react"
import { assetPath } from "@/lib/config/basePath"

export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      const swPath = assetPath("/sw.js")
      navigator.serviceWorker.register(swPath).catch(() => {})
    }
  }, [])

  return null
}