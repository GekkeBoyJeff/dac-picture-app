import { lazy, Suspense, useMemo } from "react"
import { Spinner } from "@/components/ui/Spinner"
import { usePowerStatus } from "@/hooks/usePowerStatus"
import { useUiStore } from "@/stores/uiStore"
import { SectionLabel, ToggleRow, RangeControl } from "./shared"

const AnalyticsDashboard = lazy(() =>
  import("../AnalyticsDashboard").then((m) => ({ default: m.AnalyticsDashboard })),
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

const CARD_RADIUS = "rounded-xl"
const INNER_RADIUS = "rounded-lg"
const drawerCard = `${CARD_RADIUS} border border-white/10 bg-white/[0.04] shadow-[0_1px_0_rgba(255,255,255,0.03)_inset]`
const rowBase = `w-full ${CARD_RADIUS} border px-4 py-4 text-left transition-all duration-200`

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

  return (
    <>
      <section className="space-y-3">
        <SectionLabel
          title="Power"
          description="Raspberry Pi of standaard laptop/pc. Deze keuze beïnvloedt de lichte of zware configuratie."
        />

        <button
          type="button"
          onClick={() => (forceLowPower ? applyHighPowerPreset() : applyLowPowerPreset())}
          className={`${rowBase} ${drawerCard} min-h-22 cursor-pointer flex items-center justify-between gap-4 ${
            powerStatus === "low"
              ? "border-amber-400/45 bg-amber-400/10 text-white shadow-[0_0_0_1px_rgba(245,158,11,0.18)]"
              : "border-emerald-400/35 bg-emerald-400/10 text-white shadow-[0_0_0_1px_rgba(16,185,129,0.16)]"
          }`}
        >
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white">Raspberry Pi mode</p>
            <p className="mt-0.5 text-xs leading-5 text-white/55">
              {powerStatus === "low"
                ? "Aan: minimale belasting, camera blijft hoog"
                : "Uit: standaard instellingen voor reguliere pc's"}
            </p>
          </div>
          <span
            className={`shrink-0 rounded-full border px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.2em] ${powerStatus === "low" ? "border-amber-300/40 bg-amber-300/15 text-amber-50" : "border-emerald-300/40 bg-emerald-300/15 text-emerald-50"}`}
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
                : "Ontgrendel instellingen die geblokkeerd zijn door low-power modus"
            }
            active={lowPowerOverride}
            activeTone="amber"
            onClick={toggleLowPowerOverride}
          />
        )}

        <ToggleRow
          title="Debug"
          description="Groene/blauwe kaders + gesture status"
          active={debugEnabled}
          activeTone="emerald"
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
            const active =
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
                className={`${CARD_RADIUS} border px-3 py-3 text-left text-xs transition-all min-h-28 flex flex-col justify-between gap-1.5 ${
                  active
                    ? "border-violet-400/60 bg-violet-400/15 text-white"
                    : "border-white/10 bg-white/5 text-white/72 hover:border-white/20 hover:bg-white/[0.07]"
                } ${gestureControlsDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              >
                <div>
                  <p className="font-semibold text-sm leading-tight">{preset.label}</p>
                  <p className="mt-1 text-white/50 leading-snug">{preset.note}</p>
                </div>
                <p className="font-mono leading-snug text-white/60">
                  {preset.numHands} handen · {preset.minDetectionConfidence.toFixed(2)}
                </p>
              </button>
            )
          })}
        </div>

        <div className={`${drawerCard} p-4 space-y-4`}>
          <div>
            <p className="text-sm font-semibold text-white">Personaliseer opstelling</p>
            <p className="text-xs text-white/55">
              Pas het aantal handen en confidence-waarden handmatig aan.
            </p>
          </div>

          <div
            className={`${INNER_RADIUS} border border-white/10 bg-white/3 px-3 py-2.5 text-xs text-white/55`}
          >
            <p>Detectie = nieuwe hand oppikken</p>
            <p className="mt-1">Presence = hand blijft aanwezig</p>
            <p className="mt-1">Tracking = beweging stabiel volgen</p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {handOptions.map((option) => {
              const active = numHands === option
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setNumHands(option)}
                  disabled={gestureControlsDisabled}
                  className={`${INNER_RADIUS} border px-2 py-2 text-xs font-semibold transition-all ${
                    active
                      ? "border-sky-400/55 bg-sky-400/15 text-white"
                      : "border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:bg-white/[0.07]"
                  } ${gestureControlsDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
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
          description="Snelle, vaste presets met duidelijke rangschikking. Geen springende panelen."
        />

        <div className={`${drawerCard} p-4 space-y-4`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-white">Gebaren-tempo</p>
              <p className="text-xs text-white/55">
                Groen volgt elke frame, blauw volgt dit tempo.
              </p>
            </div>
            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-mono text-white/80">
              {formatInterval(detectionIntervalMs)}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {gesturePresets.map((preset) => {
              const active = activePreset?.label === preset.label
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    setDetectionInterval(preset.detectionInterval)
                    setTriggerScore(preset.triggerMinScore)
                  }}
                  disabled={gestureControlsDisabled}
                  className={`${CARD_RADIUS} border px-3 py-3 text-left text-xs transition-all min-h-[7.4rem] flex flex-col justify-between gap-1.5 ${
                    active
                      ? "border-sky-400/60 bg-sky-400/15 text-white"
                      : "border-white/10 bg-white/5 text-white/72 hover:border-white/20 hover:bg-white/[0.07]"
                  } ${gestureControlsDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  <div>
                    <p className="font-semibold text-sm leading-tight">{preset.label}</p>
                    <p className="mt-1 text-white/50 leading-snug">{preset.note}</p>
                  </div>
                  <p className="font-mono leading-snug text-white/60">
                    {formatInterval(preset.detectionInterval)} · {preset.triggerMinScore.toFixed(2)}
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
              <span className="font-mono text-white/80">{triggerMinScore.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={triggerMinScore}
              onChange={(event) => setTriggerScore(Number(event.target.value))}
              disabled={gestureControlsDisabled}
              className="w-full accent-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <SectionLabel
          title="Informatie"
          description="Technische details en diagnostiek, zonder de rest van de layout te verstoren."
        />

        {debugEnabled && (
          <div
            className={`${CARD_RADIUS} border border-white/10 bg-white/3 px-4 py-3 text-[0.6875rem] text-white/55`}
          >
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block h-3 w-3 rounded-full border-2 border-emerald-400/80" />
                <span>Groen: tracking elke frame</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block h-3 w-3 rounded-full border-2 border-sky-400/80" />
                <span>Blauw: tempo volgens gesture interval</span>
              </span>
            </div>
          </div>
        )}

        <div className={`${drawerCard} overflow-hidden`}>
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
