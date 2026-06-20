"use client"

import { IconButton } from "@/components/ui/IconButton"
import { cn } from "@/lib/styles/cn"

const TOOLTIP_CLASS =
  "pointer-events-none absolute -left-40 top-1/2 -translate-y-1/2 translate-x-2 whitespace-nowrap rounded-lg border border-hairline bg-raised px-3 py-1.5 text-xs text-ink-muted opacity-0 transition duration-150 group-hover:translate-x-0 group-hover:opacity-100 max-lg:hidden"

/**
 * Shared tooltip for ControlBar items.
 * Exported so non-button items (e.g. status indicators) can reuse it.
 */
export function ControlBarTooltip({ label, className = "" }) {
  if (!label) return null
  return <span className={cn(TOOLTIP_CLASS, className)}>{label}</span>
}

/**
 * ControlBar item: a kiosk-sized icon button + hover tooltip.
 * `active` lights the button up in gold (e.g. strip mode on).
 */
export function ControlBarItem({
  onClick,
  icon,
  label,
  ariaLabel,
  active = false,
  className = "",
  children,
}) {
  return (
    <div className="group relative">
      <IconButton
        onClick={onClick}
        active={active}
        ariaLabel={ariaLabel || label}
        className={className}
      >
        {icon}
      </IconButton>
      <ControlBarTooltip label={label} />
      {children}
    </div>
  )
}