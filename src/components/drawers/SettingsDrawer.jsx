"use client"

import { useEffect, useMemo, useState } from "react"
import { CloseIcon } from "@/components/ui/icons"
import { useUiStore } from "@/stores/uiStore"
import { usePowerStatus } from "@/hooks/usePowerStatus"
import { AnalyticsDashboard } from "./AnalyticsDashboard"

const gesturePresets = [
  { label: "Realtime", detectionInterval: 0, triggerMinScore: 0.25, note: "Max snelheid, meer CPU" },
  { label: "Gebalanceerd", detectionInterval: 120, triggerMinScore: 0.35, note: "Standaard" },
  { label: "Spaarstand", detectionInterval: 400, triggerMinScore: 0.5, note: "Rustiger voor batterij" },
]

const scenePresets = [
  {
    id: "convention",
    label: "Conventie",
    note: "Drukke omgeving, grote groepen",
    numHands: 8,
    minDetectionConfidence: 0.4,
    minPresenceConfidence: 0.4,
    minTrackingConfidence: 0.4,
  },
  {
    id: "booth",
    label: "Photobooth",
    note: "Vaste camera, 1-4 personen",
    numHands: 4,
    minDetectionConfidence: 0.5,
    minPresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
  },
  {
    id: "mobile",
    label: "Mobiel",
    note: "Telefoon of tablet, dichtbij",
    numHands: 2,
    minDetectionConfidence: 0.6,
    minPresenceConfidence: 0.6,
    minTrackingConfidence: 0.5,
  },
  {
    id: "lowpower",
    label: "Zuinig",
    note: "Raspberry Pi of zwak apparaat",
    numHands: 2,
    minDetectionConfidence: 0.65,
    minPresenceConfidence: 0.65,
    minTrackingConfidence: 0.6,
  },
]

const holdPresets = [
  { label: "0.5s", value: 500 },
  { label: "1s", value: 1000 },
  { label: "1.5s", value: 1500 },
  { label: "2s", value: 2000 },
  { label: "3s", value: 3000 },
]

const formatInterval = (ms) => (ms <= 0 ? "Realtime (0ms)" : `${ms}ms`)

const DRAWER_HEADER_HEIGHT = 72

