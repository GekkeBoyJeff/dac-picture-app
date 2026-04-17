"use client"

import { useEffect, useState } from "react"
import { CloseIcon, InfoIcon } from "@/components/ui/icons"
import { usePowerStatus } from "@/features/settings/hooks/usePowerStatus"
import { useUiStore } from "@/stores/uiStore"
import { StatPill } from "./shared"
import { BasisTab } from "./BasisTab"
import { AdvancedTab } from "./AdvancedTab"

const tabs = [
  { id: "basis", label: "Basis", description: "Dagelijkse bediening" },
  { id: "advanced", label: "Geavanceerd", description: "Power en tuning" },
]

export function SettingsDrawer({ isOpen, onClose, openAbout }) {
  const [activeTab, setActiveTab] = useState("basis")
  const flashEnabled = useUiStore((s) => s.flashEnabled)
  const gesturesEnabled = useUiStore((s) => s.gesturesEnabled)
  const lowPowerOverride = useUiStore((s) => s.lowPowerOverride)
  const powerStatus = usePowerStatus()
  const lowPowerLocked = powerStatus === "low" && !lowPowerOverride

  useEffect(() => {
    if (!isOpen) return
    const handler = (event) => {
      if (event.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [isOpen, onClose])

  const currentPowerLabel = powerStatus === "low" ? "Low-power" : "Standard"
  const settingsSummary = [
    { label: "Power", value: currentPowerLabel, tone: "active" },
    {
      label: "Flash",
      value: flashEnabled ? "Aan" : "Uit",
      tone: flashEnabled ? "active" : "default",
    },
    {
      label: "Gestures",
      value: gesturesEnabled ? "Aan" : "Uit",
      tone: gesturesEnabled ? "active" : "default",
    },
  ]

  return (
    <div
      className={`fixed inset-0 z-50 transition-opacity duration-200 ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
    >
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Instellingen"
        className={`absolute left-0 top-0 flex h-dvh w-full max-w-lg flex-col overflow-hidden border-r border-white/10 bg-[#0a0a0a] transition-transform duration-300 md:translate-x-0 md:translate-y-0 max-md:bottom-0 max-md:top-auto max-md:right-0 max-md:h-[92dvh] max-md:max-w-none max-md:border-r-0 max-md:border-t max-md:rounded-none ${isOpen ? "translate-x-0 translate-y-0" : "md:-translate-x-full max-md:translate-y-full"}`}
      >
        {/* Header */}
        <div
          className="relative border-b border-white/10 px-5 py-4"
          style={{ minHeight: "5.75rem" }}
        >
          <div className="relative flex items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xl font-bold text-white font-display uppercase tracking-[0.1em]">
                Instellingen
              </p>
              <p className="max-w-[20rem] text-sm text-white/40">
                Een vaste, rustige configuratie zonder springende layout.
              </p>
            </div>
            <button
              onClick={onClose}
              className="cursor-pointer rounded-none border border-white/20 p-2.5 bg-black transition-colors active:scale-95 hover:border-white"
              aria-label="Sluiten"
            >
              <CloseIcon className="w-5 h-5 text-white/60" />
            </button>
          </div>

          <div className="relative mt-4 grid grid-cols-3 gap-2">
            {settingsSummary.map((item) => (
              <StatPill key={item.label} label={item.label} value={item.value} tone={item.tone} />
            ))}
          </div>

          <div
            className="relative mt-4 grid grid-cols-2 gap-1.5 rounded-none border border-white/10 bg-[#111] p-1.5"
            style={{ minHeight: "3.25rem" }}
          >
            {tabs.map((tab) => {
              const active = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`cursor-pointer rounded-none px-4 py-2 text-left transition-all active:scale-[0.97] ${
                    active
                      ? "bg-[#1a1a1a] border border-[#e6c189] text-white"
                      : "text-white/40 border border-transparent"
                  }`}
                >
                  <span className="block text-base font-bold leading-tight">{tab.label}</span>
                  <span className="block text-[0.7rem] leading-tight text-white/40">
                    {tab.description}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="relative mt-4">
            <button
              type="button"
              onClick={() => {
                openAbout()
                onClose()
              }}
              className="flex min-h-[3.75rem] w-full cursor-pointer items-center justify-between gap-3 rounded-none border border-white/10 bg-[#111] px-4 py-3 text-left transition-all duration-200 active:scale-[0.98] hover:border-white/20"
            >
              <div className="min-w-0">
                <p className="text-[0.65rem] uppercase tracking-[0.2em] text-white/40 font-mono">
                  Over de app
                </p>
                <p className="mt-0.5 text-sm font-bold text-white">Info en versie</p>
              </div>
              <InfoIcon className="h-4 w-4 shrink-0 text-white/40" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 touch-pan-y">
          <div className="min-h-[42rem] space-y-5 lg:min-h-[38rem]">
            {activeTab === "basis" ? (
              <BasisTab
                onSwitchTab={() => setActiveTab("advanced")}
                lowPowerLocked={lowPowerLocked}
              />
            ) : (
              <AdvancedTab />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
