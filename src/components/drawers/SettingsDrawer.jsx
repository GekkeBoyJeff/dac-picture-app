"use client"

import { useEffect, useMemo, useState } from "react"
import { CloseIcon, InfoIcon, SettingsIcon } from "@/components/ui/icons"
import {
  drawerButtonBaseClass,
  drawerSectionHelpClass,
  drawerSectionLabelClass,
} from "@/components/ui/drawerStyles"
import { usePowerStatus } from "@/hooks/usePowerStatus"
import { useUiStore } from "@/stores/uiStore"
import { AnalyticsDashboard } from "./AnalyticsDashboard"

const gesturePresets = [
  { label: "Realtime", detectionInterval: 0, triggerMinScore: 0.25, note: "Max snelheid, meer CPU" },
  { label: "Gebalanceerd", detectionInterval: 120, triggerMinScore: 0.35, note: "Standaard" },
  { label: "Spaarstand", detectionInterval: 400, triggerMinScore: 0.5, note: "Rustiger voor batterij" },
]

const scenePresets = [
  { id: "convention", label: "Conventie", note: "Drukke omgeving", numHands: 8, minDetectionConfidence: 0.4, minPresenceConfidence: 0.4, minTrackingConfidence: 0.4 },
  { id: "booth", label: "Photobooth", note: "Vaste camera", numHands: 4, minDetectionConfidence: 0.5, minPresenceConfidence: 0.5, minTrackingConfidence: 0.5 },
  { id: "mobile", label: "Mobiel", note: "Telefoon of tablet", numHands: 2, minDetectionConfidence: 0.6, minPresenceConfidence: 0.6, minTrackingConfidence: 0.5 },
  { id: "lowpower", label: "Zuinig", note: "Raspberry Pi", numHands: 2, minDetectionConfidence: 0.65, minPresenceConfidence: 0.65, minTrackingConfidence: 0.6 },
]

const holdPresets = [
  { label: "0.5s", value: 500 },
  { label: "1s", value: 1000 },
  { label: "1.5s", value: 1500 },
  { label: "2s", value: 2000 },
  { label: "3s", value: 3000 },
]

const formatInterval = (ms) => (ms <= 0 ? "Realtime (0ms)" : `${ms}ms`)
const formatConfidence = (value) => Number(value).toFixed(2)

const DRAWER_HEADER_HEIGHT = 92
const TAB_HEIGHT = 52
const CARD_RADIUS = "rounded-xl"
const INNER_RADIUS = "rounded-lg"
const drawerCard = `${CARD_RADIUS} border border-white/10 bg-white/[0.04] shadow-[0_1px_0_rgba(255,255,255,0.03)_inset]`
const rowBase = `w-full ${CARD_RADIUS} border px-4 py-4 text-left ${drawerButtonBaseClass}`

const tabs = [
  { id: "basis", label: "Basis", description: "Dagelijkse bediening" },
  { id: "advanced", label: "Geavanceerd", description: "Power en tuning" },
]

function SectionLabel({ title, description }) {
  return (
    <div className="space-y-1">
      <p className={drawerSectionLabelClass}>{title}</p>
      <p className={drawerSectionHelpClass}>{description}</p>
    </div>
  )
}

