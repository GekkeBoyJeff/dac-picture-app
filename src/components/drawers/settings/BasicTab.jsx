"use client"

import { SettingsIcon } from "@/components/ui/icons"
import { usePowerStatus } from "@/hooks/usePowerStatus"
import { useUiStore } from "@/stores/uiStore"
import { holdPresets } from "./settingsPresets"
import { ChoiceButton, SectionLabel, ToggleRow } from "./settingsControls"

/** Daily-driver controls: flash, gestures, hold time. */
export function BasicTab({ onGoAdvanced }) {
  const flashEnabled = useUiStore((s) => s.flashEnabled)
  const gesturesEnabled = useUiStore((s) => s.gesturesEnabled)
  const gestureHoldMs = useUiStore((s) => s.gestureHoldMs)
  const lowPowerOverride = useUiStore((s) => s.lowPowerOverride)
  const toggleFlash = useUiStore((s) => s.toggleFlash)
  const toggleGestures = useUiStore((s) => s.toggleGestures)
  const setGestureHold = useUiStore((s) => s.setGestureHold)

  const powerStatus = usePowerStatus()
  const lowPowerLocked = powerStatus === "low" && !lowPowerOverride

  return (
    <section className="space-y-3">
      <SectionLabel title="Snel" description="De meest gebruikte instellingen voor elke dag." />

      <ToggleRow
        title="Flits"
        description="Schermflits bij het nemen van een foto"
        checked={flashEnabled}
        onClick={toggleFlash}
      />

      <ToggleRow
        title="Handgebaren"
        description={
          lowPowerLocked
            ? "Uitgeschakeld in low-power modus"
            : "Automatisch afdrukken met victory-gebaar"
        }
        checked={gesturesEnabled && !lowPowerLocked}
        disabled={lowPowerLocked}
        onClick={lowPowerLocked ? undefined : toggleGestures}
      />

      <div className="space-y-4 rounded-xl border border-hairline bg-surface p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-ink">Vasthouden voor trigger</p>
            <p className="text-xs text-ink-muted">Hoe lang je het gebaar moet vasthouden</p>
          </div>
          <span className="rounded-full border border-hairline bg-raised px-2.5 py-1 font-mono text-xs text-ink">
            {(gestureHoldMs / 1000).toFixed(1)}s
          </span>
        </div>

        <div className="grid grid-cols-5 gap-2">
          {holdPresets.map((preset) => (
            <ChoiceButton
              key={preset.value}
              selected={gestureHoldMs === preset.value}
              onClick={() => setGestureHold(preset.value)}
            >
              {preset.label}
            </ChoiceButton>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={onGoAdvanced}
        className="w-full cursor-pointer rounded-xl border border-hairline bg-surface px-4 py-4 text-left transition-all duration-200 hover:border-hairline-strong hover:bg-raised"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-ink">Naar geavanceerd</p>
            <p className="mt-0.5 text-xs text-ink-muted">
              Power, debug en tuning openen in een aparte view.
            </p>
          </div>
          <SettingsIcon className="h-5 w-5 text-ink-dim" />
        </div>
      </button>
    </section>
  )
}