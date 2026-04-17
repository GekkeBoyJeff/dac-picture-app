"use client"

import { useEffect, useState } from "react"
import { useUiStore } from "@/stores/uiStore"
import { isLowPowerDevice } from "@/lib/deviceCapability"

const LOW_BATTERY_THRESHOLD = 0.2

/**
 * Combined power mode detection from three signals:
 *
 * 1. Hardware - ARM / low-spec device (permanent, cached)
 * 2. Battery  - <=20% and not charging (live updates via Battery API)
 * 3. Manual   - user toggle in settings (persisted in uiStore)
 *
 * Any one signal being true results in "low".
 *
 * @returns {"low" | "standard"}
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

    navigator
      .getBattery?.()
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
  return "standard"
}