function ToggleRow({ title, description, active, disabled = false, onClick, activeTone = "sky" }) {
  const activeStyles = {
    amber: "border-amber-400/45 bg-amber-400/10 text-white shadow-[0_0_0_1px_rgba(245,158,11,0.18)]",
    sky: "border-sky-400/45 bg-sky-400/10 text-white shadow-[0_0_0_1px_rgba(56,189,248,0.18)]",
    emerald: "border-emerald-400/45 bg-emerald-400/10 text-white shadow-[0_0_0_1px_rgba(16,185,129,0.16)]",
    violet: "border-violet-400/45 bg-violet-400/10 text-white shadow-[0_0_0_1px_rgba(167,139,250,0.16)]",
  }

  const inactiveStyles = "border-white/10 bg-white/5 text-white/75 hover:border-white/20 hover:bg-white/[0.07]"
  const dotStyles = {
    amber: active ? "bg-amber-300 shadow-[0_0_0_4px_rgba(251,191,36,0.12)]" : "bg-white/20",
    sky: active ? "bg-sky-300 shadow-[0_0_0_4px_rgba(56,189,248,0.12)]" : "bg-white/20",
    emerald: active ? "bg-emerald-300 shadow-[0_0_0_4px_rgba(16,185,129,0.12)]" : "bg-white/20",
    violet: active ? "bg-violet-300 shadow-[0_0_0_4px_rgba(167,139,250,0.12)]" : "bg-white/20",
  }
  const statusStyles = {
    amber: active ? "border-amber-300/40 bg-amber-300/15 text-amber-50" : "border-white/10 bg-white/5 text-white/50",
    sky: active ? "border-sky-300/40 bg-sky-300/15 text-sky-50" : "border-white/10 bg-white/5 text-white/50",
    emerald: active ? "border-emerald-300/40 bg-emerald-300/15 text-emerald-50" : "border-white/10 bg-white/5 text-white/50",
    violet: active ? "border-violet-300/40 bg-violet-300/15 text-violet-50" : "border-white/10 bg-white/5 text-white/50",
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={`${rowBase} relative min-h-[4.8rem] flex items-center justify-between gap-4 overflow-hidden ${drawerCard} ${disabled ? "opacity-55 cursor-not-allowed" : "cursor-pointer"} ${active ? activeStyles[activeTone] : inactiveStyles}`}
    >
      <span className={`relative h-2.5 w-2.5 shrink-0 rounded-full ${dotStyles[activeTone]}`} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="mt-0.5 text-xs leading-5 text-white/55">{description}</p>
      </div>
      <span className={`shrink-0 rounded-full border px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.2em] ${statusStyles[activeTone]}`}>
        {active ? "Aan" : "Uit"}
      </span>
    </button>
  )
}

function StatPill({ label, value, tone = "white" }) {
  const tones = {
    default: "border-white/10 bg-white/5 text-white/80",
    sky: "border-sky-400/35 bg-sky-400/10 text-sky-50 shadow-[0_0_0_1px_rgba(56,189,248,0.08)]",
  }

  return (
    <div className={`rounded-lg border px-3 py-2.5 ${tones[tone]}`}>
      <p className={`text-[0.65rem] uppercase tracking-[0.18em] ${tone === "default" ? "text-white/45" : "text-white/60"}`}>{label}</p>
      <p className={`mt-1 text-sm font-semibold ${tone === "default" ? "text-white" : "text-white"}`}>{value}</p>
    </div>
  )
}

