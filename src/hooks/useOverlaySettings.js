"use client"

import { useState, useEffect, useCallback } from "react"
import {
  LAYOUTS,
  DEFAULT_LAYOUT_ID,
  MASCOTS,
  DEFAULT_MASCOT_ID,
  getActiveConvention,
} from "@/lib/config"
import { STORAGE_KEYS, readStorage, writeStorage } from "@/lib/storage/localStorage"

export function useOverlaySettings() {
  const [layoutId, setLayoutId] = useState(DEFAULT_LAYOUT_ID)

  const [mascotId, setMascotId] = useState(DEFAULT_MASCOT_ID)

  useEffect(() => {
    const storedLayout = readStorage(STORAGE_KEYS.OVERLAY_LAYOUT)
    const storedMascot = readStorage(STORAGE_KEYS.OVERLAY_MASCOT)

    if (!storedLayout && !storedMascot) return

    requestAnimationFrame(() => {
      if (storedLayout) setLayoutId(storedLayout)
      if (storedMascot) setMascotId(storedMascot)
    })
  }, [])

  // Persist layout changes to storage
  useEffect(() => {
    writeStorage(STORAGE_KEYS.OVERLAY_LAYOUT, layoutId)
  }, [layoutId])

  // Persist mascot changes to storage
  useEffect(() => {
    writeStorage(STORAGE_KEYS.OVERLAY_MASCOT, mascotId)
  }, [mascotId])

  const layout = LAYOUTS.find((l) => l.id === layoutId) || LAYOUTS[0]
  const mascot = MASCOTS.find((m) => m.id === mascotId) || MASCOTS[0]
  const activeConvention = getActiveConvention()

  return { layout, mascot, activeConvention, setLayoutId, setMascotId }
}