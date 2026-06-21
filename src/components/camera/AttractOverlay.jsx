"use client"

import { cn } from "@/lib/styles/cn"
import { useIsTouch } from "@/hooks/useIsTouch"

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || ""
const MASCOT_SRC = `${BASE_PATH}/overlays/mascots/amelia-smile.webp`

/**
 * Attract screen shown after inactivity.
 *
 * No full-screen scrim — the live preview stays bright so people see
 * themselves. A fixed "amelia-smile" mascot sits bottom-right with a speech
 * bubble at her upper-left (row on landscape/wide; column/above on
 * portrait/narrow so it never clips). Copy is touch-aware. Motion is a gentle
 * mascot bob + a bubble pop, both reduced by the global prefers-reduced-motion
 * rule. Tapping/moving/waving (handled upstream) dismisses it.
 */
export function AttractOverlay({ visible }) {
  // Kiosk (non-touch convention screen + camera) is gesture-driven — you can't
  // tap a non-touch screen, and the capture gesture is the ✌️ peace sign (NOT a
  // wave). Wording matches GestureCaptureHint. Phone / tablet (touch) have the
  // on-screen capture button, so there we say "tap".
  const isTouch = useIsTouch()
  const subtitle = isTouch ? "Tik op het scherm" : "Houd een ✌️ omhoog om op de foto te komen"

  return (
    <div
      aria-hidden={!visible}
      className={cn(
        "pointer-events-none absolute inset-0 z-30 flex items-end justify-end p-4 transition-opacity duration-700 md:p-6",
        visible ? "opacity-100" : "opacity-0",
      )}
    >
      {/* Bottom-right cluster: bubble + mascot.
          Portrait => stack (column, bubble above). Landscape => row, bubble left. */}
      <div className="flex max-w-[min(90vw,40rem)] flex-col items-end gap-2 landscape:flex-row landscape:items-end landscape:gap-3">
        {/* Speech bubble */}
        <div
          className={cn(
            "relative max-w-[min(78vw,22rem)] rounded-[1.6rem] border border-gold/35 bg-surface/95 px-5 py-4 shadow-[0_10px_40px_rgba(0,0,0,0.5)] backdrop-blur-md",
            "landscape:self-center",
            visible && "animate-bubble-pop",
          )}
        >
          <p className="text-center font-display text-2xl font-semibold tracking-tight text-ink md:text-3xl">
            Kom op de foto!
          </p>
          <p className="mt-1 text-center text-sm text-ink-muted md:text-base">{subtitle}</p>

          {/* Tail — points down toward the mascot (portrait/stacked) … */}
          <span
            aria-hidden="true"
            className="absolute -bottom-2 right-10 h-4 w-4 rotate-45 border-b border-r border-gold/35 bg-surface/95 landscape:hidden"
          />
          {/* … or points right toward the mascot (landscape/row). */}
          <span
            aria-hidden="true"
            className="absolute -right-2 top-1/2 hidden h-4 w-4 -translate-y-1/2 rotate-45 border-r border-t border-gold/35 bg-surface/95 landscape:block"
          />
        </div>

        {/* Mascot — fixed amelia-smile, anchored bottom-right, gentle bob.
            clamp() height ≈22vh (small) → ≈38vh (large). Kept clear of the
            bottom-center capture button (which is bottom-[12%], <1200px). */}
        <img
          src={MASCOT_SRC}
          alt=""
          aria-hidden="true"
          draggable="false"
          className={cn(
            "h-auto w-auto select-none object-contain",
            visible && "animate-mascot-bob",
          )}
          style={{ height: "clamp(11rem, 28vh, 22rem)", maxWidth: "min(46vw, 22rem)" }}
        />
      </div>
    </div>
  )
}
