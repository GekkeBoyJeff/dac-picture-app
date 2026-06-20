"use client"

import { cn } from "@/lib/styles/cn"

/** Small uppercase section heading + helper line. */
export function SectionLabel({ title, description }) {
  return (
    <div className="space-y-1">
      <p className="text-[0.7rem] uppercase tracking-[0.2em] text-ink-dim">{title}</p>
      <p className="text-xs leading-5 text-ink-muted">{description}</p>
    </div>
  )
}

/** Full-width toggle row — the whole row is tappable; a gold switch shows state. */
export function ToggleRow({ title, description, checked, disabled = false, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={checked}
      className={cn(
        "flex w-full items-center justify-between gap-4 rounded-xl border px-4 py-4 text-left transition-all duration-200",
        disabled ? "cursor-not-allowed opacity-55" : "cursor-pointer",
        checked
          ? "border-gold/45 bg-gold/[0.08]"
          : "border-hairline bg-surface hover:border-hairline-strong",
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-ink">{title}</p>
        <p className="mt-0.5 text-xs leading-5 text-ink-muted">{description}</p>
      </div>
      <span
        aria-hidden="true"
        className={cn(
          "relative h-7 w-12 shrink-0 rounded-full border transition-all duration-200",
          checked
            ? "border-transparent bg-linear-to-b from-gold-strong to-gold-deep shadow-[0_0_16px_rgba(230,193,137,0.4)]"
            : "border-hairline-strong bg-raised",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full transition-all duration-200",
            checked ? "left-[1.45rem] bg-[#1b1407]" : "left-0.5 bg-ink-muted",
          )}
        />
      </span>
    </button>
  )
}

/** Compact summary stat. `highlight` tints it gold. */
export function StatPill({ label, value, highlight = false }) {
  return (
    <div
      className={cn(
        "rounded-lg border px-3 py-2.5",
        highlight ? "border-gold/35 bg-gold/10" : "border-hairline bg-surface",
      )}
    >
      <p
        className={cn(
          "text-[0.65rem] uppercase tracking-[0.18em]",
          highlight ? "text-gold/80" : "text-ink-dim",
        )}
      >
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-ink">{value}</p>
    </div>
  )
}

/** A labelled navigational row (e.g. "Over de app"). */
export function TopAction({ label, description, onClick, icon: Icon }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-15 w-full cursor-pointer items-center justify-between gap-3 rounded-xl border border-hairline bg-surface px-4 py-3 text-left transition-all duration-200 hover:border-hairline-strong hover:bg-raised"
    >
      <div className="min-w-0">
        <p className="text-[0.65rem] uppercase tracking-[0.2em] text-ink-dim">{label}</p>
        <p className="mt-0.5 text-sm font-semibold text-ink">{description}</p>
      </div>
      {Icon && <Icon className="h-4 w-4 shrink-0 text-ink-muted" />}
    </button>
  )
}

/** Small selectable pill (hold times, hand counts). */
export function ChoiceButton({ selected, disabled = false, onClick, children, className = "" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={cn(
        "rounded-lg border px-2 py-3 text-xs font-semibold transition-all duration-200",
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
        selected
          ? "border-gold/55 bg-gold/15 text-gold-strong"
          : "border-hairline bg-surface text-ink-muted hover:border-hairline-strong hover:text-ink",
        className,
      )}
    >
      {children}
    </button>
  )
}

/** Larger selectable card with title/note/meta (scene + gesture presets). */
export function ChoiceCard({ selected, disabled = false, onClick, title, note, meta }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={cn(
        "flex min-h-28 flex-col justify-between gap-1.5 rounded-xl border px-3 py-3 text-left text-xs transition-all duration-200",
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
        selected
          ? "border-gold/55 bg-gold/15"
          : "border-hairline bg-surface hover:border-hairline-strong",
      )}
    >
      <div>
        <p className="text-sm font-semibold leading-tight text-ink">{title}</p>
        <p className="mt-1 leading-snug text-ink-muted">{note}</p>
      </div>
      {meta && <p className="font-mono leading-snug text-ink-dim">{meta}</p>}
    </button>
  )
}

/** Range slider with a gold accent and a live value readout. */
export function RangeControl({
  label,
  value,
  min,
  max,
  step,
  onChange,
  disabled = false,
  formatValue = (v) => v,
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-ink-muted">
        <span>{label}</span>
        <span className="font-mono text-ink">{formatValue(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full cursor-pointer accent-gold disabled:cursor-not-allowed disabled:opacity-50"
      />
    </div>
  )
}

/** Small bordered info/help box. */
export function HelpBox({ children, className = "" }) {
  return (
    <div
      className={cn(
        "rounded-lg border border-hairline bg-surface px-3 py-2.5 text-xs text-ink-muted",
        className,
      )}
    >
      {children}
    </div>
  )
}