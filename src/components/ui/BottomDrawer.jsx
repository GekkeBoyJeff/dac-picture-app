"use client"

import { useState, useCallback, useEffect, useRef } from "react"

const ANIM_MS = 250

/**
 * Reusable bottom drawer — slides up from the bottom with a backdrop.
 * Closes on: backdrop tap, handle bar, Escape key.
 */
export function BottomDrawer({ title, onClose, children, fullHeight = false, closeOnSelect = false }) {
  const [closing, setClosing] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    return () => clearTimeout(timerRef.current)
  }, [])

  const handleClose = useCallback(() => {
    if (closing) return
    setClosing(true)
    timerRef.current = setTimeout(onClose, ANIM_MS)
  }, [onClose, closing])

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") handleClose() }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [handleClose])

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" onClick={handleClose} role="presentation">
      <div
        className="absolute inset-0 bg-black/50"
        style={{ opacity: closing ? 0 : 1, transition: `opacity ${ANIM_MS}ms ease-out` }}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={title || "Drawer"}
        className={`relative bg-black/90 backdrop-blur-2xl border-t border-white/10 rounded-t-3xl px-5 pt-4 pb-8 flex flex-col ${
          fullHeight ? "max-h-[85dvh]" : ""
        }`}
        style={{
          animation: closing
            ? `slide-down ${ANIM_MS}ms ease-in forwards`
            : "slide-up 0.3s ease-out",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={handleClose} className="w-full py-2 mb-2 shrink-0 cursor-pointer" aria-label="Close">
          <div className="w-10 h-1 rounded-full bg-white/30 mx-auto" />
        </button>

        {title && (
          <p className="text-white/50 text-xs uppercase tracking-widest mb-4 shrink-0">{title}</p>
        )}

        <div
          className={fullHeight ? "overflow-y-auto flex-1 -mx-1 px-1" : ""}
          onClick={closeOnSelect ? handleClose : undefined}
        >
          {children}
        </div>
      </div>
    </div>
  )
}