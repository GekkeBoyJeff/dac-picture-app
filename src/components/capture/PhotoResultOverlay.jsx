"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { cn } from "@/lib/styles/cn"
import { JOIN_HINT, QR_CODE } from "@/lib/config"

const REVEAL_MS = 400
const SENDING_MS = 1300
const OUTCOME_MS = 800
const JOIN_HINT_MS = 9000

function DiscordMark({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.317 4.369a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.371-.291a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.009c.12.099.245.198.372.292a.077.077 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.891.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  )
}

/**
 * Self-contained post-capture overlay. Owns the full timeline:
 * reveal -> sending -> outcome -> joinHint -> (onDismiss).
 *
 * The timeline is PURELY JS-timer driven and NEVER waits on the network, so the
 * animation always feels fluid no matter how slow the send is. The real send is
 * fired-and-forgotten by the caller; `sendOrQueue` guarantees eventual delivery
 * (it queues on failure/offline and retries with backoff), so an optimistic
 * "Verzonden" is honest enough — hard failures are handled by the background
 * queue + its corner pill, not by stalling this overlay.
 *
 * Using timers (not `animationend`) also keeps the global prefers-reduced-motion
 * rule — which near-zeroes CSS durations — from stalling the flow.
 *
 * The photo's journey (center -> lifted/small -> corner thumb) is driven by ONE
 * mechanism: transition-based transforms. The lifted state is shared by the
 * `sending` AND `outcome` phases so the photo never snaps back to center between
 * the fly-away and the corner shrink.
 *
 * The caller's `onDismiss` is responsible for revoking the object URL and
 * resetting app state. This component is otherwise pure/presentational.
 */
export function PhotoResultOverlay({ photo, onDismiss }) {
  const [phase, setPhase] = useState("reveal")
  const dismissedRef = useRef(false)
  const timers = useRef([])

  const after = useCallback((ms, fn) => {
    const id = setTimeout(fn, ms)
    timers.current.push(id)
    return id
  }, [])

  const dismiss = useCallback(() => {
    if (dismissedRef.current) return
    dismissedRef.current = true
    timers.current.forEach(clearTimeout)
    timers.current = []
    onDismiss()
  }, [onDismiss])

  // Drive the phase machine entirely with JS timers — no awaiting the send.
  useEffect(() => {
    let alive = true
    const guard = (fn) => () => {
      if (alive) fn()
    }
    after(REVEAL_MS, guard(() => setPhase("sending")))
    after(REVEAL_MS + SENDING_MS, guard(() => setPhase("outcome")))
    after(
      REVEAL_MS + SENDING_MS + OUTCOME_MS,
      guard(() => {
        setPhase("joinHint")
        after(JOIN_HINT_MS, dismiss)
      }),
    )

    return () => {
      alive = false
      timers.current.forEach(clearTimeout)
      timers.current = []
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const inJoinHint = phase === "joinHint"
  // Shared "flown" state: the photo lifts + tilts + shrinks during sending and
  // STAYS there through outcome (no revert to center), then glides to the corner.
  const lifted = phase === "sending" || phase === "outcome"

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Foto verzonden"
      onClick={dismiss}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-ground/92 backdrop-blur-md"
    >
      {/* Photo — center during reveal, lifts/shrinks while sending+outcome,
          then glides to a corner thumb in joinHint. One mechanism (transition
          on transform) throughout, so there is no snap between phases. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photo.url}
        alt=""
        aria-hidden="true"
        draggable="false"
        className={cn(
          "select-none rounded-2xl border border-hairline-strong object-contain shadow-[0_20px_60px_rgba(0,0,0,0.6)] transition-all ease-out",
          phase === "reveal" && "animate-pop-in",
          inJoinHint
            ? "fixed bottom-6 right-6 max-h-[22vh] max-w-[22vw] duration-500"
            : "max-h-[64vh] max-w-[80vw]",
          lifted && "-translate-y-[16vh] -rotate-3 scale-[0.5]",
          phase === "sending" && "duration-1200",
          phase === "outcome" && "duration-500",
        )}
      />

      {/* Sending + outcome cluster */}
      {!inJoinHint && (
        <div className="pointer-events-none absolute inset-x-0 bottom-[14%] flex flex-col items-center gap-4">
          <span className="relative flex h-16 w-16 items-center justify-center">
            {phase === "outcome" && (
              <span
                aria-hidden="true"
                className="absolute inset-0 rounded-full bg-gold/40 animate-gold-ripple"
              />
            )}
            <DiscordMark
              className={cn("h-12 w-12", phase === "outcome" ? "text-gold" : "text-ink-muted")}
            />
          </span>

          {phase === "sending" && (
            <p className="text-lg font-medium text-ink">
              Versturen naar Discord
              <span className="animate-splash-dots">.</span>
              <span className="animate-splash-dots" style={{ animationDelay: "0.2s" }}>
                .
              </span>
              <span className="animate-splash-dots" style={{ animationDelay: "0.4s" }}>
                .
              </span>
            </p>
          )}

          {phase === "outcome" && (
            <p className="text-xl font-semibold text-gold">Verzonden! ✓</p>
          )}
        </div>
      )}

      {/* Join-Discord hint */}
      {inJoinHint && (
        <div className="flex flex-col items-center gap-5 px-6 text-center animate-qr-in">
          {/* qr-discord.svg has WHITE modules (made for the dark photo strips), so
              on a white card it was invisible. Invert it to black-on-white here —
              visible and the most reliably scannable orientation. */}
          <div className="rounded-2xl border border-gold/30 bg-white p-3 shadow-[0_12px_40px_rgba(0,0,0,0.5)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={QR_CODE.src}
              alt=""
              aria-hidden="true"
              draggable="false"
              className="h-40 w-40 invert md:h-48 md:w-48"
            />
          </div>
          <div>
            <p className="font-display text-2xl font-semibold tracking-tight text-ink md:text-3xl">
              {JOIN_HINT.TITLE}
            </p>
            <p className="mt-1 text-base text-ink-muted md:text-lg">{JOIN_HINT.SUBTITLE}</p>
            <p className="mt-2 text-sm text-gold">{JOIN_HINT.COMMUNITY}</p>
          </div>

          {/* Countdown ring — purely decorative auto-return indicator */}
          <svg viewBox="0 0 100 100" className="h-10 w-10 -rotate-90" aria-hidden="true">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="rgba(245,241,232,0.12)"
              strokeWidth="6"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="var(--color-gold)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray="283"
              className="animate-countdown-ring"
              style={{ "--ring-circumference": "283" }}
            />
          </svg>

          <p className="text-xs text-ink-dim">Tik om door te gaan</p>
        </div>
      )}
    </div>
  )
}