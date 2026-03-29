"use client"

import { useState, useEffect } from "react"

const DISMISS_MS = { success: 2000, queued: 2500, error: 3000 }

/**
 * Stacked status pills — bottom-right corner.
 * Each upload gets its own pill that auto-dismisses.
 */
export function UploadStatus({ entries, onDismiss }) {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col-reverse gap-2 pointer-events-none">
      {entries.map((entry) => (
        <StatusPill key={entry.id} id={entry.id} status={entry.status} label={entry.label} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

function StatusPill({ id, status, label, onDismiss }) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    if (status === "uploading" || status === "loading") return
    const ms = DISMISS_MS[status] || 2000
    const t = setTimeout(() => setVisible(false), ms)
    return () => clearTimeout(t)
  }, [status])

  // Remove from parent state after fade-out transition completes
  useEffect(() => {
    if (visible) return
    const t = setTimeout(() => onDismiss?.(id), 350)
    return () => clearTimeout(t)
  }, [visible, id, onDismiss])

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center gap-2.5 px-3.5 py-2 rounded-full transition-all duration-300 ease-in-out"
      style={{
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(0.5rem)",
        border: "0.0625rem solid rgba(255,255,255,0.08)",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(0.5rem)",
      }}
    >
      {(status === "loading" || status === "uploading") && (
        <>
          <div className="w-4 h-4 rounded-full border-2 border-white/10 border-t-white/60 animate-spin" />
          <span className="text-white/70 text-xs font-medium">{label || (status === "loading" ? "Laden…" : "Verzenden…")}</span>
        </>
      )}
      {status === "success" && (
        <>
          <svg className="w-4 h-4 text-emerald-400" viewBox="0 0 16 16" fill="none">
            <path d="M3 8.5l3.5 3.5 6.5-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-white/70 text-xs font-medium">{label || "Verzonden"}</span>
        </>
      )}
      {status === "queued" && (
        <>
          <svg className="w-4 h-4 text-amber-400" viewBox="0 0 16 16" fill="none">
            <path d="M8 3v5l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          <span className="text-white/70 text-xs font-medium">In wachtrij</span>
        </>
      )}
      {status === "error" && (
        <>
          <svg className="w-4 h-4 text-red-400" viewBox="0 0 16 16" fill="none">
            <path d="M8 5v4M8 11h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          <span className="text-white/70 text-xs font-medium">Mislukt</span>
        </>
      )}
    </div>
  )
}

/** Create a new upload entry */
export function createUploadEntry() {
  return { id: crypto.randomUUID(), status: "uploading" }
}
