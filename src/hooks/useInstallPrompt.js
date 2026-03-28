"use client"

import { useState, useEffect, useCallback } from "react"
import { STORAGE_KEYS, readStorage, writeStorage } from "@/lib/storage/localStorage"

function isStandalone() {
  if (typeof window === "undefined") return false
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in window.navigator && window.navigator.standalone)
  )
}

function isIOSDevice() {
  if (typeof navigator === "undefined") return false
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.userAgent.includes("Mac") && "ontouchend" in document)
  )
}

function wasDismissed() {
  try {
    const dismissed = readStorage(STORAGE_KEYS.INSTALL_PROMPT_DISMISSED_AT)
    if (!dismissed) return false
    return Date.now() - Number(dismissed) < 7 * 24 * 60 * 60 * 1000
  } catch {
    return false
  }
}

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  // Start false on both server and client to avoid hydration mismatch
  const [showIOSBanner, setShowIOSBanner] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  // Detect install state on client only, after hydration
  useEffect(() => {
    const standalone = isStandalone()
    const alreadyDismissed = wasDismissed()
    if (standalone || alreadyDismissed) {
      setDismissed(true)
    } else if (isIOSDevice()) {
      setShowIOSBanner(true)
    }
  }, [])

  useEffect(() => {
    if (dismissed) return

    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }

    const installedHandler = () => {
      setDeferredPrompt(null)
      setShowIOSBanner(false)
    }

    window.addEventListener("beforeinstallprompt", handler)
    window.addEventListener("appinstalled", installedHandler)

    return () => {
      window.removeEventListener("beforeinstallprompt", handler)
      window.removeEventListener("appinstalled", installedHandler)
    }
  }, [dismissed])

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === "accepted") {
      setDeferredPrompt(null)
    }
  }, [deferredPrompt])

  const dismissBanner = useCallback(() => {
    setDismissed(true)
    setShowIOSBanner(false)
    writeStorage(STORAGE_KEYS.INSTALL_PROMPT_DISMISSED_AT, String(Date.now()))
  }, [])

  return {
    canInstall: deferredPrompt !== null,
    promptInstall,
    showIOSBanner,
    showBanner: !dismissed && (deferredPrompt !== null || showIOSBanner),
    isIOS: showIOSBanner,
    dismissBanner,
  }
}