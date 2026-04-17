"use client"

import { useState, useEffect, useCallback } from "react"
import { STORAGE_KEYS, readStorage, writeStorage } from "@/lib/storage/localStorage"

const DISMISS_WINDOW_MS = 7 * 24 * 60 * 60 * 1000

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

function wasDismissedRecently() {
  try {
    const dismissed = readStorage(STORAGE_KEYS.INSTALL_PROMPT_DISMISSED_AT)
    if (!dismissed) return false
    return Date.now() - Number(dismissed) < DISMISS_WINDOW_MS
  } catch {
    return false
  }
}

/**
 * PWA install prompt handler.
 *
 * - Captures the beforeinstallprompt event (Chrome/Edge)
 * - Detects iOS for manual "Add to Home Screen" banner
 * - Persists dismissal to localStorage for 7 days
 * - Detects standalone mode (already installed)
 *
 * @returns {{
 *   canInstall: boolean,
 *   isIOS: boolean,
 *   showBanner: boolean,
 *   promptInstall: () => Promise<void>,
 *   dismissBanner: () => void,
 * }}
 */
export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false
    return isStandalone() || wasDismissedRecently()
  })
  const [showIOSBanner, setShowIOSBanner] = useState(() => {
    if (typeof window === "undefined") return false
    return !isStandalone() && !wasDismissedRecently() && isIOSDevice()
  })

  useEffect(() => {
    if (dismissed) return

    const handlePrompt = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }

    const handleInstalled = () => {
      setDeferredPrompt(null)
      setShowIOSBanner(false)
    }

    window.addEventListener("beforeinstallprompt", handlePrompt)
    window.addEventListener("appinstalled", handleInstalled)

    return () => {
      window.removeEventListener("beforeinstallprompt", handlePrompt)
      window.removeEventListener("appinstalled", handleInstalled)
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
    isIOS: showIOSBanner,
    showBanner: !dismissed && (deferredPrompt !== null || showIOSBanner),
    promptInstall,
    dismissBanner,
  }
}