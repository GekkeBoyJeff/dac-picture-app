"use client"

import { cn } from "@/lib/styles/cn"
import { useIsTouch } from "@/hooks/useIsTouch"
import { useOverlayStore, selectLayout, selectMascot } from "@/stores/overlayStore"

// Same resolution cascade Overlays uses for the (composited) mascot position,
// so the attract bubble always sits with whichever mascot is actually on screen.
function resolveMascotPosition(layout, mascot) {
  return (
    layout.mascotOverrides?.[mascot.id]?.position ??
    mascot.defaults?.position ??
    layout.mascot?.position ??
    "bottom-right"
  )
}

/**
 * Attract screen shown after inactivity.
 *
 * No full-screen scrim — the live preview stays bright so people see
 * themselves. It renders ONLY a speech bubble for the existing mascot that
 * Overlays already paints in the bottom corner (rendering a second mascot here
 * would double up / overlap it). The bubble floats above that mascot, on the
 * same side, and is never composited into the photo (no `data-overlay` attrs,
 * and attract is dismissed before any capture). Copy is touch-aware. Motion is
 * a gentle bubble pop, reduced by the global prefers-reduced-motion rule.
 * Tapping/moving/waving (handled upstream) dismisses it.
 */
export function AttractOverlay({ visible }) {
  // Kiosk (non-touch convention screen + camera) is gesture-driven — you can't
  // tap a non-touch screen, and the capture gesture is the ✌️ peace sign (NOT a
  // wave). Wording matches GestureCaptureHint. Phone / tablet (touch) have the
  // on-screen capture button, so there we say "tap".
  const isTouch = useIsTouch()
  const subtitle = isTouch ? "Tik op het scherm" : "Houd een ✌️ omhoog om op de foto te komen"

  const layout = useOverlayStore(selectLayout)
  const mascot = useOverlayStore(selectMascot)
  const onLeft = resolveMascotPosition(layout, mascot).includes("left")

  return (
    <div
      aria-hidden={!visible}
      className={cn(
        "pointer-events-none absolute inset-0 z-30 flex items-end p-4 transition-opacity duration-700 md:p-6",
        onLeft ? "justify-start" : "justify-end",
        visible ? "opacity-100" : "opacity-0",
      )}
    >
      {/* Speech bubble, floating above the existing mascot in the bottom corner. */}
      <div
        className={cn(
          "relative mb-[26vh] max-w-[min(78vw,22rem)] rounded-[1.6rem] border border-gold/35 bg-surface/95 px-5 py-4 shadow-[0_10px_40px_rgba(0,0,0,0.5)] backdrop-blur-md",
          visible && "animate-bubble-pop",
        )}
      >
        <p className="text-center font-display text-2xl font-semibold tracking-tight text-ink md:text-3xl">
          Kom op de foto!
        </p>
        <p className="mt-1 text-center text-sm text-ink-muted md:text-base">{subtitle}</p>

        {/* Tail — points down toward the mascot below, on the mascot's side. */}
        <span
          aria-hidden="true"
          className={cn(
            "absolute -bottom-2 h-4 w-4 rotate-45 border-b border-r border-gold/35 bg-surface/95",
            onLeft ? "left-10" : "right-10",
          )}
        />
      </div>
    </div>
  )
}