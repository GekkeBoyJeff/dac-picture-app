"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/styles/cn"
import { useUiStore } from "@/stores/uiStore"

const FIRST_DELAY_MS = 1200
const VISIBLE_MS = 5000
const HIDDEN_MS = 9000

/**
 * Big, lively reminder that a ✌️ takes the photo (and 👍→✊ toggles a strip).
 * Surfaces periodically with a spring "pop" rather than nagging constantly.
 *
 * Only shown on the large kiosk (>=1200px) where the capture button is hidden;
 * on phones/tablets people just tap the button. It is pure on-screen chrome
 * (no `data-overlay`, pointer-transparent) so it is never part of the photo,
 * and only appears while idle (appState === "camera").
 */
export function GestureCaptureHint({ active = true }) {
  const gesturesEnabled = useUiStore((s) => s.gesturesEnabled)
  const appState = useUiStore((s) => s.appState)
  const [shown, setShown] = useState(false)

  const eligible = active && gesturesEnabled && appState === "camera"

  useEffect(() => {
    if (!eligible) return undefined
    let timer
    const cycle = (visible) => {
      setShown(visible)
      timer = setTimeout(() => cycle(!visible), visible ? VISIBLE_MS : HIDDEN_MS)
    }
    timer = setTimeout(() => cycle(true), FIRST_DELAY_MS)
    return () => clearTimeout(timer)
  }, [eligible])

  if (!eligible) return null

  return (
    <div className="pointer-events-none absolute bottom-10 left-1/2 z-20 max-[1199px]:hidden -translate-x-1/2">
      <div
        className={cn(
          "flex items-center gap-5 rounded-[1.75rem] border border-gold/30 bg-surface/85 py-5 pl-5 pr-7 backdrop-blur-md transition-opacity duration-500",
          "shadow-[0_16px_44px_rgba(0,0,0,0.5),0_0_56px_rgba(230,193,137,0.16)]",
          shown ? "animate-hint-pop opacity-100" : "opacity-0",
        )}
      >
        {/* Peace sign with a breathing gold spotlight behind it */}
        <div className="relative flex h-20 w-20 shrink-0 items-center justify-center">
          <span
            aria-hidden="true"
            className="absolute inset-0 animate-spotlight rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(230,193,137,0.4), rgba(230,193,137,0.06) 55%, transparent 72%)",
            }}
          />
          <span className="relative animate-peace-bob text-6xl leading-none drop-shadow-[0_4px_14px_rgba(0,0,0,0.5)]">
            ✌️
          </span>
        </div>

        <div className="min-w-0">
          <p className="font-display text-2xl font-semibold leading-tight text-ink">
            Maak je foto!
          </p>
          <p className="mt-1 text-sm text-ink-muted">
            Houd een <span className="font-semibold text-gold">✌️ peace-teken</span> omhoog voor de
            camera
          </p>
          <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-hairline bg-raised px-3 py-1.5 text-xs text-ink-muted">
            <span className="text-sm">👍 → ✊</span>
            <span>
              schakelt de <span className="text-gold">fotostrip</span> aan
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}