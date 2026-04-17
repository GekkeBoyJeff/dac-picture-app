"use client"

import { useEffect, useState } from "react"
import { WarningIcon } from "@/components/ui/icons"
import { useHydrated } from "@/hooks/useHydrated"
import { BOOT_STAGES, useBootStore } from "@/stores/bootStore"
import { useUiStore } from "@/stores/uiStore"

const STORAGE_KEY = "dac-picture-app-device-profile-v2"

function getStoredProfile() {
  try {
    const profile = window.localStorage.getItem(STORAGE_KEY)
    return profile && profile.trim().length > 0 ? profile : null
  } catch {
    return null
  }
}

export function DeviceSetupGate({ children }) {
  const hydrated = useHydrated()
  const applyLowPowerPreset = useUiStore((s) => s.applyLowPowerPreset)
  const setBootStage = useBootStore((s) => s.setBootStage)
  const [selectedStage, setSelectedStage] = useState(null)

  const stage = !hydrated
    ? BOOT_STAGES.DEVICE_CHECK
    : (selectedStage ??
      (getStoredProfile() ? BOOT_STAGES.CAMERA_STARTING : BOOT_STAGES.DEVICE_PROMPT))

  const confirmChoice = (profile) => {
    if (profile !== "raspberry-pi" && profile !== "standard") {
      setSelectedStage(BOOT_STAGES.DEVICE_PROMPT)
      return
    }

    if (profile === "raspberry-pi") {
      applyLowPowerPreset()
    }
    window.localStorage.setItem(STORAGE_KEY, profile)
    setSelectedStage(BOOT_STAGES.CAMERA_STARTING)
  }

  useEffect(() => {
    setBootStage(stage)
  }, [stage, setBootStage])

  if (!hydrated || stage === BOOT_STAGES.DEVICE_CHECK) return null

  if (stage !== BOOT_STAGES.DEVICE_PROMPT) {
    return children
  }

  return (
    <div className="fixed inset-0 z-[80] overflow-hidden bg-black text-white">
      <div className="relative flex min-h-dvh items-center justify-center px-4 py-4 sm:px-6">
        <div className="w-full max-w-xl rounded-none border border-white/20 bg-[#0a0a0a] p-4 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 rounded-none border border-white/20 bg-black px-3 py-1 text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-white/60 font-mono">
              <WarningIcon className="h-3.5 w-3.5 text-[#e6c189]" />
              Eerste keer
            </div>
            <div className="rounded-none border border-[#e6c189] px-2.5 py-1 text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-[#e6c189] font-mono">
              DAC
            </div>
          </div>

          <div className="mt-3 space-y-2 sm:mt-4 sm:space-y-2.5">
            <h1 className="text-[1.45rem] font-black leading-tight tracking-[0.05em] uppercase text-white font-display sm:text-[1.95rem]">
              Dutch Anime Community
            </h1>
            <p className="max-w-[52ch] text-sm leading-5 text-white/60 sm:text-[0.9375rem] sm:leading-6">
              Waar draait de fotobooth nu op? Kies een profiel voor pc, laptop of mobiel. Deze keuze
              wordt onthouden.
            </p>
          </div>

          <div className="mt-4 space-y-2.5 sm:mt-5 sm:space-y-3">
            <button
              type="button"
              onClick={() => confirmChoice("standard")}
              className="group w-full cursor-pointer rounded-none border border-[#e6c189] bg-black p-3.5 text-left transition-all duration-200 hover:bg-[#111] active:scale-[0.98]"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-[#e6c189] font-mono">
                  PC, laptop of mobiel
                </p>
                <span className="rounded-none border border-[#e6c189] px-2.5 py-1 text-[0.6875rem] font-bold text-[#e6c189] font-mono">
                  Standaard
                </span>
              </div>
              <p className="mt-1.5 text-lg font-bold leading-6 text-white">Normaal profiel</p>
              <p className="mt-1 text-sm leading-5 text-white/60">
                Beste keuze voor vrijwel alle setups.
              </p>
            </button>

            <button
              type="button"
              onClick={() => confirmChoice("raspberry-pi")}
              className="group w-full cursor-pointer rounded-none border border-white/10 bg-black p-3.5 text-left transition-all duration-200 hover:border-white/20 hover:bg-[#111] active:scale-[0.98]"
            >
              <p className="text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-white/40 font-mono">
                Raspberry Pi (optioneel)
              </p>
              <p className="mt-1.5 text-lg font-bold leading-6 text-white">Low-power profiel</p>
              <p className="mt-1 text-sm leading-5 text-white/60">
                Alleen gebruiken bij beperkte hardware of trage kiosk-opstelling.
              </p>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
