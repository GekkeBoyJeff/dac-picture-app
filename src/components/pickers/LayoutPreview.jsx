import { cn } from "@/lib/styles/cn"

// Shared layout-preview tile used by both the grid picker and the gesture
// slider. It renders little token-coloured blocks placed by parsing the
// layout's position strings ("top-left", "bottom-right", "middle-right"…).
// `size` only tweaks the edge inset + block sizing so the same preview reads
// well both small (grid) and large (slider). Behaviour is identical to the
// two old per-file `Block` components.

function blockStyle(position, inset) {
  const pos = { position: "absolute" }
  if (position.includes("top")) pos.top = inset
  if (position.includes("bottom")) pos.bottom = inset
  if (position.includes("left")) pos.left = inset
  if (position.includes("right")) pos.right = inset
  if (position === "middle-right") {
    pos.right = inset
    pos.top = "50%"
    pos.transform = "translateY(-50%)"
  }
  return pos
}

function Block({ position, inset, className }) {
  return <div className={className} style={blockStyle(position, inset)} />
}

const SIZES = {
  sm: {
    inset: 5,
    frame: "h-24 w-32",
    logo: "h-3.5 w-3.5 rounded-sm",
    qr: "h-4 w-4 rounded-sm",
    mascot: "h-8 w-6 rounded-sm",
    convention: "h-3.5 w-8 rounded-sm",
  },
  lg: {
    inset: 8,
    frame: "aspect-[4/3] w-full",
    logo: "h-4 w-4 rounded",
    qr: "h-5 w-5 rounded",
    mascot: "h-11 w-8 rounded",
    convention: "h-4 w-10 rounded",
  },
}

/**
 * @param {{ layout: object, size?: "sm"|"lg", className?: string }} props
 */
export function LayoutPreview({ layout, size = "sm", className = "" }) {
  const s = SIZES[size] ?? SIZES.sm

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-hairline bg-ground/60",
        s.frame,
        className,
      )}
    >
      <Block position={layout.logo.position} inset={s.inset} className={cn(s.logo, "bg-ink/70")} />
      <Block
        position={layout.qr.position}
        inset={s.inset}
        className={cn(s.qr, "bg-ink-muted/60")}
      />
      <Block
        position={layout.mascot.position}
        inset={s.inset}
        className={cn(s.mascot, "bg-gold/55")}
      />
      <Block
        position={layout.convention.position}
        inset={s.inset}
        className={cn(s.convention, "bg-ink-dim/70")}
      />
      <div className="absolute bottom-1.5 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-ink-muted/35" />
    </div>
  )
}