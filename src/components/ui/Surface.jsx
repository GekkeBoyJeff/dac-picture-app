import { cn } from "@/lib/styles/cn"

const RADII = { sm: "rounded-xl", md: "rounded-2xl", lg: "rounded-3xl" }
const PADS = { none: "", sm: "p-3", md: "p-4", lg: "p-5" }

/**
 * One card/panel primitive. Replaces the nine near-identical
 * drawerCard* variants. `raised` adds depth for overlays/drawers.
 */
export function Surface({
  as: Tag = "div",
  raised = false,
  radius = "md",
  pad = "md",
  className = "",
  children,
  ...props
}) {
  return (
    <Tag
      className={cn(
        "border border-hairline",
        raised
          ? "bg-raised shadow-[0_1px_0_rgba(245,241,232,0.06)_inset,0_16px_40px_rgba(0,0,0,0.5)]"
          : "bg-surface shadow-[0_1px_0_rgba(245,241,232,0.04)_inset]",
        RADII[radius],
        PADS[pad],
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  )
}