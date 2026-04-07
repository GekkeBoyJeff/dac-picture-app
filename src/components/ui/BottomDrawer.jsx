"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { drawerShellClass, drawerHeaderClass } from "@/components/ui/drawerStyles"

const ANIM_MS = 250

/**
 * Reusable bottom drawer — slides up from the bottom with a backdrop.
 * Closes on: backdrop tap, handle bar, Escape key.
 */
export function BottomDrawer({
  title,
  subtitle,
  onClose,
  children,
  fullHeight = false,
  closeOnSelect = false,
  showHeaderDivider = false,
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
    const handler = (e) => { if (e.key === "Escape") handleClose() }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [handleClose])

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" onClick={handleClose} role="presentation">
      <div
        className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
        style={{ opacity: closing ? 0 : 1, transition: `opacity ${ANIM_MS}ms ease-out` }}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={title || "Drawer"}
        className={`relative flex max-h-[86dvh] flex-col overflow-hidden border-t border-white/10 px-5 pt-4 pb-6 ${drawerShellClass} rounded-b-none rounded-t-4xl ${fullHeight ? "max-h-[86dvh]" : ""}`}
        style={{
          animation: closing
            ? `slide-down ${ANIM_MS}ms ease-in forwards`
            : "slide-up 0.3s ease-out",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`mb-4 flex flex-col items-center gap-3 ${showHeaderDivider ? drawerHeaderClass : "border-0"} border-0 pb-0`}>
          <button onClick={handleClose} className="shrink-0 cursor-pointer rounded-full px-2 py-1" aria-label="Close">
            <div className="mx-auto h-1.5 w-12 rounded-full bg-white/25" />
          </button>

          {title && (
            <div className="w-full text-center">
              <p className="text-sm font-semibold tracking-wide text-white">{title}</p>
              {subtitle && <p className="mt-1 text-xs leading-5 text-white/45">{subtitle}</p>}
            </div>
          )}
        </div>

        <div
          className={fullHeight ? "min-h-0 flex-1 overflow-y-auto overscroll-contain touch-pan-y -mx-1 px-1" : ""}
          onClick={closeOnSelect ? handleClose : undefined}
        >
          {children}
        </div>
      </div>
    </div>
  )
}