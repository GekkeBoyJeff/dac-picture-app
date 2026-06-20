"use client"

import { useEffect } from "react"
import { useHydrated } from "@/hooks/useHydrated"
import { BOOT_STAGES, useBootStore } from "@/stores/bootStore"

/**
 * Boots straight into the camera once hydrated.
 *
 * The first-run device-profile prompt (standard vs. Raspberry Pi) was removed —
 * the booth now always starts on the standard profile. The low-power profile is
 * still available any time via Instellingen → Geavanceerd → Raspberry Pi mode.
 */
export function DeviceSetupGate({ children }) {
  const hydrated = useHydrated()
  const setBootStage = useBootStore((s) => s.setBootStage)

  useEffect(() => {
    if (hydrated) setBootStage(BOOT_STAGES.CAMERA_STARTING)
  }, [hydrated, setBootStage])

  if (!hydrated) return null

  return children
}