"use client"

/**
 * Always-on gesture-system health readout. Doubles as "the booth sees you"
 * feedback and the live diagnostic that localizes worker/model failures.
 * Copy is Dutch, matching the rest of the booth UI.
 */
export function GestureDebugOverlay({ health }) {
  if (!health) return null
  const { ready, delegate, modelLoaded, activeNumHands, handCount, error } = health

  const statusColor = error ? "#f87171" : ready ? "#4ade80" : "#fbbf24"
  const statusLabel = error ? "Fout" : ready ? "Actief" : "Laden…"

  return (
    <div className="absolute top-3 left-3 z-40 pointer-events-none select-none">
      <div
        className="rounded-xl px-3 py-2 text-[11px] leading-tight font-mono text-white/90 backdrop-blur-md"
        style={{ background: "rgba(0,0,0,0.45)", border: "1px solid rgba(255,255,255,0.12)" }}
      >
        <div className="flex items-center gap-2 mb-1">
          <span style={{ width: 8, height: 8, borderRadius: 9999, background: statusColor }} />
          <span className="font-semibold">Handdetectie: {statusLabel}</span>
        </div>
        <div>Delegate: {delegate ?? "—"}</div>
        <div>Model: {modelLoaded ? "geladen" : "—"}</div>
        <div>Handen (max): {activeNumHands ?? "—"}</div>
        <div>Handen in beeld: {handCount}</div>
        {error && <div style={{ color: "#fca5a5" }}>{error}</div>}
      </div>
    </div>
  )
}
