"use client"

import { useCallback, useEffect, useRef, useState } from "react"
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

const CONN_LABEL = {
  connecting: "Verbinden…",
  connected: "Verbonden",
  reconnecting: "Herverbinden…",
  "error-config": "Niet geconfigureerd",
  "error-timeout": "Booth niet gevonden",
}
const NEEDS_RETRY = new Set(["reconnecting", "error-timeout"])
const BOOTH_STATE_LABEL = { camera: "Klaar", countdown: "Aftellen…", capturing: "Vastleggen…" }

export function AdminPanel({ remoteState, send, status, retry }) {
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const s = remoteState ?? {}
  const isConnected = status === "connected"
  const boothBusy = s.appState === "countdown" || s.appState === "capturing"
  const canCapture = isConnected && s.appState === "camera"
  const galleryIndex = s.galleryIndex ?? 0
  const galleryCount = s.galleryCount ?? 0

  const toggle = useCallback((key) => send({ t: "toggle", key }), [send])
  const debounceRef = useRef(null)
  useEffect(() => () => clearTimeout(debounceRef.current), [])
  const setValue = useCallback(
    (key, value) => {
      clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => send({ t: "set", key, value }), 80)
    },
    [send],
  )

  return (
    <div className="min-h-dvh bg-base text-ink">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-hairline bg-base/90 px-4 py-3 backdrop-blur-xl">
        <h1 className="text-base font-semibold text-gold">DAC Admin</h1>
        <div className="flex items-center gap-2">
          <span
            className={`h-2 w-2 rounded-full ${isConnected ? "animate-pulse bg-green-400" : "bg-ink-subtle"}`}
          />
          <span
            className={`text-xs font-medium ${isConnected ? "text-green-400" : "text-ink-muted"}`}
          >
            {CONN_LABEL[status] ?? "Verbroken"}
          </span>
          {NEEDS_RETRY.has(status) && (
            <button
              onClick={retry}
              className="ml-1 cursor-pointer rounded-full border border-hairline px-2 py-0.5 text-xs text-gold hover:bg-surface"
            >
              Opnieuw
            </button>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-2xl space-y-4 p-4 pb-20">
        {/* Primary: take a photo, reflecting the live booth state */}
        <div className="space-y-2 rounded-2xl border border-hairline bg-surface p-4">
          <SectionLabel
            title="Foto"
            description={isConnected ? `Booth: ${BOOTH_STATE_LABEL[s.appState] ?? "—"}` : "Niet verbonden"}
          />
          <button
            onClick={() => send({ t: "trigger" })}
            disabled={!canCapture}
            className="w-full cursor-pointer rounded-2xl bg-gold py-4 text-base font-semibold text-[#1b1407] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {boothBusy
              ? s.appState === "countdown"
                ? "⏳ Aftellen…"
                : "📸 Vastleggen…"
              : "📸 Foto nemen"}
          </button>
        </div>

        {/* Gallery — controls the lightbox shown on the booth screen */}
        <div className="space-y-3 rounded-2xl border border-hairline bg-surface p-4">
          <SectionLabel title="Gallerij" description="Bedien de gallerij op het booth-scherm" />
          {!s.galleryOpen ? (
            <AdminButton full onClick={() => send({ t: "gallery:open" })} disabled={!isConnected}>
              🖼 Gallerij openen
            </AdminButton>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <AdminButton
                  onClick={() => send({ t: "gallery:prev" })}
                  disabled={!isConnected || galleryIndex <= 0}
                  className="flex-1"
                >
                  ‹ Vorige
                </AdminButton>
                <span className="shrink-0 px-1 text-sm text-ink-muted">
                  {galleryCount > 0 ? `Foto ${galleryIndex + 1} / ${galleryCount}` : "Geen foto's"}
                </span>
                <AdminButton
                  onClick={() => send({ t: "gallery:next" })}
                  disabled={!isConnected || galleryCount === 0 || galleryIndex >= galleryCount - 1}
                  className="flex-1"
                >
                  Volgende ›
                </AdminButton>
              </div>
              <AdminButton full onClick={() => send({ t: "gallery:close" })} disabled={!isConnected}>
                ✕ Gallerij sluiten
              </AdminButton>
            </div>
          )}
        </div>

        {/* Quick toggles */}
        <div className="space-y-3 rounded-2xl border border-hairline bg-surface p-4">
          <SectionLabel title="Snelle instellingen" description="" />
          <ToggleRow
            title="Flits"
            description="Schermflits bij vastleggen"
            checked={!!s.flashEnabled}
            disabled={!isConnected}
            onClick={() => toggle("flashEnabled")}
          />
          <ToggleRow
            title="Strip mode"
            description="Meerdere foto's in een strip"
            checked={!!s.stripModeEnabled}
            disabled={!isConnected}
            onClick={() => toggle("stripModeEnabled")}
          />
          <ToggleRow
            title="Handgebaren"
            description="Automatisch afdrukken via gebaar"
            checked={!!s.gesturesEnabled}
            disabled={!isConnected}
            onClick={() => toggle("gesturesEnabled")}
          />
        </div>

        {/* Scene presets */}
        <div className="space-y-3 rounded-2xl border border-hairline bg-surface p-4">
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
                selected={
                  s.numHands === preset.numHands &&
                  s.minDetectionConfidence === preset.minDetectionConfidence &&
                  s.minPresenceConfidence === preset.minPresenceConfidence &&
                  s.minTrackingConfidence === preset.minTrackingConfidence
                }
                disabled={!isConnected}
                onClick={() => send({ t: "preset:scene", id: preset.id })}
              />
            ))}
          </div>
        </div>

        {/* Power presets */}
        <div className="space-y-3 rounded-2xl border border-hairline bg-surface p-4">
          <SectionLabel title="Energiepresets" description="Pas alle instellingen tegelijk aan" />
          <div className="grid grid-cols-2 gap-2">
            <AdminButton onClick={() => send({ t: "preset:highPower" })} disabled={!isConnected}>
              ⚡ High power
            </AdminButton>
            <AdminButton onClick={() => send({ t: "preset:lowPower" })} disabled={!isConnected}>
              🔋 Low power
            </AdminButton>
          </div>
        </div>

        {/* Advanced */}
        <div className="overflow-hidden rounded-2xl border border-hairline bg-surface">
          <button
            onClick={() => setAdvancedOpen((v) => !v)}
            className="flex w-full cursor-pointer items-center justify-between px-4 py-3.5 text-sm font-semibold text-ink transition-colors hover:bg-raised"
          >
            <span>Geavanceerd</span>
            <span className="text-xs text-ink-muted">{advancedOpen ? "▲" : "▼"}</span>
          </button>
          {advancedOpen && (
            <div className="space-y-5 border-t border-hairline p-4">
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

function AdminButton({ onClick, disabled, active, full, className = "", children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${full ? "w-full " : ""}${className} cursor-pointer rounded-xl border px-3 py-3.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        active
          ? "border-gold/50 bg-gold/15 text-gold-strong"
          : "border-hairline bg-raised text-ink hover:border-hairline-strong hover:bg-surface"
      }`}
    >
      {children}
    </button>
  )
}