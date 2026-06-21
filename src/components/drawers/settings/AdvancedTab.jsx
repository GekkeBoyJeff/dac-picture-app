"use client"

import { useMemo } from "react"
import { usePowerStatus } from "@/hooks/usePowerStatus"
import { useUiStore } from "@/stores/uiStore"
import { AnalyticsDashboard } from "../AnalyticsDashboard"
import {
  ChoiceButton,
  ChoiceCard,
  HelpBox,
  RangeControl,
  SectionLabel,
  ToggleRow,
} from "./settingsControls"
import {
  formatConfidence,
  formatInterval,
  gesturePresets,
  handOptions,
  scenePresets,
} from "./settingsPresets"

/** Power, tuning, debug and diagnostics. */
export function AdvancedTab() {
  const debugEnabled = useUiStore((s) => s.debugEnabled)
  const detectionIntervalMs = useUiStore((s) => s.detectionIntervalMs)
  const triggerMinScore = useUiStore((s) => s.triggerMinScore)
  const numHands = useUiStore((s) => s.numHands)
  const minDetectionConfidence = useUiStore((s) => s.minDetectionConfidence)
  const minPresenceConfidence = useUiStore((s) => s.minPresenceConfidence)
  const minTrackingConfidence = useUiStore((s) => s.minTrackingConfidence)
  const lowPowerOverride = useUiStore((s) => s.lowPowerOverride)
  const forceLowPower = useUiStore((s) => s.forceLowPower)
  const toggleDebug = useUiStore((s) => s.toggleDebug)
  const forceCaptureButton = useUiStore((s) => s.forceCaptureButton)
  const toggleForceCaptureButton = useUiStore((s) => s.toggleForceCaptureButton)
  const gestureHealthEnabled = useUiStore((s) => s.gestureHealthEnabled)
  const toggleGestureHealth = useUiStore((s) => s.toggleGestureHealth)
  const setNumHands = useUiStore((s) => s.setNumHands)
  const setMinDetectionConfidence = useUiStore((s) => s.setMinDetectionConfidence)
  const setMinPresenceConfidence = useUiStore((s) => s.setMinPresenceConfidence)
  const setMinTrackingConfidence = useUiStore((s) => s.setMinTrackingConfidence)
  const setDetectionInterval = useUiStore((s) => s.setDetectionInterval)
  const setTriggerScore = useUiStore((s) => s.setTriggerScore)
  const applyScenePreset = useUiStore((s) => s.applyScenePreset)
  const applyLowPowerPreset = useUiStore((s) => s.applyLowPowerPreset)
  const applyHighPowerPreset = useUiStore((s) => s.applyHighPowerPreset)
  const toggleLowPowerOverride = useUiStore((s) => s.toggleLowPowerOverride)

  const powerStatus = usePowerStatus()
  const isLowPower = powerStatus === "low"
  const lowPowerLocked = isLowPower && !lowPowerOverride
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
          className={`flex min-h-22 w-full cursor-pointer items-center justify-between gap-4 rounded-xl border px-4 py-4 text-left transition-all duration-200 ${
            isLowPower
              ? "border-warning/45 bg-warning/10"
              : "border-hairline bg-surface hover:border-hairline-strong"
          }`}
        >
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink">Raspberry Pi mode</p>
            <p className="mt-0.5 text-xs leading-5 text-ink-muted">
              {isLowPower
                ? "Aan: minimale belasting, camera blijft hoog"
                : "Uit: standaard instellingen voor reguliere pc's"}
            </p>
          </div>
          <span
            className={`shrink-0 rounded-full border px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.2em] ${
              isLowPower
                ? "border-warning/40 bg-warning/15 text-warning"
                : "border-hairline bg-raised text-ink-muted"
            }`}
          >
            {isLowPower ? "Aan" : "Uit"}
          </span>
        </button>

        {isLowPower && (
          <ToggleRow
            title="Low-power override"
            description={
              lowPowerOverride
                ? "Alle instellingen zijn ontgrendeld"
                : "Ontgrendel instellingen die geblokkeerd zijn door low-power modus"
            }
            checked={lowPowerOverride}
            onClick={toggleLowPowerOverride}
          />
        )}

        <ToggleRow
          title="Fotoknop tonen"
          description="Toon de fotoknop op het grote scherm (handmatige fallback)"
          checked={forceCaptureButton}
          onClick={toggleForceCaptureButton}
        />
        <ToggleRow
          title="Handdetectie-info"
          description="Toon de detectie-status linksboven (diagnostiek)"
          checked={gestureHealthEnabled}
          onClick={toggleGestureHealth}
        />
        <ToggleRow
          title="Debug"
          description="Forceer handdetectie aan + extra diagnostiek"
          checked={debugEnabled}
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
            const selected =
              numHands === preset.numHands &&
              minDetectionConfidence === preset.minDetectionConfidence &&
              minPresenceConfidence === preset.minPresenceConfidence &&
              minTrackingConfidence === preset.minTrackingConfidence

            return (
              <ChoiceCard
                key={preset.id}
                selected={selected}
                disabled={gestureControlsDisabled}
                onClick={() => applyScenePreset(preset)}
                title={preset.label}
                note={preset.note}
                meta={`${preset.numHands} handen · ${preset.minDetectionConfidence.toFixed(2)}`}
              />
            )
          })}
        </div>

        <div className="space-y-4 rounded-xl border border-hairline bg-surface p-4">
          <div>
            <p className="text-sm font-semibold text-ink">Personaliseer opstelling</p>
            <p className="text-xs text-ink-muted">
              Pas het aantal handen en confidence-waarden handmatig aan.
            </p>
          </div>

          <HelpBox>
            <p>Detectie = nieuwe hand oppikken</p>
            <p className="mt-1">Presence = hand blijft aanwezig</p>
            <p className="mt-1">Tracking = beweging stabiel volgen</p>
          </HelpBox>

          <div className="grid grid-cols-3 gap-2">
            {handOptions.map((option) => (
              <ChoiceButton
                key={option}
                selected={numHands === option}
                disabled={gestureControlsDisabled}
                onClick={() => setNumHands(option)}
              >
                {option} handen
              </ChoiceButton>
            ))}
          </div>

          <RangeControl
            label="Detectie confidence"
            value={minDetectionConfidence}
            min={0.2}
            max={0.9}
            step={0.01}
            onChange={setMinDetectionConfidence}
            disabled={gestureControlsDisabled}
            formatValue={formatConfidence}
          />
          <RangeControl
            label="Presence confidence"
            value={minPresenceConfidence}
            min={0.2}
            max={0.9}
            step={0.01}
            onChange={setMinPresenceConfidence}
            disabled={gestureControlsDisabled}
            formatValue={formatConfidence}
          />
          <RangeControl
            label="Tracking confidence"
            value={minTrackingConfidence}
            min={0.2}
            max={0.9}
            step={0.01}
            onChange={setMinTrackingConfidence}
            disabled={gestureControlsDisabled}
            formatValue={formatConfidence}
          />
        </div>
      </section>

      <section className="space-y-3">
        <SectionLabel title="Gebaren" description="Snelle presets met duidelijke rangschikking." />

        <div className="space-y-4 rounded-xl border border-hairline bg-surface p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-ink">Gebaren-tempo</p>
              <p className="text-xs text-ink-muted">
                Realtime volgt elke frame, rustiger spaart CPU.
              </p>
            </div>
            <span className="rounded-full border border-hairline bg-raised px-2.5 py-1 font-mono text-xs text-ink">
              {formatInterval(detectionIntervalMs)}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {gesturePresets.map((preset) => (
              <ChoiceCard
                key={preset.label}
                selected={activePreset?.label === preset.label}
                disabled={gestureControlsDisabled}
                onClick={() => {
                  setDetectionInterval(preset.detectionInterval)
                  setTriggerScore(preset.triggerMinScore)
                }}
                title={preset.label}
                note={preset.note}
                meta={`${formatInterval(preset.detectionInterval)} · ${preset.triggerMinScore.toFixed(2)}`}
              />
            ))}
          </div>

          <RangeControl
            label="Gesture check interval"
            value={detectionIntervalMs}
            min={0}
            max={1200}
            step={60}
            onChange={setDetectionInterval}
            disabled={gestureControlsDisabled}
            formatValue={formatInterval}
          />
          <RangeControl
            label="Trigger score drempel"
            value={triggerMinScore}
            min={0}
            max={1}
            step={0.01}
            onChange={setTriggerScore}
            disabled={gestureControlsDisabled}
            formatValue={(v) => v.toFixed(2)}
          />
        </div>
      </section>

      <section className="space-y-3">
        <SectionLabel title="Informatie" description="Technische details en diagnostiek." />

        {debugEnabled && (
          <HelpBox>
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block h-3 w-3 rounded-full border-2 border-gold/80" />
                <span>Volgt elke frame</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block h-3 w-3 rounded-full border-2 border-sky-400/80" />
                <span>Volgt het gebaren-tempo</span>
              </span>
            </div>
          </HelpBox>
        )}

        <div className="overflow-hidden rounded-2xl border border-hairline bg-surface">
          <AnalyticsDashboard />
        </div>
      </section>
    </>
  )
}