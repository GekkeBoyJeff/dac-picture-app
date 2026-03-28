"use client"

/* eslint-disable @next/next/no-img-element -- Native img is required for precise overlay DOM measurement used by compositePhoto. */
import { memo, useSyncExternalStore } from "react"
import { CORNERS, LOGO, QR_CODE } from "@/lib/config"
import { useOverlayStore, selectLayout, selectMascot, selectActiveConvention } from "@/stores/overlayStore"

// ---------------------------------------------------------------------------
// Breakpoint system — orientation-aware
// ---------------------------------------------------------------------------

function getBreakpointInfo() {
  if (typeof document === "undefined") return "lg|landscape"
  const w = document.documentElement.clientWidth
  const h = document.documentElement.clientHeight
  const minDim = Math.min(w, h)
  const tier = minDim >= 1024 ? "lg" : minDim >= 600 ? "md" : "sm"
  const orientation = h > w ? "portrait" : "landscape"
  return `${tier}|${orientation}`
}

function subscribe(cb) {
  window.addEventListener("resize", cb)
  return () => window.removeEventListener("resize", cb)
}

function useBreakpointInfo() {
  const raw = useSyncExternalStore(subscribe, getBreakpointInfo, () => "lg|landscape")
  const [tier, orientation] = raw.split("|")
  return { tier, orientation }
}

/** Resolve a breakpoint-keyed object, with optional orientation override. */
function bp(obj, tier, orientation) {
  return obj?.[`${tier}-${orientation}`] ?? obj?.[tier]
}

function rem(v) {
  return `${v}rem`
}

// ---------------------------------------------------------------------------
// Offset resolution
// ---------------------------------------------------------------------------

function resolveOffset(offset, tier, orientation) {
  if (!offset) return { x: 0, y: 0 }
  if ("x" in offset || "y" in offset) return { x: offset.x ?? 0, y: offset.y ?? 0 }
  const resolved = bp(offset, tier, orientation)
  if (resolved && ("x" in resolved || "y" in resolved)) return { x: resolved.x ?? 0, y: resolved.y ?? 0 }
  return { x: 0, y: 0 }
}

// ---------------------------------------------------------------------------
// Mascot property resolution cascade
// ---------------------------------------------------------------------------

function resolveMascotProp(layout, mascot, prop, tier, orientation) {
  const sources = [
    layout.mascotOverrides?.[mascot.id],
    mascot.defaults,
    layout.mascot,
  ]

  for (const source of sources) {
    if (!source || source[prop] === undefined) continue

    if (prop === "sizes") {
      const val = bp(source[prop], tier, orientation)
      if (val) return val
    } else if (prop === "offset") {
      const val = resolveOffset(source[prop], tier, orientation)
      if (val) return val
    } else {
      return source[prop]
    }
  }

  if (prop === "offset") return { x: 0, y: 0 }
  if (prop === "sizingAxis") return "height"
  if (prop === "opacity") return 1
  return undefined
}

// ---------------------------------------------------------------------------
// Position + sizing → inline style
// ---------------------------------------------------------------------------

