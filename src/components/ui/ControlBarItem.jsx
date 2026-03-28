"use client"

import { BUTTON_STYLES } from "@/lib/styles/buttons"

const TOOLTIP_CLASS = "pointer-events-none absolute -left-38 top-1/2 -translate-y-1/2 whitespace-nowrap px-3 py-1 rounded-lg bg-black/80 border border-white/10 text-white/70 text-xs opacity-0 translate-x-2 transition duration-150 group-hover:opacity-100 group-hover:translate-x-0 max-lg:hidden"

/**
 * Shared tooltip for ControlBar items.
 * Exported so non-button items (e.g. status indicators) can reuse it.
 */
export function ControlBarTooltip({ label, className = "" }) {
  if (!label) return null
  return <span className={`${TOOLTIP_CLASS} ${className}`}>{label}</span>
}

/**
 * Reusable ControlBar item with icon button + hover tooltip.
 * Eliminates the repeated tooltip pattern across all ControlBar buttons.
 */
export function ControlBarItem({ onClick, icon, label, ariaLabel, className = "", children }) {
  return (
    <div className="relative group">
      <button
        onClick={onClick}
        className={`${BUTTON_STYLES.icon} ${className}`}
        aria-label={ariaLabel || label}
      >
        {icon}
      </button>
      <ControlBarTooltip label={label} />
      {children}
    </div>
  )
}