export function SettingsDrawer({ isOpen, onClose, openAbout }) {
  const [showAdvanced, setShowAdvanced] = useState(false)

  const debugEnabled = useUiStore((s) => s.debugEnabled)
  const flashEnabled = useUiStore((s) => s.flashEnabled)
  const gesturesEnabled = useUiStore((s) => s.gesturesEnabled)
  const detectionIntervalMs = useUiStore((s) => s.detectionIntervalMs)
  const triggerMinScore = useUiStore((s) => s.triggerMinScore)
  const gestureHoldMs = useUiStore((s) => s.gestureHoldMs)
  const toggleDebug = useUiStore((s) => s.toggleDebug)
  const toggleFlash = useUiStore((s) => s.toggleFlash)
  const toggleGestures = useUiStore((s) => s.toggleGestures)
  const numHands = useUiStore((s) => s.numHands)
  const minDetectionConfidence = useUiStore((s) => s.minDetectionConfidence)
  const minPresenceConfidence = useUiStore((s) => s.minPresenceConfidence)
  const minTrackingConfidence = useUiStore((s) => s.minTrackingConfidence)
  const setDetectionInterval = useUiStore((s) => s.setDetectionInterval)
  const setTriggerScore = useUiStore((s) => s.setTriggerScore)
  const setGestureHold = useUiStore((s) => s.setGestureHold)
  const applyScenePreset = useUiStore((s) => s.applyScenePreset)
  const forceLowPower = useUiStore((s) => s.forceLowPower)
  const lowPowerOverride = useUiStore((s) => s.lowPowerOverride)
  const toggleForceLowPower = useUiStore((s) => s.toggleForceLowPower)
  const toggleLowPowerOverride = useUiStore((s) => s.toggleLowPowerOverride)

  const powerStatus = usePowerStatus()
  const lowPowerLocked = powerStatus === "low" && !lowPowerOverride

  useEffect(() => {
    if (!isOpen) return
    const handler = (e) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [isOpen, onClose])

  const gestureControlsDisabled = !gesturesEnabled || lowPowerLocked

  const activePreset = useMemo(() => {
    return gesturePresets.find(
      (preset) => preset.detectionInterval === detectionIntervalMs && preset.triggerMinScore === triggerMinScore,
    )
  }, [detectionIntervalMs, triggerMinScore])

  return (
    <div
      className={`fixed inset-0 z-50 transition-opacity duration-200 ${
        isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Instellingen"
        className={`absolute top-0 bottom-0 left-0 w-full max-w-sm rounded-r-2xl bg-black/90 border-r border-white/10 shadow-2xl transition-transform duration-250 overflow-hidden flex flex-col ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between sticky top-0 bg-black/90 z-10" style={{ minHeight: DRAWER_HEADER_HEIGHT }}>
          <div className="flex items-center gap-2">
            <p className="text-white font-semibold text-lg">Instellingen</p>
            <button
              type="button"
              onClick={toggleForceLowPower}
              className={`px-2 py-0.5 rounded-full border text-[0.625rem] font-medium leading-tight cursor-pointer transition-colors ${
                powerStatus === "low"
                  ? "bg-amber-400/15 border-amber-400/30 text-amber-300 hover:bg-amber-400/25"
                  : "bg-emerald-400/15 border-emerald-400/30 text-emerald-300 hover:bg-emerald-400/25"
              }`}
              title={forceLowPower ? "Low-power geforceerd — klik om uit te schakelen" : "Klik om low-power te forceren"}
            >
              {powerStatus === "low" ? "Low-power" : "High-power"}
            </button>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer" aria-label="Sluiten">
            <CloseIcon className="w-5 h-5 text-white/70" />
          </button>
        </div>

        <div className="p-5 flex-1 flex flex-col gap-4 overflow-y-auto pb-8">
          {/* Flits toggle */}
          <button
            onClick={toggleFlash}
            className={`w-full rounded-xl border transition-all text-left px-4 py-3 cursor-pointer ${
              flashEnabled
                ? "border-amber-400/50 bg-amber-400/10 shadow-[0_0_0_1px_rgba(245,158,11,0.25)] text-white"
                : "border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:text-white"
            }`}
          >
            <p className="font-medium text-sm">Flits</p>
            <p className="text-xs text-white/60">Schermflits bij het nemen van een foto</p>
          </button>

          {/* Handgebaren toggle */}
          <button
            onClick={lowPowerLocked ? undefined : toggleGestures}
            disabled={lowPowerLocked}
            className={`w-full rounded-xl border transition-all text-left px-4 py-3 ${
              lowPowerLocked
                ? "opacity-50 cursor-not-allowed"
                : "cursor-pointer"
            } ${
              gesturesEnabled && !lowPowerLocked
                ? "border-sky-400/50 bg-sky-400/10 shadow-[0_0_0_1px_rgba(56,189,248,0.25)] text-white"
                : "border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:text-white"
            }`}
          >
            <p className="font-medium text-sm">Handgebaren</p>
            <p className="text-xs text-white/60">
              {lowPowerLocked ? "Uitgeschakeld in low-power modus" : "Automatisch afdrukken met victory-gebaar"}
            </p>
          </button>

          {/* Vasthouden-duur */}
          <div className={`rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3 ${gestureControlsDisabled ? "opacity-60" : ""}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white text-sm font-semibold">Vasthouden voor trigger</p>
                <p className="text-white/50 text-xs">Hoe lang je het gebaar moet vasthouden</p>
              </div>
              <span className="text-white/70 text-xs font-mono">{(gestureHoldMs / 1000).toFixed(1)}s</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {holdPresets.map((preset) => {
                const active = gestureHoldMs === preset.value
                return (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setGestureHold(preset.value)}
                    disabled={gestureControlsDisabled}
                    className={`rounded-lg border px-3 py-1.5 text-xs transition-all ${
                      active
                        ? "border-sky-400/60 bg-sky-400/15 text-white shadow-[0_0_0_1px_rgba(56,189,248,0.2)]"
                        : "border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:text-white"
                    } ${gestureControlsDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    {preset.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Geavanceerd toggle */}
          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-white/8 transition-colors"
          >
            <div className="text-left">
              <p className="text-white/70 text-sm font-medium">Geavanceerd</p>
              <p className="text-white/40 text-xs">Debug, detectie-snelheid en drempels</p>
            </div>
            <svg className={`w-4 h-4 text-white/40 transition-transform duration-200 ${showAdvanced ? "rotate-180" : ""}`} viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
            </svg>
          </button>

          {showAdvanced && (
            <>
              {powerStatus === "low" && (
                <button
                  onClick={toggleLowPowerOverride}
                  className={`w-full rounded-xl border transition-all text-left px-4 py-3 cursor-pointer ${
                    lowPowerOverride
                      ? "border-amber-400/50 bg-amber-400/10 shadow-[0_0_0_1px_rgba(245,158,11,0.25)] text-white"
                      : "border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:text-white"
                  }`}
                >
                  <p className="font-medium text-sm">Low-power override</p>
                  <p className="text-xs text-white/60">
                    {lowPowerOverride
                      ? "Alle instellingen zijn ontgrendeld"
                      : "Ontgrendel instellingen die geblokkeerd zijn door low-power modus"}
                  </p>
                </button>
              )}

              <button
                onClick={toggleDebug}
                className={`w-full rounded-xl border transition-all text-left px-4 py-3 cursor-pointer ${
                  debugEnabled
                    ? "border-emerald-400/50 bg-emerald-400/10 shadow-[0_0_0_1px_rgba(16,185,129,0.25)] text-white"
                    : "border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:text-white"
                }`}
              >
                <p className="font-medium text-sm">Debug</p>
                <p className="text-xs text-white/60">Groene/blauwe kaders + gesture status</p>
              </button>

              <div className={`rounded-2xl border border-white/10 bg-white/5 p-4 space-y-4 ${gestureControlsDisabled ? "opacity-60" : ""}`}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-white text-sm font-semibold">Gebaren-tempo</p>
                    <p className="text-white/50 text-xs">Groen volgt elke frame, blauw volgt dit tempo.</p>
                  </div>
                  <span className="text-white/70 text-xs font-mono">{formatInterval(detectionIntervalMs)}</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
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
                        className={`rounded-xl border px-3 py-2 text-left text-xs transition-all h-full flex flex-col gap-1 justify-between ${
                          active
                            ? "border-sky-400/60 bg-sky-400/15 text-white shadow-[0_0_0_1px_rgba(56,189,248,0.2)]"
                            : "border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:text-white"
                        } ${gestureControlsDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                      >
                        <p className="font-semibold text-sm leading-tight">{preset.label}</p>
                        <p className="text-white/50 text-[0.6875rem] leading-snug">{preset.note}</p>
                        <p className="text-white/60 text-[0.6875rem] font-mono leading-snug">{formatInterval(preset.detectionInterval)} · {preset.triggerMinScore.toFixed(2)}</p>
                      </button>
                    )
                  })}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-white/60">
                    <span>Gesture check interval</span>
                    <span className="font-mono text-white/70">{formatInterval(detectionIntervalMs)}</span>
                  </div>
                  <input type="range" min="0" max="1200" step="60" value={detectionIntervalMs}
                    onChange={(e) => setDetectionInterval(Number(e.target.value))}
                    disabled={gestureControlsDisabled} className="w-full accent-sky-400 disabled:opacity-50 disabled:cursor-not-allowed" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-white/60">
                    <span>Trigger score drempel</span>
                    <span className="font-mono text-white/70">{triggerMinScore.toFixed(2)}</span>
                  </div>
                  <input type="range" min="0" max="1" step="0.01" value={triggerMinScore}
                    onChange={(e) => setTriggerScore(Number(e.target.value))}
                    disabled={gestureControlsDisabled} className="w-full accent-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed" />
                </div>

                {/* Scene presets */}
                <div className="pt-1 space-y-2">
                  <p className="text-white text-sm font-semibold">Opstelling</p>
                  <p className="text-white/50 text-xs">Past handen, detectie en tracking aan per situatie</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
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
                        className={`rounded-xl border px-3 py-2 text-left text-xs transition-all h-full flex flex-col gap-1 justify-between ${
                          active
                            ? "border-violet-400/60 bg-violet-400/15 text-white shadow-[0_0_0_1px_rgba(167,139,250,0.2)]"
                            : "border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:text-white"
                        } ${gestureControlsDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                      >
                        <p className="font-semibold text-sm leading-tight">{preset.label}</p>
                        <p className="text-white/50 text-[0.6875rem] leading-snug">{preset.note}</p>
                        <p className="text-white/60 text-[0.6875rem] font-mono leading-snug">{preset.numHands} handen · {preset.minDetectionConfidence.toFixed(2)}</p>
                      </button>
                    )
                  })}
                </div>
              </div>

              {debugEnabled && (
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[0.6875rem] text-white/50">
                  <span className="inline-flex items-center gap-1">
                    <span className="inline-block w-3 h-3 rounded-full border-2 border-emerald-400/80" />
                    <span>Groen: tracking elke frame</span>
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="inline-block w-3 h-3 rounded-full border-2 border-sky-400/80" />
                    <span>Blauw: tempo volgens gesture interval</span>
                  </span>
                </div>
              )}

              {/* Analytics */}
              <AnalyticsDashboard />
            </>
          )}

          <button
            onClick={() => { openAbout(); onClose() }}
            className="text-white/30 text-xs hover:text-white/50 transition-colors cursor-pointer text-center py-2"
          >
            Over deze app
          </button>
        </div>
      </div>
    </div>
  )
}