function positionStyle({ position, inset, size, offset, opacity, sizingAxis, fixedSize }) {
  if (position === "full") {
    return { position: "absolute", inset: 0, width: "100%", height: "100%" }
  }

  const style = { position: "absolute", pointerEvents: "none" }

  if (opacity !== undefined) style.opacity = opacity

  const { maxWidth, maxHeight } = size
  if (fixedSize) {
    style.width = rem(maxWidth)
    style.height = rem(maxHeight)
  } else if (sizingAxis === "width") {
    style.width = rem(maxWidth)
    style.height = "auto"
    style.maxHeight = rem(maxHeight)
    style.objectFit = "contain"
  } else if (sizingAxis === "contain") {
    style.maxWidth = rem(maxWidth)
    style.maxHeight = rem(maxHeight)
    style.width = "auto"
    style.height = "auto"
    style.objectFit = "contain"
  } else {
    style.maxHeight = rem(maxHeight)
    style.width = "auto"
    style.maxWidth = rem(maxWidth)
  }

  const ox = offset?.x ?? 0
  const oy = offset?.y ?? 0

  if (position.includes("top")) style.top = rem(inset + oy)
  if (position.includes("bottom")) style.bottom = rem(inset + oy)
  if (position.includes("left")) style.left = rem(inset + ox)
  if (position.includes("right")) style.right = rem(inset + ox)

  if (position === "middle-right") {
    style.right = rem(inset + ox)
    style.top = "50%"
    style.transform = "translateY(-50%)"
  }

  return style
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const Overlays = memo(function Overlays() {
  const layout = useOverlayStore(selectLayout)
  const mascot = useOverlayStore(selectMascot)
  const activeConvention = selectActiveConvention()
  const { tier, orientation } = useBreakpointInfo()

  const inset = bp(layout.inset, tier, orientation)
  const logoSize = bp(layout.logo.size, tier, orientation)
  const titleFontSize = bp(layout.title.fontSize, tier, orientation)
  const cornerSize = bp(layout.corners.size, tier, orientation)
  const qrSize = bp(layout.qr.size, tier, orientation)

  const mascotSize = resolveMascotProp(layout, mascot, "sizes", tier, orientation)
  const mascotOpacity = resolveMascotProp(layout, mascot, "opacity", tier, orientation)
  const mascotOffset = resolveMascotProp(layout, mascot, "offset", tier, orientation)
  const mascotPosition = resolveMascotProp(layout, mascot, "position", tier, orientation)
  const mascotSizingAxis = resolveMascotProp(layout, mascot, "sizingAxis", tier, orientation)

  const logoOffset = resolveOffset(layout.logo.offset, tier, orientation)
  const logoInset = inset + logoOffset.y
  const titleHeight = titleFontSize * 2.2
  const titleTop = logoInset + (logoSize - titleHeight) / 2
  const logoOnRight = layout.logo.position.includes("right")

  return (
    <>
      {/* Vignettes */}
      <div data-overlay="vignette-radial" className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.4) 100%)" }} />
      <div data-overlay="vignette-bottom" className="absolute bottom-0 left-0 right-0 h-[45%] pointer-events-none bg-linear-to-t from-black/50 via-black/20 to-transparent" />
      <div data-overlay="vignette-top" className="absolute top-0 left-0 right-0 h-[20%] pointer-events-none bg-linear-to-b from-black/40 to-transparent" />

      {/* Corners */}
      {CORNERS.map((c) => {
        const cornerOffset = resolveOffset(layout.corners.offset, tier, orientation)
        const style = { width: rem(cornerSize), height: rem(cornerSize) }
        if (c.position.includes("top")) style.top = rem(inset + cornerOffset.y)
        if (c.position.includes("bottom")) style.bottom = rem(inset + cornerOffset.y)
        if (c.position.includes("left")) style.left = rem(inset + cornerOffset.x)
        if (c.position.includes("right")) style.right = rem(inset + cornerOffset.x)
        return (
          <img key={c.src} src={c.src} alt="" data-overlay="corner" draggable={false}
            className="absolute pointer-events-none" style={style} />
        )
      })}

      {/* Logo */}
      <img
        src={LOGO.src} alt="" data-overlay="image" data-image-type="logo" draggable={false}
        className="pointer-events-none"
        style={positionStyle({
          position: layout.logo.position,
          inset,
          size: { maxWidth: logoSize, maxHeight: logoSize },
          offset: resolveOffset(layout.logo.offset, tier, orientation),
          fixedSize: true,
        })}
      />

      {/* Mascot */}
      <img
        src={mascot.path} alt="" data-overlay="image" data-image-type="mascot" draggable={false}
        className="pointer-events-none"
        style={positionStyle({
          position: mascotPosition,
          inset,
          size: mascotSize,
          offset: mascotOffset,
          opacity: mascotOpacity,
          sizingAxis: mascotSizingAxis,
        })}
      />

      {/* Convention banner */}
      {activeConvention && (
        <img
          src={activeConvention.bannerPath} alt="" data-overlay="image" data-image-type="convention" draggable={false}
          className="pointer-events-none"
          style={positionStyle({
            position: layout.convention.position,
            inset,
            size: bp(activeConvention.sizes, tier, orientation),
            offset: resolveOffset(activeConvention.offset, tier, orientation) ?? resolveOffset(layout.convention.offset, tier, orientation),
            opacity: activeConvention.opacity,
          })}
        />
      )}

      {/* Title */}
      <div
        data-overlay="title"
        className="absolute pointer-events-none drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]"
        style={{
          top: rem(titleTop),
          ...(logoOnRight
            ? { right: rem(inset + logoOffset.x + logoSize + titleFontSize) }
            : { left: rem(inset + logoOffset.x + logoSize + titleFontSize) }),
        }}
      >
        <span
          className="text-white/90 font-semibold tracking-[0.15em] uppercase leading-tight"
          style={{ fontSize: rem(titleFontSize) }}
        >
          Dutch Anime<br />Community
        </span>
      </div>

      {/* QR code */}
      <img
        src={QR_CODE.src} alt="" data-overlay="qr" draggable={false}
        className="pointer-events-none drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]"
        style={positionStyle({
          position: layout.qr.position,
          inset,
          size: { maxWidth: qrSize, maxHeight: qrSize },
          offset: resolveOffset(layout.qr.offset, tier, orientation),
          opacity: layout.qr.opacity,
          fixedSize: true,
        })}
      />

      {/* Date stamp */}
      <span
        data-overlay="date"
        className="absolute text-white/70 font-mono pointer-events-none z-10 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)] left-1/2 -translate-x-1/2"
        style={{ bottom: `${bp(layout.date.bottomPercent, tier, orientation)}%`, fontSize: rem(bp(layout.date.fontSize, tier, orientation)) }}
      >
        {new Date().toLocaleDateString("nl-NL", { day: "2-digit", month: "long", year: "numeric" })}
      </span>
    </>
  )
})