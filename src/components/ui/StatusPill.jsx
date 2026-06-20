import { cn } from "@/lib/styles/cn"

const ICON_TONE = {
  neutral: "text-ink-muted",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
  gold: "text-gold",
}

const DOT = {
  neutral: "bg-ink-muted",
  success: "bg-success shadow-[0_0_10px_rgba(127,200,160,0.6)]",
  warning: "bg-warning shadow-[0_0_10px_rgba(227,167,92,0.6)]",
  danger: "bg-danger shadow-[0_0_10px_rgba(232,131,108,0.6)]",
  gold: "bg-gold shadow-[0_0_10px_rgba(230,193,137,0.6)]",
}

/**
 * Status pill with semantic tone. Pass an `icon` for status with a glyph,
 * otherwise a coloured dot is shown.
 */
export function StatusPill({ tone = "neutral", icon, children, className = "" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-hairline bg-surface/90 px-3.5 py-2 text-xs font-medium backdrop-blur-md",
        className,
      )}
    >
      {icon ? (
        <span className={cn("flex h-4 w-4 items-center justify-center", ICON_TONE[tone])}>
          {icon}
        </span>
      ) : (
        <span className={cn("h-2.5 w-2.5 rounded-full", DOT[tone])} />
      )}
      <span className="text-ink">{children}</span>
    </span>
  )
}