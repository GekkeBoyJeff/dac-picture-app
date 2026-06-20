"use client"

import { cn } from "@/lib/styles/cn"

const SIZES = {
  sm: "w-10 h-10",
  md: "w-12 h-12", // 48px — kiosk-friendly touch target
  lg: "w-14 h-14",
}

/**
 * Square icon button used across the camera chrome and drawers.
 * `active` lights it up in gold to signal a toggled-on state.
 */
export function IconButton({
  active = false,
  size = "md",
  className = "",
  ariaLabel,
  children,
  ...props
}) {
  return (
    <button
      aria-label={ariaLabel}
      aria-pressed={active || undefined}
      className={cn(
        "flex items-center justify-center rounded-2xl border backdrop-blur-md transition-all duration-200 cursor-pointer",
        SIZES[size],
        active
          ? "border-gold/55 bg-gold/15 text-gold-strong shadow-[0_0_0_1px_rgba(230,193,137,0.25),0_0_18px_rgba(230,193,137,0.22)]"
          : "border-hairline bg-surface/80 text-ink hover:-translate-y-px hover:border-hairline-strong hover:bg-raised",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}