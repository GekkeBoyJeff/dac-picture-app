import { lazy, Suspense, useMemo } from "react"
import { Spinner } from "@/components/ui/Spinner"
import { usePowerStatus } from "@/features/settings/hooks/usePowerStatus"
import { useUiStore } from "@/stores/uiStore"
import { SectionLabel, ToggleRow, RangeControl } from "./shared"

const AnalyticsDashboard = lazy(() =>
  import("@/features/analytics/components/AnalyticsDashboard").then((m) => ({
    default: m.AnalyticsDashboard,
  })),
)

const gesturePresets = [
  {
    label: "Realtime",
    detectionInterval: 0,
    triggerMinScore: 0.25,
    note: "Max snelheid, meer CPU",
  },
  { label: "Gebalanceerd", detectionInterval: 120, triggerMinScore: 0.35, note: "Standaard" },
  {
    label: "Spaarstand",
    detectionInterval: 400,
    triggerMinScore: 0.5,
    note: "Rustiger voor batterij",
  },
]

const scenePresets = [
  {
    id: "convention",
    label: "Conventie",
    note: "Drukke omgeving",
    numHands: 8,
    minDetectionConfidence: 0.4,
    minPresenceConfidence: 0.4,
    minTrackingConfidence: 0.4,
  },
  {
    id: "booth",
    label: "Photobooth",
    note: "Vaste camera",
    numHands: 4,
    minDetectionConfidence: 0.5,
    minPresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
  },
  {
    id: "mobile",
    label: "Mobiel",
    note: "Telefoon of tablet",
    numHands: 2,
    minDetectionConfidence: 0.6,
    minPresenceConfidence: 0.6,
    minTrackingConfidence: 0.5,
  },
  {
    id: "lowpower",
    label: "Zuinig",
    note: "Raspberry Pi",
    numHands: 2,
    minDetectionConfidence: 0.65,
    minPresenceConfidence: 0.65,
    minTrackingConfidence: 0.6,
  },
]

const formatInterval = (ms) => (ms <= 0 ? "Realtime (0ms)" : `${ms}ms`)
const formatConfidence = (value) => Number(value).toFixed(2)
const handOptions = [2, 4, 6, 8, 10, 12]

const GOLD = "#e6c189"

