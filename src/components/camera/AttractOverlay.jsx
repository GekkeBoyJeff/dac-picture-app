"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/styles/cn"
import { useIsTouch } from "@/hooks/useIsTouch"
import { useOverlayStore } from "@/stores/overlayStore"

// Gap (px) between the mascot's top edge and the bottom of the speech bubble.
const GAP_PX = 14
// Half the max bubble width (≈ min(78vw, 22rem)) + margin, used to clamp the
// bubble's center so a corner-anchored mascot doesn't push it off-screen.
const CLAMP_HALF_PX = 184

/**
 * Attract screen shown after inactivity.
 *
 * No full-screen scrim — the live preview stays bright so people see
 * themselves. It renders ONLY a speech bubble (no own mascot image — that would
 * double up on the mascot Overlays already paints). The bubble is positioned
 * against the REAL mascot element by measuring it, so it always sits just above
 * whichever mascot is configured, wherever that layout places it, at whatever
 * size it renders — and never overlaps it. The bubble is never composited into
 * the photo (no `data-overlay` attrs; attract is dismissed before any capture).
 * Copy is touch-aware. Motion is a gentle bubble pop, reduced by the global
 * prefers-reduced-motion rule. Tapping/moving/waving (upstream) dismisses it.
 */
export function AttractOverlay({ visible }) {
  // Kiosk (non-touch convention screen + camera) is gesture-driven — you can't
  // tap a non-touch screen, and the capture gesture is the ✌️ peace sign (NOT a
  // wave). Wording matches GestureCaptureHint. Phone / tablet (touch) have the
  // on-screen capture button, so there we say "tap".
  const isTouch = useIsTouch()
  const subtitle = isTouch ? "Tik op het scherm" : "Houd een ✌️ omhoog om op de foto te komen"

  // Re-measure whenever the configured layout or mascot changes (the mascot
  // node, its position and its size all depend on these).
  const layoutId = useOverlayStore((s) => s.layoutId)
  const mascotId = useOverlayStore((s) => s.mascotId)

  const rootRef = useRef(null)
  // { cx, bottom } in root-local px, or null until the mascot is measured.
  const [pos, setPos] = useState(null)

  useEffect(() => {
    if (!visible) return undefined
    const root = rootRef.current
    if (!root) return undefined

    const measure = () => {
      const mascot = document.querySelector('[data-image-type="mascot"]')
      if (!mascot) {
        setPos(null)
        return
      }
      const r = root.getBoundingClientRect()
      const m = mascot.getBoundingClientRect()
      const centerX = m.left - r.left + m.width / 2
      const cx = Math.max(CLAMP_HALF_PX, Math.min(r.width - CLAMP_HALF_PX, centerX))
      setPos({ cx, bottom: r.bottom - m.top + GAP_PX })
    }

    measure()
    // Mascot is a lazily-decoded <img>; re-measure once it has laid out.
    const settle = setTimeout(measure, 350)
    const mascot = document.querySelector('[data-image-type="mascot"]')
    const ro = mascot ? new ResizeObserver(measure) : null
    if (mascot && ro) ro.observe(mascot)
    window.addEventListener("resize", measure)

    return () => {
      clearTimeout(settle)
      ro?.disconnect()
      window.removeEventListener("resize", measure)
    }
  }, [visible, layoutId, mascotId])

  return (
    <div
      ref={rootRef}
      aria-hidden={!visible}
      className={cn(
        "pointer-events-none absolute inset-0 z-30 transition-opacity duration-700",
        visible ? "opacity-100" : "opacity-0",
      )}
    >
      {/* Outer holds the positioning transform; inner holds the pop animation —
          kept on separate elements so their transforms never fight. */}
      {pos && (
        <div
          className="absolute"
          style={{ left: `${pos.cx}px`, bottom: `${pos.bottom}px`, transform: "translateX(-50%)" }}
        >
          <div
            className={cn(
              "relative w-[min(78vw,22rem)] rounded-[1.6rem] border border-gold/35 bg-surface/95 px-5 py-4 shadow-[0_10px_40px_rgba(0,0,0,0.5)] backdrop-blur-md",
              visible && "animate-bubble-pop",
            )}
          >
            <p className="text-center font-display text-2xl font-semibold tracking-tight text-ink md:text-3xl">
              Kom op de foto!
            </p>
            <p className="mt-1 text-center text-sm text-ink-muted md:text-base">{subtitle}</p>

            {/* Tail — points straight down toward the mascot below. */}
            <span
              aria-hidden="true"
              className="absolute -bottom-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 border-b border-r border-gold/35 bg-surface/95"
            />
          </div>
        </div>
      )}
    </div>
  )
}