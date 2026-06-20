"use client"

import { useState, useCallback } from "react"
import { CameraPreview } from "./CameraPreview"
import {
  scenePresets,
  gesturePresets,
  holdPresets,
  handOptions,
  formatConfidence,
} from "@/components/drawers/settings/settingsPresets"
import {
  SectionLabel,
  ToggleRow,
  ChoiceButton,
  ChoiceCard,
  RangeControl,
} from "@/components/drawers/settings/settingsControls"

export function RemotePanel({ remoteState, send, stream, status }) {
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const s = remoteState ?? {}
  const isConnected = status === "connected"

  const toggle = useCallback((key) => send({ t: "toggle", key }), [send])
  const setValue = useCallback((key, value) => send({ t: "set", key, value }), [send])

  return (
    <div className="min-h-dvh bg-base text-ink">
      {/* Sticky header */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-hairline bg-base/90 px-4 py-3 backdrop-blur-xl">
        <h1 className="text-base font-semibold text-gold">DAC Remote</h1>
        <div className="flex items-center gap-2">
          <span
            className={`h-2 w-2 rounded-full animate-pulse ${
              isConnected ? "bg-green-400" : "bg-ink-subtle"
            }`}
          />
          <span
            className={`text-xs font-medium ${isConnected ? "text-green-400" : "text-ink-muted"}`}
          >
            {isConnected ? "Verbonden" : status === "connecting" ? "Verbinden…" : "Verbroken"}
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-2xl space-y-4 p-4 pb-20">
        {/* Live camera preview */}
        <CameraPreview
          stream={stream}
          className="aspect-video w-full rounded-2xl border border-hairline"
        />

        {/* Quick actions */}
        <div className="rounded-2xl border border-hairline bg-surface p-4 space-y-3">
          <SectionLabel title="Snelle acties" description="Directe bediening van de booth" />
          <div className="grid grid-cols-2 gap-2">
            <RemoteButton
              onClick={() => send({ t: "trigger" })}
              disabled={!isConnected || s.appState !== "camera"}
            >
              📸 Foto nemen
            </RemoteButton>
            <RemoteButton
              onClick={() => send({ t: "modal", name: "gallery" })}
              disabled={!isConnected}
            >
              🖼 Gallerij
            </RemoteButton>
            <RemoteButton
              onClick={() => toggle("stripModeEnabled")}
              active={!!s.stripModeEnabled}
              disabled={!isConnected}
            >
              {s.stripModeEnabled ? "📋 Strip: aan" : "📋 Strip: uit"}
            </RemoteButton>
            <RemoteButton
              onClick={() => toggle("flashEnabled")}
              active={!!s.flashEnabled}
              disabled={!isConnected}
            >
              {s.flashEnabled ? "⚡ Flits: aan" : "⚡ Flits: uit"}
            </RemoteButton>
          </div>
        </div>

        {/* Scene presets */}
        <div className="rounded-2xl border border-hairline bg-surface p-4 space-y-3">
          <SectionLabel
            title="Scène preset"
            description="Past detectie-instellingen aan voor de omgeving"
          />
          <div className="grid grid-cols-2 gap-2">
            {scenePresets.map((preset) => (
              <ChoiceCard
                key={preset.id}
                title={preset.label}
                note={preset.note}
                selected={false}
                disabled={!isConnected}
                onClick={() => send({ t: "preset:scene", id: preset.id })}
              />
            ))}
          </div>
        </div>

        {/* Toggles */}
        <div className="rounded-2xl border border-hairline bg-surface p-4 space-y-3">
          <SectionLabel title="Instellingen" description="" />
          <ToggleRow
            title="Handgebaren"
            description="Automatisch afdrukken via gebaar"
            checked={!!s.gesturesEnabled}
            disabled={!isConnected}
            onClick={() => toggle("gesturesEnabled")}
          />
          <ToggleRow
            title="Strip mode"
            description="Meerdere foto's in een strip"
            checked={!!s.stripModeEnabled}
            disabled={!isConnected}
            onClick={() => toggle("stripModeEnabled")}
          />
          <ToggleRow
            title="Flits"
            description="Schermflits bij vastleggen"
            checked={!!s.flashEnabled}
            disabled={!isConnected}
            onClick={() => toggle("flashEnabled")}
          />
          <ToggleRow
            title="Debug"
            description="Toon handherkenning overlay"
            checked={!!s.debugEnabled}
            disabled={!isConnected}
            onClick={() => toggle("debugEnabled")}
          />
          <ToggleRow
            title="Low-power modus"
            description="Zuiniger voor laptop / Raspberry Pi"
            checked={!!s.forceLowPower}
            disabled={!isConnected}
            onClick={() => toggle("forceLowPower")}
          />
        </div>

        {/* Power presets */}
        <div className="rounded-2xl border border-hairline bg-surface p-4 space-y-3">
          <SectionLabel title="Energiepresets" description="Pas alle instellingen tegelijk aan" />
          <div className="grid grid-cols-2 gap-2">
            <RemoteButton onClick={() => send({ t: "preset:highPower" })} disabled={!isConnected}>
              ⚡ High power
            </RemoteButton>
            <RemoteButton onClick={() => send({ t: "preset:lowPower" })} disabled={!isConnected}>
              🔋 Low power
            </RemoteButton>
          </div>
        </div>

        {/* Advanced (collapsible) */}
        <div className="rounded-2xl border border-hairline bg-surface overflow-hidden">
          <button
            onClick={() => setAdvancedOpen((v) => !v)}
            className="flex w-full cursor-pointer items-center justify-between px-4 py-3.5 text-sm font-semibold text-ink transition-colors hover:bg-raised"
          >
            <span>Geavanceerd</span>
            <span className="text-ink-muted text-xs">{advancedOpen ? "▲" : "▼"}</span>
          </button>

          {advancedOpen && (
            <div className="border-t border-hairline p-4 space-y-5">
              {/* Gesture preset */}
              <div className="space-y-2">
                <p className="text-[0.65rem] uppercase tracking-[0.2em] text-ink-dim">
                  Gesture preset
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {gesturePresets.map((p) => (
                    <ChoiceButton
                      key={p.label}
                      selected={
                        s.detectionIntervalMs === p.detectionInterval &&
                        s.triggerMinScore === p.triggerMinScore
                      }
                      disabled={!isConnected}
                      onClick={() =>
                        send({
                          t: "preset:gesture",
                          interval: p.detectionInterval,
                          score: p.triggerMinScore,
                        })
                      }
                    >
                      {p.label}
                    </ChoiceButton>
                  ))}
                </div>
              </div>

              {/* Hold tijd */}
              <div className="space-y-2">
                <p className="text-[0.65rem] uppercase tracking-[0.2em] text-ink-dim">
                  Vasthouden voor trigger
                </p>
                <div className="grid grid-cols-5 gap-2">
                  {holdPresets.map((p) => (
                    <ChoiceButton
                      key={p.value}
                      selected={s.gestureHoldMs === p.value}
                      disabled={!isConnected}
                      onClick={() => send({ t: "preset:hold", ms: p.value })}
                    >
                      {p.label}
                    </ChoiceButton>
                  ))}
                </div>
              </div>

              {/* Handen */}
              <div className="space-y-2">
                <p className="text-[0.65rem] uppercase tracking-[0.2em] text-ink-dim">
                  Max handen detecteren
                </p>
                <div className="flex flex-wrap gap-2">
                  {handOptions.map((n) => (
                    <ChoiceButton
                      key={n}
                      selected={s.numHands === n}
                      disabled={!isConnected}
                      onClick={() => setValue("numHands", n)}
                    >
                      {n}
                    </ChoiceButton>
                  ))}
                </div>
              </div>

              {/* Confidence sliders */}
              <RangeControl
                label="Detectie confidence"
                value={s.minDetectionConfidence ?? 0.4}
                min={0}
                max={1}
                step={0.05}
                disabled={!isConnected}
                formatValue={formatConfidence}
                onChange={(v) => setValue("minDetectionConfidence", v)}
              />
              <RangeControl
                label="Presence confidence"
                value={s.minPresenceConfidence ?? 0.4}
                min={0}
                max={1}
                step={0.05}
                disabled={!isConnected}
                formatValue={formatConfidence}
                onChange={(v) => setValue("minPresenceConfidence", v)}
              />
              <RangeControl
                label="Tracking confidence"
                value={s.minTrackingConfidence ?? 0.4}
                min={0}
                max={1}
                step={0.05}
                disabled={!isConnected}
                formatValue={formatConfidence}
                onChange={(v) => setValue("minTrackingConfidence", v)}
              />
              <RangeControl
                label="Trigger score"
                value={s.triggerMinScore ?? 0.25}
                min={0}
                max={1}
                step={0.05}
                disabled={!isConnected}
                formatValue={formatConfidence}
                onChange={(v) => setValue("triggerMinScore", v)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function RemoteButton({ onClick, disabled, active, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`cursor-pointer rounded-xl border px-3 py-3.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        active
          ? "border-gold/50 bg-gold/15 text-gold-strong"
          : "border-hairline bg-raised text-ink hover:border-hairline-strong hover:bg-surface"
      }`}
    >
      {children}
    </button>
  )
}