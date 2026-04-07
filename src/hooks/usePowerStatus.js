"use client"

import { useEffect, useState } from "react"
import { useUiStore } from "@/stores/uiStore"
import { isLowPowerDevice } from "@/lib/deviceCapability"

const LOW_BATTERY_THRESHOLD = 0.2

/**
 * Reactive power status combining three signals:
 *
 * 1. Hardware — ARM / low-spec (permanent)
 * 2. Battery  — ≤20 % and not charging (live updates)
 * 3. Manual   — user toggle in settings (persisted)
 *
 * Any one of these being true results in "low".
 */
export function usePowerStatus() {
  const forceLowPower = useUiStore((s) => s.forceLowPower)
  const [batteryLow, setBatteryLow] = useState(false)

  useEffect(() => {
    let battery = null

    const update = () => {
      if (!battery) return
      setBatteryLow(!battery.charging && battery.level <= LOW_BATTERY_THRESHOLD)
    }

    navigator.getBattery?.()
      .then((b) => {
        battery = b
        update()
        b.addEventListener("levelchange", update)
        b.addEventListener("chargingchange", update)
      })
      .catch(() => {
        // Battery API not supported
      })

    return () => {
      if (!battery) return
      battery.removeEventListener("levelchange", update)
      battery.removeEventListener("chargingchange", update)
    }
  }, [])

  if (forceLowPower || isLowPowerDevice() || batteryLow) return "low"
  return "high"
}