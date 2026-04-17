import { SettingsIcon } from "@/components/ui/icons"
import { useUiStore } from "@/stores/uiStore"
import { SectionLabel, ToggleRow } from "./shared"

const holdPresets = [
  { label: "0.5s", value: 500 },
  { label: "1s", value: 1000 },
  { label: "1.5s", value: 1500 },
  { label: "2s", value: 2000 },
  { label: "3s", value: 3000 },
]

export function BasisTab({ onSwitchTab, lowPowerLocked }) {
  const flashEnabled = useUiStore((s) => s.flashEnabled)
  const gesturesEnabled = useUiStore((s) => s.gesturesEnabled)
  const gestureHoldMs = useUiStore((s) => s.gestureHoldMs)
  const toggleFlash = useUiStore((s) => s.toggleFlash)
  const toggleGestures = useUiStore((s) => s.toggleGestures)
  const setGestureHold = useUiStore((s) => s.setGestureHold)

  return (
    <section className="space-y-3">
      <SectionLabel
        title="Snel"
        description="De meest gebruikte toggles staan hier als strakke, vaste rows."
      />

      <ToggleRow
        title="Flits"
        description="Schermflits bij het nemen van een foto"
        active={flashEnabled}
        onClick={toggleFlash}
      />

      <ToggleRow
        title="Handgebaren"
        description={
          lowPowerLocked
            ? "Uitgeschakeld in low-power modus"
            : "Automatisch afdrukken met victory-gebaar"
        }
        active={gesturesEnabled && !lowPowerLocked}
        disabled={lowPowerLocked}
        onClick={lowPowerLocked ? undefined : toggleGestures}
      />

      <div className="space-y-4 rounded-none border border-white/10 bg-[#111] p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-white">Vasthouden voor trigger</p>
            <p className="text-xs text-white/40">Hoe lang je het gebaar moet vasthouden</p>
          </div>
          <span className="rounded-none border border-white/10 bg-black px-2.5 py-1 text-xs font-mono text-white">
            {(gestureHoldMs / 1000).toFixed(1)}s
          </span>
        </div>

        <div className="grid grid-cols-5 gap-2">
          {holdPresets.map((preset) => {
            const active = gestureHoldMs === preset.value
            return (
              <button
                key={preset.value}
                type="button"
                onClick={() => setGestureHold(preset.value)}
                className={`cursor-pointer rounded-none border px-2 py-3 text-xs font-mono font-bold transition-all active:scale-95 ${
                  active
                    ? "border-[#e6c189] bg-[#1a1a1a] text-white"
                    : "border-white/10 bg-black text-white/70 hover:border-white/20"
                }`}
              >
                {preset.label}
              </button>
            )
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={onSwitchTab}
        className="w-full cursor-pointer rounded-none border border-white/10 bg-[#111] px-4 py-4 text-left transition-all duration-200 active:scale-[0.98] hover:border-white/20"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-white">Naar geavanceerd</p>
            <p className="mt-0.5 text-xs text-white/40">
              Power, debug en tuning openen in een aparte, stabiele view.
            </p>
          </div>
          <SettingsIcon className="h-5 w-5 text-white/40" />
        </div>
      </button>
    </section>
  )
}
