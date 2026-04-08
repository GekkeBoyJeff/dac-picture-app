"use client"

import { useEffect, useState } from "react"
import { CloseIcon, InfoIcon } from "@/components/ui/icons"
import { usePowerStatus } from "@/hooks/usePowerStatus"
import { useUiStore } from "@/stores/uiStore"
import { StatPill } from "./settings/shared"
import { BasisTab } from "./settings/BasisTab"
import { AdvancedTab } from "./settings/AdvancedTab"

const DRAWER_HEADER_HEIGHT = 92
const TAB_HEIGHT = 52
const CARD_RADIUS = "rounded-xl"
const drawerCard = `${CARD_RADIUS} border border-white/10 bg-white/[0.04] shadow-[0_1px_0_rgba(255,255,255,0.03)_inset]`

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
  const currentPowerTone = "sky"
  const settingsSummary = [
    { label: "Power", value: currentPowerLabel, tone: "sky" },
    { label: "Flash", value: flashEnabled ? "Aan" : "Uit", tone: flashEnabled ? "sky" : "default" },
    {
      label: "Gestures",
      value: gesturesEnabled ? "Aan" : "Uit",
      tone: gesturesEnabled ? "sky" : "default",
    },
  ]

  return (
    <div
      className={`fixed inset-0 z-50 transition-opacity duration-200 ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Instellingen"
        className={`absolute left-0 top-0 flex h-dvh w-full max-w-lg flex-col overflow-hidden border-r border-white/10 bg-black/92 shadow-2xl transition-transform duration-300 md:translate-x-0 md:translate-y-0 max-md:bottom-0 max-md:top-auto max-md:right-0 max-md:h-[92dvh] max-md:max-w-none max-md:border-r-0 max-md:border-t max-md:rounded-t-4xl ${
          isOpen ? "translate-x-0 translate-y-0" : "md:-translate-x-full max-md:translate-y-full"
        }`}
      >
        {/* Header */}
        <div
          className="relative border-b border-white/10 px-5 py-4"
          style={{ minHeight: DRAWER_HEADER_HEIGHT }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(230,193,137,0.12),transparent_40%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent)]" />
          <div className="relative flex items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xl font-semibold text-white">Instellingen</p>
              <p className="max-w-[20rem] text-sm text-white/45">
                Een vaste, rustige configuratie zonder springende layout.
              </p>
            </div>
            <button
              onClick={onClose}
              className="cursor-pointer rounded-full border border-white/10 bg-white/5 p-2.5 transition-colors hover:bg-white/10"
              aria-label="Sluiten"
            >
              <CloseIcon className="w-5 h-5 text-white/75" />
            </button>
          </div>

          <div className="relative mt-4 grid grid-cols-3 gap-2">
            {settingsSummary.map((item) => (
              <StatPill
                key={item.label}
                label={item.label}
                value={item.value}
                tone={item.label === "Power" ? currentPowerTone : item.tone || "default"}
              />
            ))}
          </div>

          <div
            className="relative mt-4 grid grid-cols-2 gap-1.5 rounded-xl border border-white/10 bg-white/5 p-1.5"
            style={{ minHeight: TAB_HEIGHT }}
          >
            {tabs.map((tab) => {
              const active = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`cursor-pointer rounded-xl px-4 py-2 text-left transition-all ${active ? "bg-white/12 text-white shadow-sm hover:bg-white/16" : "text-white/55 hover:bg-white/8 hover:text-white/80"}`}
                >
                  <span className="block text-base font-semibold leading-tight">{tab.label}</span>
                  <span className="block text-[0.7rem] leading-tight text-white/45">
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
              className={`${drawerCard} flex min-h-15 w-full cursor-pointer items-center justify-between gap-3 px-4 py-3 text-left transition-all duration-200 hover:border-white/20 hover:bg-white/7`}
            >
              <div className="min-w-0">
                <p className="text-[0.65rem] uppercase tracking-[0.2em] text-white/45">
                  Over de app
                </p>
                <p className="mt-0.5 text-sm font-semibold text-white">Info en versie</p>
              </div>
              <InfoIcon className="h-4 w-4 shrink-0 text-white/55" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 touch-pan-y">
          <div className="min-h-168 space-y-5 lg:min-h-152">
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
