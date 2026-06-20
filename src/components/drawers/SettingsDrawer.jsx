"use client"

import { useEffect, useState } from "react"
import { CloseIcon, InfoIcon } from "@/components/ui/icons"
import { SegmentedControl } from "@/components/ui/SegmentedControl"
import { usePowerStatus } from "@/hooks/usePowerStatus"
import { useUiStore } from "@/stores/uiStore"
import { BasicTab } from "./settings/BasicTab"
import { AdvancedTab } from "./settings/AdvancedTab"
import { StatPill, TopAction } from "./settings/settingsControls"

const TABS = [
  { value: "basis", label: "Basis" },
  { value: "advanced", label: "Geavanceerd" },
]

export function SettingsDrawer({ isOpen, onClose, openAbout }) {
  const [activeTab, setActiveTab] = useState("basis")

  const flashEnabled = useUiStore((s) => s.flashEnabled)
  const gesturesEnabled = useUiStore((s) => s.gesturesEnabled)
  const powerStatus = usePowerStatus()

  useEffect(() => {
    if (!isOpen) return
    const handler = (event) => {
      if (event.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [isOpen, onClose])

  const summary = [
    { label: "Power", value: powerStatus === "low" ? "Low-power" : "Standaard", highlight: true },
    { label: "Flits", value: flashEnabled ? "Aan" : "Uit", highlight: flashEnabled },
    { label: "Gebaren", value: gesturesEnabled ? "Aan" : "Uit", highlight: gesturesEnabled },
  ]

  return (
    <div
      className={`fixed inset-0 z-50 transition-opacity duration-200 ${isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`}
    >
      <div className="absolute inset-0 bg-ground/70 backdrop-blur-sm" onClick={onClose} />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Instellingen"
        className={`absolute left-0 top-0 flex h-dvh w-full max-w-lg flex-col overflow-hidden border-r border-hairline bg-raised shadow-[0_24px_60px_rgba(0,0,0,0.6)] transition-transform duration-300 md:translate-x-0 md:translate-y-0 max-md:bottom-0 max-md:right-0 max-md:top-auto max-md:h-[92dvh] max-md:max-w-none max-md:rounded-t-[1.75rem] max-md:border-r-0 max-md:border-t ${
          isOpen ? "translate-x-0 translate-y-0" : "md:-translate-x-full max-md:translate-y-full"
        }`}
      >
        <div className="relative border-b border-hairline px-5 py-4">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(230,193,137,0.14),transparent_45%)]" />
          <div className="relative flex items-start justify-between gap-4">
            <div className="space-y-1">
              <h2 className="font-display text-xl font-semibold text-ink">Instellingen</h2>
              <p className="max-w-[20rem] text-sm text-ink-muted">
                Stel de booth af op je opstelling.
              </p>
            </div>
            <button
              onClick={onClose}
              className="cursor-pointer rounded-full border border-hairline bg-surface p-2.5 text-ink-muted transition-colors hover:bg-raised hover:text-ink"
              aria-label="Sluiten"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="relative mt-4 grid grid-cols-3 gap-2">
            {summary.map((item) => (
              <StatPill
                key={item.label}
                label={item.label}
                value={item.value}
                highlight={item.highlight}
              />
            ))}
          </div>

          <div className="relative mt-4">
            <SegmentedControl
              options={TABS}
              value={activeTab}
              onChange={setActiveTab}
              ariaLabel="Instellingen-secties"
            />
          </div>

          <div className="relative mt-4">
            <TopAction
              label="Over de app"
              description="Info en versie"
              onClick={() => {
                openAbout()
                onClose()
              }}
              icon={InfoIcon}
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 touch-pan-y space-y-5 overflow-y-auto overscroll-contain px-5 py-5">
          {activeTab === "basis" ? (
            <BasicTab onGoAdvanced={() => setActiveTab("advanced")} />
          ) : (
            <AdvancedTab />
          )}
        </div>
      </div>
    </div>
  )
}