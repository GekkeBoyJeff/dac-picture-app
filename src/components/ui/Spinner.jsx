import { cn } from "@/lib/styles/cn"

/** The single shared spinner. Gold accent on a hairline track. */
export function Spinner({ className = "w-5 h-5" }) {
  return (
    <div
      role="status"
      aria-label="Laden"
      className={cn(
        "rounded-full border-2 border-hairline-strong border-t-gold animate-spin",
        className,
      )}
    />
  )
}