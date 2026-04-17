"use client"

import { useState, useCallback, useEffect, useRef } from "react"

const ANIM_MS = 250

/**
 * Reusable bottom drawer -- slides up from the bottom with a backdrop.
 * Closes on: backdrop tap, handle bar, Escape key.
 * Brutalist: solid black, hard borders, no blur.
 */
export function BottomDrawer({
  title,
  subtitle,
  onClose,
  children,
  fullHeight = false,
  closeOnSelect = false,
}) {
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
    const handler = (e) => {
      if (e.key === "Escape") handleClose()
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [handleClose])

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end"
      onClick={handleClose}
      role="presentation"
    >
      <div
        className="absolute inset-0 bg-black/70"
        style={{
          opacity: closing ? 0 : 1,
          transition: `opacity ${ANIM_MS}ms ease-out`,
        }}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={title || "Drawer"}
        className={`relative flex flex-col overflow-hidden rounded-none border-t border-white/20 bg-[#0a0a0a] px-5 pt-4 pb-6 ${fullHeight ? "max-h-[86dvh]" : "max-h-[70dvh]"}`}
        style={{
          animation: closing
            ? `slide-down ${ANIM_MS}ms ease-in forwards`
            : "slide-up 0.3s ease-out",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex flex-col items-center gap-3 pb-0">
          <button
            onClick={handleClose}
            className="shrink-0 cursor-pointer px-2 py-1"
            aria-label="Close"
          >
            <div
              className="mx-auto bg-white/30"
              style={{
                height: "0.125rem",
                width: "3rem",
              }}
            />
          </button>

          {title && (
            <div className="w-full text-center">
              <p className="text-sm font-bold tracking-[0.15em] uppercase text-white">{title}</p>
              {subtitle && <p className="mt-1 text-xs leading-5 text-white/40">{subtitle}</p>}
            </div>
          )}
        </div>

        <div
          className={
            fullHeight
              ? "min-h-0 flex-1 overflow-y-auto overscroll-contain touch-pan-y -mx-1 px-1"
              : ""
          }
          onClick={closeOnSelect ? handleClose : undefined}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
