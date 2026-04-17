"use client"

import { useState, useEffect } from "react"

const DISMISS_MS = { success: 2000, queued: 2500, error: 3000 }

/**
 * Stacked status pills -- bottom-right corner.
 * Each upload gets its own pill that auto-dismisses.
 */
export function UploadStatus({ entries, onDismiss }) {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col-reverse gap-2 pointer-events-none">
      {entries.map((entry) => (
        <StatusPill
          key={entry.id}
          id={entry.id}
          status={entry.status}
          label={entry.label}
          onDismiss={onDismiss}
        />
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

  useEffect(() => {
    if (visible) return
    const t = setTimeout(() => onDismiss?.(id), 350)
    return () => clearTimeout(t)
  }, [visible, id, onDismiss])

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center gap-2.5 rounded-none border border-white/10 bg-black px-3 py-2 font-mono text-sm transition-all duration-300 ease-in-out"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(0.5rem)",
      }}
    >
      {(status === "loading" || status === "uploading") && (
        <>
          <div className="w-4 h-4 rounded-none border-2 border-white/20 border-t-[#e6c189] animate-spin" />
          <span className="text-white/60 text-xs">
            {label || (status === "loading" ? "Laden..." : "Verzenden...")}
          </span>
        </>
      )}
      {status === "success" && (
        <>
          <svg className="w-4 h-4 text-[#e6c189]" viewBox="0 0 16 16" fill="none">
            <path
              d="M3 8.5l3.5 3.5 6.5-8"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="text-white/60 text-xs">{label || "Verzonden"}</span>
        </>
      )}
      {status === "queued" && (
        <>
          <svg className="w-4 h-4 text-[#e6c189]" viewBox="0 0 16 16" fill="none">
            <path
              d="M8 3v5l3 3"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          <span className="text-white/60 text-xs">In wachtrij</span>
        </>
      )}
      {status === "error" && (
        <>
          <svg className="w-4 h-4 text-white" viewBox="0 0 16 16" fill="none">
            <path d="M8 5v4M8 11h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          <span className="text-white/60 text-xs">Mislukt</span>
        </>
      )}
    </div>
  )
}

/** Create a new upload entry */
export function createUploadEntry() {
  return { id: crypto.randomUUID(), status: "uploading" }
}
