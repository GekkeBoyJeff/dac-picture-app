"use client"

import { useState, useEffect } from "react"
import { StatusPill } from "@/components/ui/StatusPill"
import { Spinner } from "@/components/ui/Spinner"

const DISMISS_MS = { success: 2000, queued: 2500, error: 3000 }

/**
 * Stacked status pills — bottom-right corner.
 * Each upload gets its own pill that auto-dismisses.
 */
export function UploadStatus({ entries, onDismiss }) {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col-reverse gap-2 pointer-events-none">
      {entries.map((entry) => (
        <UploadPill
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

const CheckIcon = (
  <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
    <path
      d="M3 8.5l3.5 3.5 6.5-8"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

const ClockIcon = (
  <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
    <path
      d="M8 3v5l3 3"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
  </svg>
)

const ErrorIcon = (
  <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
    <path d="M8 5v4M8 11h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
  </svg>
)

function UploadPill({ id, status, label, onDismiss }) {
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

  let tone = "neutral"
  let icon = null
  let text = label

  if (status === "loading" || status === "uploading") {
    tone = "neutral"
    icon = <Spinner className="w-4 h-4" />
    text = label || (status === "loading" ? "Laden…" : "Verzenden…")
  } else if (status === "success") {
    tone = "success"
    icon = CheckIcon
    text = label || "Verzonden"
  } else if (status === "queued") {
    tone = "warning"
    icon = ClockIcon
    text = "In wachtrij"
  } else if (status === "error") {
    tone = "danger"
    icon = ErrorIcon
    text = "Mislukt"
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="transition-all duration-300 ease-in-out"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(0.5rem)",
      }}
    >
      <StatusPill tone={tone} icon={icon}>
        {text}
      </StatusPill>
    </div>
  )
}

/** Create a new upload entry */
export function createUploadEntry() {
  return { id: crypto.randomUUID(), status: "uploading" }
}