function TopAction({ label, description, onClick, icon: Icon }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${drawerButtonBaseClass} ${drawerCard} flex min-h-15 w-full cursor-pointer items-center justify-between gap-3 px-4 py-3 text-left hover:border-white/20 hover:bg-white/7`}
    >
      <div className="min-w-0">
        <p className="text-[0.65rem] uppercase tracking-[0.2em] text-white/45">{label}</p>
        <p className="mt-0.5 text-sm font-semibold text-white">{description}</p>
      </div>
      {Icon && <Icon className="h-4 w-4 shrink-0 text-white/55" />}
    </button>
  )
}

function RangeControl({ label, value, min, max, step, onChange, formatValue = (v) => v }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-white/60">
        <span>{label}</span>
        <span className="font-mono text-white/80">{formatValue(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full cursor-pointer accent-sky-400"
      />
    </div>
  )
}

export function SettingsDrawer({ isOpen, onClose, openAbout }) {
  const [activeTab, setActiveTab] = useState("basis")

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
  const setNumHands = useUiStore((s) => s.setNumHands)
  const setMinDetectionConfidence = useUiStore((s) => s.setMinDetectionConfidence)
  const setMinPresenceConfidence = useUiStore((s) => s.setMinPresenceConfidence)
  const setMinTrackingConfidence = useUiStore((s) => s.setMinTrackingConfidence)
  const setDetectionInterval = useUiStore((s) => s.setDetectionInterval)
  const setTriggerScore = useUiStore((s) => s.setTriggerScore)
  const setGestureHold = useUiStore((s) => s.setGestureHold)
  const applyScenePreset = useUiStore((s) => s.applyScenePreset)
  const applyLowPowerPreset = useUiStore((s) => s.applyLowPowerPreset)
  const applyHighPowerPreset = useUiStore((s) => s.applyHighPowerPreset)
  const forceLowPower = useUiStore((s) => s.forceLowPower)
  const lowPowerOverride = useUiStore((s) => s.lowPowerOverride)
  const toggleLowPowerOverride = useUiStore((s) => s.toggleLowPowerOverride)

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

  const gestureControlsDisabled = lowPowerLocked

  const activePreset = useMemo(
    () => gesturePresets.find((preset) => preset.detectionInterval === detectionIntervalMs && preset.triggerMinScore === triggerMinScore),
    [detectionIntervalMs, triggerMinScore],
  )

  const currentPowerLabel = powerStatus === "low" ? "Low-power" : "Standard"
  const currentPowerTone = "sky"
  const handOptions = [2, 4, 6, 8, 10, 12]
  const settingsSummary = [
    { label: "Power", value: currentPowerLabel, tone: "sky" },
    { label: "Flash", value: flashEnabled ? "Aan" : "Uit", tone: flashEnabled ? "sky" : "default" },
    { label: "Gestures", value: gesturesEnabled ? "Aan" : "Uit", tone: gesturesEnabled ? "sky" : "default" },
  ]

  return (
    <div className={`fixed inset-0 z-50 transition-opacity duration-200 ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Instellingen"
        className={`absolute left-0 top-0 flex h-dvh w-full max-w-lg flex-col overflow-hidden border-r border-white/10 bg-black/92 shadow-2xl transition-transform duration-300 md:translate-x-0 md:translate-y-0 max-md:bottom-0 max-md:top-auto max-md:right-0 max-md:h-[92dvh] max-md:max-w-none max-md:border-r-0 max-md:border-t max-md:rounded-t-4xl ${
          isOpen ? "translate-x-0 translate-y-0" : "md:-translate-x-full max-md:translate-y-full"
        }`}
      >
        <div className="relative border-b border-white/10 px-5 py-4" style={{ minHeight: DRAWER_HEADER_HEIGHT }}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(230,193,137,0.12),transparent_40%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent)]" />
          <div className="relative flex items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xl font-semibold text-white">Instellingen</p>
              <p className="max-w-[20rem] text-sm text-white/45">Een vaste, rustige configuratie zonder springende layout.</p>
            </div>
            <button onClick={onClose} className="cursor-pointer rounded-full border border-white/10 bg-white/5 p-2.5 transition-colors hover:bg-white/10" aria-label="Sluiten">
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

          <div className="relative mt-4 grid grid-cols-2 gap-1.5 rounded-xl border border-white/10 bg-white/5 p-1.5" style={{ minHeight: TAB_HEIGHT }}>
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
                  <span className="block text-[0.7rem] leading-tight text-white/45">{tab.description}</span>
                </button>
              )
            })}
          </div>

          <div className="relative mt-4">
            <TopAction label="Over de app" description="Info en versie" onClick={() => { openAbout(); onClose() }} icon={InfoIcon} />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 touch-pan-y">
          <div className="min-h-168 space-y-5 lg:min-h-152">
            {activeTab === "basis" ? (
              <>
                <section className="space-y-3">
                  <SectionLabel title="Snel" description="De meest gebruikte toggles staan hier als strakke, vaste rows." />

                  <ToggleRow
                    title="Flits"
                    description="Schermflits bij het nemen van een foto"
                    active={flashEnabled}
                    activeTone="amber"
                    onClick={toggleFlash}
                  />

                  <ToggleRow
                    title="Handgebaren"
                    description={lowPowerLocked ? "Uitgeschakeld in low-power modus" : "Automatisch afdrukken met victory-gebaar"}
                    active={gesturesEnabled && !lowPowerLocked}
                    disabled={lowPowerLocked}
                    activeTone="sky"
                    onClick={lowPowerLocked ? undefined : toggleGestures}
                  />

                  <div className={`${drawerCard} p-4 space-y-4`}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-white">Vasthouden voor trigger</p>
                        <p className="text-xs text-white/55">Hoe lang je het gebaar moet vasthouden</p>
                      </div>
                      <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-mono text-white/80">{(gestureHoldMs / 1000).toFixed(1)}s</span>
                    </div>

                    <div className="grid grid-cols-5 gap-2">
                      {holdPresets.map((preset) => {
                        const active = gestureHoldMs === preset.value
                        return (
                          <button
                            key={preset.value}
                            type="button"
                            onClick={() => setGestureHold(preset.value)}
                            className={`${INNER_RADIUS} cursor-pointer border px-2 py-3 text-xs font-medium transition-all ${
                              active
                                ? "border-sky-400/55 bg-sky-400/15 text-white"
                                : "border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:bg-white/[0.07]"
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
                    onClick={() => setActiveTab("advanced")}
                    className={`${drawerCard} w-full cursor-pointer px-4 py-4 text-left transition-all hover:border-white/20 hover:bg-white/[0.07]`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-white">Naar geavanceerd</p>
                        <p className="mt-0.5 text-xs text-white/55">Power, debug en tuning openen in een aparte, stabiele view.</p>
                      </div>
                      <SettingsIcon className="h-5 w-5 text-white/35" />
                    </div>
                  </button>
                </section>
              </>
            ) : (
              <>
                <section className="space-y-3">
                  <SectionLabel title="Power" description="Raspberry Pi of standaard laptop/pc. Deze keuze beïnvloedt de lichte of zware configuratie." />

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
                      <p className="mt-0.5 text-xs leading-5 text-white/55">{powerStatus === "low" ? "Aan: minimale belasting, camera blijft hoog" : "Uit: standaard instellingen voor reguliere pc's"}</p>
                    </div>
                    <span className={`shrink-0 rounded-full border px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.2em] ${powerStatus === "low" ? "border-amber-300/40 bg-amber-300/15 text-amber-50" : "border-emerald-300/40 bg-emerald-300/15 text-emerald-50"}`}>
                      {powerStatus === "low" ? "Aan" : "Uit"}
                    </span>
                  </button>

                  {powerStatus === "low" && (
                    <ToggleRow
                      title="Low-power override"
                      description={lowPowerOverride ? "Alle instellingen zijn ontgrendeld" : "Ontgrendel instellingen die geblokkeerd zijn door low-power modus"}
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
                  <SectionLabel title="Opstelling" description="Pas handen, detectie en tracking aan per situatie." />

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
                          <p className="font-mono leading-snug text-white/60">{preset.numHands} handen · {preset.minDetectionConfidence.toFixed(2)}</p>
                        </button>
                      )
                    })}
                  </div>

                  <div className={`${drawerCard} p-4 space-y-4`}>
                    <div>
                      <div>
                        <p className="text-sm font-semibold text-white">Personaliseer opstelling</p>
                        <p className="text-xs text-white/55">Pas het aantal handen en confidence-waarden handmatig aan.</p>
                      </div>
                    </div>

                    <div className={`${INNER_RADIUS} border border-white/10 bg-white/3 px-3 py-2.5 text-xs text-white/55`}>
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
                    />

                    <RangeControl
                      label="Presence confidence"
                      value={minPresenceConfidence}
                      min={0.2}
                      max={0.9}
                      step={0.01}
                      onChange={setMinPresenceConfidence}
                      formatValue={formatConfidence}
                    />

                    <RangeControl
                      label="Tracking confidence"
                      value={minTrackingConfidence}
                      min={0.2}
                      max={0.9}
                      step={0.01}
                      onChange={setMinTrackingConfidence}
                      formatValue={formatConfidence}
                    />
                  </div>
                </section>

                <section className="space-y-3">
                  <SectionLabel title="Gebaren" description="Snelle, vaste presets met duidelijke rangschikking. Geen springende panelen." />

                  <div className={`${drawerCard} p-4 space-y-4`}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-white">Gebaren-tempo</p>
                        <p className="text-xs text-white/55">Groen volgt elke frame, blauw volgt dit tempo.</p>
                      </div>
                      <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-mono text-white/80">{formatInterval(detectionIntervalMs)}</span>
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
                            <p className="font-mono leading-snug text-white/60">{formatInterval(preset.detectionInterval)} · {preset.triggerMinScore.toFixed(2)}</p>
                          </button>
                        )
                      })}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-white/60">
                        <span>Gesture check interval</span>
                        <span className="font-mono text-white/80">{formatInterval(detectionIntervalMs)}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1200"
                        step="60"
                        value={detectionIntervalMs}
                        onChange={(event) => setDetectionInterval(Number(event.target.value))}
                        disabled={gestureControlsDisabled}
                        className="w-full accent-sky-400 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>

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
                  <SectionLabel title="Informatie" description="Technische details en diagnostiek, zonder de rest van de layout te verstoren." />

                  {debugEnabled && (
                    <div className={`${CARD_RADIUS} border border-white/10 bg-white/3 px-4 py-3 text-[0.6875rem] text-white/55`}>
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
                    <AnalyticsDashboard />
                  </div>
                </section>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}