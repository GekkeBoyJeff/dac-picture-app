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
    : (selectedStage ?? (getStoredProfile() ? BOOT_STAGES.CAMERA_STARTING : BOOT_STAGES.DEVICE_PROMPT))

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
      <div className="absolute inset-0 bg-[radial-gradient(1100px_500px_at_50%_-80px,rgba(245,191,96,0.2),transparent_55%),radial-gradient(700px_380px_at_100%_100%,rgba(56,189,248,0.14),transparent_58%),linear-gradient(180deg,#0a0b0d_0%,#07080a_100%)]" />
      <div className="absolute left-1/2 top-8 h-40 w-40 -translate-x-1/2 rounded-full bg-amber-300/10 blur-3xl" />

      <div className="relative flex min-h-dvh items-center justify-center px-4 py-4 sm:px-6">
        <div className="w-full max-w-xl rounded-[22px] border border-white/12 bg-[linear-gradient(160deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-4 shadow-[0_20px_80px_-30px_rgba(0,0,0,0.95)] backdrop-blur-xl sm:rounded-[28px] sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/25 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">
              <WarningIcon className="h-3.5 w-3.5 text-amber-200" />
              Eerste keer
            </div>
            <div className="rounded-full border border-amber-100/20 bg-amber-100/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-100/85">
              DAC
            </div>
          </div>

          <div className="mt-3 space-y-2 sm:mt-4 sm:space-y-2.5">
            <h1 className="text-[1.45rem] font-semibold leading-tight tracking-[-0.02em] text-white sm:text-[1.95rem]">
              Dutch Anime Community
            </h1>
            <p className="max-w-[52ch] text-sm leading-5 text-white/65 sm:text-[15px] sm:leading-6">
              Waar draait de fotobooth nu op? Kies een profiel voor pc, laptop of mobiel. Deze keuze wordt onthouden.
            </p>
          </div>

          <div className="mt-4 space-y-2.5 sm:mt-5 sm:space-y-3">
            <button
              type="button"
              onClick={() => confirmChoice("standard")}
              className="group w-full cursor-pointer rounded-2xl border border-sky-200/35 bg-gradient-to-br from-sky-300/16 via-sky-200/6 to-transparent p-3.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-sky-100/55 hover:from-sky-300/22"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-100/82">PC, laptop of mobiel</p>
                <span className="rounded-full border border-sky-100/35 bg-sky-100/12 px-2.5 py-1 text-[11px] font-semibold text-sky-100">
                  Standaard
                </span>
              </div>
              <p className="mt-1.5 text-lg font-semibold leading-6 text-white">Normaal profiel</p>
              <p className="mt-1 text-sm leading-5 text-white/68">Beste keuze voor vrijwel alle setups.</p>
            </button>

            <button
              type="button"
              onClick={() => confirmChoice("raspberry-pi")}
              className="group w-full cursor-pointer rounded-2xl border border-white/14 bg-white/[0.04] p-3.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-white/24 hover:bg-white/[0.06]"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-100/78">Raspberry Pi (optioneel)</p>
              <p className="mt-1.5 text-lg font-semibold leading-6 text-white">Low-power profiel</p>
              <p className="mt-1 text-sm leading-5 text-white/68">Alleen gebruiken bij beperkte hardware of trage kiosk-opstelling.</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}