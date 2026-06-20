"use client"

import { cn } from "@/lib/styles/cn"

/**
 * Tabs / segmented control, e.g. Basis | Geavanceerd.
 * options: [{ value, label }]
 */
export function SegmentedControl({ options, value, onChange, ariaLabel, className = "" }) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn("flex gap-1.5 rounded-xl border border-hairline bg-surface p-1.5", className)}
    >
      {options.map((opt) => {
        const selected = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange?.(opt.value)}
            className={cn(
              "flex-1 cursor-pointer rounded-lg px-3 py-2.5 text-sm font-semibold transition-all duration-200",
              selected
                ? "bg-gold/15 text-gold-strong shadow-[inset_0_0_0_1px_rgba(230,193,137,0.3)]"
                : "text-ink-muted hover:text-ink",
            )}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}