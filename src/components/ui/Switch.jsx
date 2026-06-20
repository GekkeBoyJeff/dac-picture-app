"use client"

import { cn } from "@/lib/styles/cn"

/**
 * Gold-on toggle. Replaces the ad-hoc per-tone toggles (amber/sky/emerald)
 * with one consistent, brand-coloured control.
 */
export function Switch({ checked = false, onChange, ariaLabel, disabled = false, className = "" }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={cn(
        "relative h-7 w-12 shrink-0 cursor-pointer rounded-full border transition-all duration-200",
        "disabled:cursor-not-allowed disabled:opacity-40",
        checked
          ? "border-transparent bg-linear-to-b from-gold-strong to-gold-deep shadow-[0_0_16px_rgba(230,193,137,0.4)]"
          : "border-hairline-strong bg-raised",
        className,
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 h-5 w-5 rounded-full transition-all duration-200",
          checked ? "left-[1.45rem] bg-[#1b1407]" : "left-0.5 bg-ink-muted",
        )}
      />
    </button>
  )
}