export function AdvancedTab() {
  const debugEnabled = useUiStore((s) => s.debugEnabled)
  const detectionIntervalMs = useUiStore((s) => s.detectionIntervalMs)
  const triggerMinScore = useUiStore((s) => s.triggerMinScore)
  const toggleDebug = useUiStore((s) => s.toggleDebug)
  const numHands = useUiStore((s) => s.numHands)
  const minDetectionConfidence = useUiStore((s) => s.minDetectionConfidence)
  const minPresenceConfidence = useUiStore((s) => s.minPresenceConfidence)
  const minTrackingConfidence = useUiStore((s) => s.minTrackingConfidence)
  const setNumHands = useUiStore((s) => s.setNumHands)
  const setMinDetectionConfidence = useUiStore((s) => s.setMinDetectionConfidence)
  const setMinPresenceConfidence = useUiStore((s) => s.setMinPresenceConfidence)
  const setMinTrackingConfidence = useUiStore((s) => s.setMinTrackingConfidence)
  const setDetectionInterval = useUiStore((s) => s.setDetectionInterval)
  const setTriggerScore = useUiStore((s) => s.setTriggerScore)
  const applyScenePreset = useUiStore((s) => s.applyScenePreset)
  const applyLowPowerPreset = useUiStore((s) => s.applyLowPowerPreset)
  const applyHighPowerPreset = useUiStore((s) => s.applyHighPowerPreset)
  const forceLowPower = useUiStore((s) => s.forceLowPower)
  const lowPowerOverride = useUiStore((s) => s.lowPowerOverride)
  const toggleLowPowerOverride = useUiStore((s) => s.toggleLowPowerOverride)

  const powerStatus = usePowerStatus()
  const lowPowerLocked = powerStatus === "low" && !lowPowerOverride
  const gestureControlsDisabled = lowPowerLocked

  const activePreset = useMemo(
    () =>
      gesturePresets.find(
        (preset) =>
          preset.detectionInterval === detectionIntervalMs &&
          preset.triggerMinScore === triggerMinScore,
      ),
    [detectionIntervalMs, triggerMinScore],
  )

  const activeCardBorder = (isActive) =>
    isActive ? "border-[#e6c189] bg-[#1a1a1a]" : "border-white/10 bg-black hover:border-white/20"

  return (
    <>
      <section className="space-y-3">
        <SectionLabel title="Power" description="Raspberry Pi of standaard laptop/pc." />
        <button
          type="button"
          onClick={() => (forceLowPower ? applyHighPowerPreset() : applyLowPowerPreset())}
          className={`flex min-h-[4.5rem] w-full cursor-pointer items-center justify-between gap-4 rounded-none border px-4 py-4 text-left transition-all duration-200 active:scale-[0.98] ${
            powerStatus === "low" ? "border-[#e6c189] bg-[#111]" : "border-white/10 bg-[#111]"
          }`}
        >
          <div className="min-w-0">
            <p className="text-sm font-bold text-white">Raspberry Pi mode</p>
            <p className="mt-0.5 text-xs leading-5 text-white/40">
              {powerStatus === "low"
                ? "Aan: minimale belasting, camera blijft hoog"
                : "Uit: standaard instellingen voor reguliere pc's"}
            </p>
          </div>
          <span
            className={`shrink-0 rounded-none border px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.2em] font-mono ${
              powerStatus === "low"
                ? "border-[#e6c189] text-[#e6c189]"
                : "border-white/10 text-white/60"
            }`}
          >
            {powerStatus === "low" ? "Aan" : "Uit"}
          </span>
        </button>

        {powerStatus === "low" && (
          <ToggleRow
            title="Low-power override"
            description={
              lowPowerOverride
                ? "Alle instellingen zijn ontgrendeld"
                : "Ontgrendel instellingen geblokkeerd door low-power"
            }
            active={lowPowerOverride}
            onClick={toggleLowPowerOverride}
          />
        )}

        <ToggleRow
          title="Debug"
          description="Groene/blauwe kaders + gesture status"
          active={debugEnabled}
          onClick={toggleDebug}
        />
      </section>

      <section className="space-y-3">
        <SectionLabel
          title="Opstelling"
          description="Pas handen, detectie en tracking aan per situatie."
        />
        <div className="grid grid-cols-2 gap-2.5">
          {scenePresets.map((preset) => {
            const isActive =
              numHands === preset.numHands &&
              minDetectionConfidence === preset.minDetectionConfidence &&
              minPresenceConfidence === preset.minPresenceConfidence &&
              minTrackingConfidence === preset.minTrackingConfidence
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyScenePreset(preset)}
                disabled={gestureControlsDisabled}
                className={`flex min-h-[7rem] flex-col justify-between gap-1.5 rounded-none border px-3 py-3 text-left text-xs transition-all ${gestureControlsDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer active:scale-[0.97]"} ${activeCardBorder(isActive)}`}
              >
                <div>
                  <p className="text-sm font-bold leading-tight text-white">{preset.label}</p>
                  <p className="mt-1 leading-snug text-white/40">{preset.note}</p>
                </div>
                <p className="font-mono leading-snug text-white/60">
                  {preset.numHands} handen &middot; {preset.minDetectionConfidence.toFixed(2)}
                </p>
              </button>
            )
          })}
        </div>

        <div className="space-y-4 rounded-none border border-white/10 bg-[#111] p-4">
          <div>
            <p className="text-sm font-bold text-white">Personaliseer opstelling</p>
            <p className="text-xs text-white/40">
              Pas het aantal handen en confidence-waarden handmatig aan.
            </p>
          </div>
          <div className="rounded-none border border-white/10 bg-black px-3 py-2.5 text-[0.6875rem] text-white/40 font-mono">
            <p>Detectie = nieuwe hand oppikken</p>
            <p className="mt-1">Presence = hand blijft aanwezig</p>
            <p className="mt-1">Tracking = beweging stabiel volgen</p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {handOptions.map((option) => {
              const isActive = numHands === option
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setNumHands(option)}
                  disabled={gestureControlsDisabled}
                  className={`rounded-none border px-2 py-2 text-xs font-bold font-mono transition-all ${gestureControlsDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer active:scale-95"} ${activeCardBorder(isActive)}`}
                >
                  {option} handen
                </button>
              )
            })}
          </div>
          <RangeControl
            label="Detectie confidence"
            value={minDetectionConfidence}
            min={0.2}
            max={0.9}
            step={0.01}
            onChange={setMinDetectionConfidence}
            formatValue={formatConfidence}
            disabled={gestureControlsDisabled}
          />
          <RangeControl
            label="Presence confidence"
            value={minPresenceConfidence}
            min={0.2}
            max={0.9}
            step={0.01}
            onChange={setMinPresenceConfidence}
            formatValue={formatConfidence}
            disabled={gestureControlsDisabled}
          />
          <RangeControl
            label="Tracking confidence"
            value={minTrackingConfidence}
            min={0.2}
            max={0.9}
            step={0.01}
            onChange={setMinTrackingConfidence}
            formatValue={formatConfidence}
            disabled={gestureControlsDisabled}
          />
        </div>
      </section>

      <section className="space-y-3">
        <SectionLabel
          title="Gebaren"
          description="Snelle, vaste presets met duidelijke rangschikking."
        />
        <div className="space-y-4 rounded-none border border-white/10 bg-[#111] p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-white">Gebaren-tempo</p>
              <p className="text-xs text-white/40">
                Groen volgt elke frame, blauw volgt dit tempo.
              </p>
            </div>
            <span className="rounded-none border border-white/10 bg-black px-2.5 py-1 text-xs font-mono text-white">
              {formatInterval(detectionIntervalMs)}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            {gesturePresets.map((preset) => {
              const isActive = activePreset?.label === preset.label
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    setDetectionInterval(preset.detectionInterval)
                    setTriggerScore(preset.triggerMinScore)
                  }}
                  disabled={gestureControlsDisabled}
                  className={`flex min-h-[7.4rem] flex-col justify-between gap-1.5 rounded-none border px-3 py-3 text-left text-xs transition-all ${gestureControlsDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer active:scale-[0.97]"} ${activeCardBorder(isActive)}`}
                >
                  <div>
                    <p className="text-sm font-bold leading-tight text-white">{preset.label}</p>
                    <p className="mt-1 leading-snug text-white/40">{preset.note}</p>
                  </div>
                  <p className="font-mono leading-snug text-white/60">
                    {formatInterval(preset.detectionInterval)} &middot;{" "}
                    {preset.triggerMinScore.toFixed(2)}
                  </p>
                </button>
              )
            })}
          </div>
          <RangeControl
            label="Gesture check interval"
            value={detectionIntervalMs}
            min={0}
            max={1200}
            step={60}
            onChange={setDetectionInterval}
            formatValue={formatInterval}
            disabled={gestureControlsDisabled}
          />
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-white/60">
              <span>Trigger score drempel</span>
              <span className="font-mono text-white">{triggerMinScore.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={triggerMinScore}
              onChange={(event) => setTriggerScore(Number(event.target.value))}
              disabled={gestureControlsDisabled}
              className="w-full disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ accentColor: GOLD }}
            />
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <SectionLabel title="Informatie" description="Technische details en diagnostiek." />
        {debugEnabled && (
          <div className="rounded-none border border-white/10 bg-black px-4 py-3 text-[0.6875rem] text-white/40 font-mono">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block h-3 w-3 rounded-none border-2 border-white/60" />
                <span>Groen: tracking elke frame</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block h-3 w-3 rounded-none border-2 border-white/30" />
                <span>Blauw: tempo volgens gesture interval</span>
              </span>
            </div>
          </div>
        )}
        <div className="overflow-hidden rounded-none border border-white/10 bg-[#111]">
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-8">
                <Spinner />
              </div>
            }
          >
            <AnalyticsDashboard />
          </Suspense>
        </div>
      </section>
    </>
  )
}
