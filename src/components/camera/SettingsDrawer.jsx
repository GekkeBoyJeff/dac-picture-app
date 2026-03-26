/* eslint-disable eol-last */
"use client"

import { useEffect, useMemo } from "react"
import { CloseIcon } from "../icons"

const gesturePresets = [
  { label: "Realtime", detectionInterval: 0, triggerMinScore: 0.25, note: "Max snelheid, meer CPU" },
  { label: "Gebalanceerd", detectionInterval: 120, triggerMinScore: 0.35, note: "Standaard" },
  { label: "Spaarstand", detectionInterval: 400, triggerMinScore: 0.5, note: "Rustiger voor batterij" },
]

const formatInterval = (ms) => (ms <= 0 ? "Realtime (0ms)" : `${ms}ms`)

const DRAWER_MAX_HEIGHT = "min(90dvh, 720px)"
const DRAWER_HEADER_HEIGHT = 72

const SettingsDrawer = ({
  isOpen,
  onClose,
  debugEnabled,
  onToggleDebug,
  gesturesEnabled,
  onToggleGestures,
  detectionIntervalMs,
  onChangeDetectionInterval,
  triggerMinScore,
  onChangeTriggerMinScore,
  openAbout,
}) => {
  useEffect(() => {
    if (!isOpen) return
    const handler = (e) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [isOpen, onClose])

  const controlsDisabled = !gesturesEnabled

  const activePreset = useMemo(() => {
    return gesturePresets.find(
      (preset) => preset.detectionInterval === detectionIntervalMs && preset.triggerMinScore === triggerMinScore
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
        className={`absolute bottom-0 left-0 right-0 mx-auto w-full max-w-480 rounded-t-2xl bg-black/90 border border-white/10 shadow-2xl transition-transform duration-250 overflow-hidden flex flex-col ${
          isOpen ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ maxHeight: DRAWER_MAX_HEIGHT }}
      >
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between sticky top-0 bg-black/90 z-10" style={{ minHeight: DRAWER_HEADER_HEIGHT }}>
          <div>
            <p className="text-white font-semibold text-lg">Instellingen</p>
            <p className="text-white/50 text-sm">Fijnmazige controle voor gestures & debug</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer" aria-label="Sluiten">
            <CloseIcon className="w-5 h-5 text-white/70" />
          </button>
        </div>

        <div className="p-5 flex-1 flex flex-col gap-4 overflow-y-auto pb-8" style={{ maxHeight: `calc(${DRAWER_MAX_HEIGHT} - ${DRAWER_HEADER_HEIGHT}px)` }}>
          <div className="grid grid-cols-2 py-4 max-sm:grid-cols-2 gap-3 [grid-auto-rows:1fr]">
            <button
              onClick={onToggleDebug}
              className={`rounded-xl border transition-all text-left px-4 py-3 h-full ${
                debugEnabled
                  ? "border-emerald-400/50 bg-emerald-400/10 shadow-[0_0_0_1px_rgba(16,185,129,0.25)] text-white"
                  : "border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:text-white"
              }`}
            >
              <p className="font-medium text-sm">Debug</p>
              <p className="text-xs text-white/60">Groene/Blauwe kaders + gesture status</p>
            </button>
            <button
              onClick={onToggleGestures}
              className={`rounded-xl border transition-all text-left px-4 py-3 h-full ${
                gesturesEnabled
                  ? "border-sky-400/50 bg-sky-400/10 shadow-[0_0_0_1px_rgba(56,189,248,0.25)] text-white"
                  : "border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:text-white"
              }`}
            >
              <p className="font-medium text-sm">Handgebaren</p>
              <p className="text-xs text-white/60">Automatisch afdrukken met victory</p>
            </button>
          </div>

          <div className={`rounded-2xl border border-white/10 bg-white/5 p-4 space-y-4 ${controlsDisabled ? "opacity-60" : ""}`}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-white text-sm font-semibold">Gebaren-tempo</p>
                <p className="text-white/50 text-xs">Groen volgt elke frame, blauw volgt dit tempo.</p>
              </div>
              <span className="text-white/70 text-xs font-mono">{formatInterval(detectionIntervalMs)}</span>
            </div>
            <div className="grid grid-cols-3 max-sm:grid-cols-2 gap-3 [grid-auto-rows:1fr]">
              {gesturePresets.map((preset) => {
                const active = activePreset?.label === preset.label
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      onChangeDetectionInterval(preset.detectionInterval)
                      onChangeTriggerMinScore(preset.triggerMinScore)
                    }}
                    disabled={controlsDisabled}
                    className={`rounded-xl border px-3 py-2 text-left text-xs transition-all h-full flex flex-col gap-1 justify-between ${
                      active
                        ? "border-sky-400/60 bg-sky-400/15 text-white shadow-[0_0_0_1px_rgba(56,189,248,0.2)]"
                        : "border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:text-white"
                    } ${controlsDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    <p className="font-semibold text-sm leading-tight">{preset.label}</p>
                    <p className="text-white/50 text-[11px] leading-snug">{preset.note}</p>
                    <p className="text-white/60 text-[11px] font-mono leading-snug">{formatInterval(preset.detectionInterval)} · {preset.triggerMinScore.toFixed(2)}</p>
                  </button>
                )
              })}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-white/60">
                <span>Gesture check interval</span>
                <span className="font-mono text-white/70">{formatInterval(detectionIntervalMs)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1200"
                step="60"
                value={detectionIntervalMs}
                onChange={(e) => onChangeDetectionInterval(Number(e.target.value))}
                disabled={controlsDisabled}
                className="w-full accent-sky-400 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <p className="text-[11px] text-white/50">0ms = gesture-check elke frame; hoger spaart CPU en toont blauw minder vaak.</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-white/60">
                <span>Trigger score drempel</span>
                <span className="font-mono text-white/70">{triggerMinScore.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={triggerMinScore}
                onChange={(e) => onChangeTriggerMinScore(e.target.value)}
                disabled={controlsDisabled}
                className="w-full accent-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <p className="text-[11px] text-white/50">Lager = sneller vuren, hoger = voorzichtiger.</p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 flex items-center justify-between">
            <div>
              <p className="text-white text-sm font-semibold">Over deze app</p>
              <p className="text-white/50 text-xs">Credits, uitleg en changelog.</p>
            </div>
            <button
              onClick={() => {
                openAbout()
                onClose()
              }}
              className="px-4 py-2 rounded-lg bg-white/10 text-white text-sm font-medium hover:bg-white/15 transition-colors cursor-pointer"
            >
              Open
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[11px] text-white/50">
            <span className="inline-flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded-full border-2 border-emerald-400/80" />
              <span>Groen: tracking elke frame</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded-full border-2 border-sky-400/80" />
              <span>Blauw: tempo volgens gesture interval</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export { SettingsDrawer }
