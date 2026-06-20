"use client"

import { cn } from "@/lib/styles/cn"

/**
 * The one button system. Variant carries hierarchy:
 *   primary   — gold, the single most important action on a screen
 *   secondary — neutral surface, supporting actions
 *   ghost     — quiet, low-commitment actions
 *   danger    — destructive
 */
const VARIANTS = {
  primary:
    "bg-linear-to-b from-gold-strong via-gold to-gold-deep text-[#1b1407] font-semibold shadow-[0_6px_20px_rgba(230,193,137,0.28)] hover:brightness-105 active:brightness-95",
  secondary: "bg-surface text-ink border border-hairline-strong hover:bg-raised",
  ghost:
    "bg-transparent text-ink-muted border border-hairline hover:text-ink hover:border-hairline-strong",
  danger: "bg-transparent text-danger border border-danger/40 hover:bg-danger/12",
}

const SIZES = {
  sm: "px-4 py-2 text-sm rounded-xl gap-1.5",
  md: "px-5 py-3 text-[0.95rem] rounded-xl gap-2",
  lg: "px-7 py-4 text-base rounded-2xl gap-2.5",
}

export function Button({
  variant = "secondary",
  size = "md",
  className = "",
  type = "button",
  children,
  ...props
}) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex cursor-pointer items-center justify-center font-medium transition-all duration-200",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}