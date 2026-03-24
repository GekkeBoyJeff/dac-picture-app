"use client";

import { memo, useState, useEffect, useSyncExternalStore } from "react";
import { CORNERS, LOGO, QR_CODE } from "@/lib/config";
import { useBooth } from "../BoothContext";

// Uses shortest screen dimension so a phone in landscape still gets "sm" sizing.
function getBreakpoint() {
  if (typeof document === "undefined") return "lg";
  const minDim = Math.min(
    document.documentElement.clientWidth,
    document.documentElement.clientHeight,
  );
  if (minDim >= 1024) return "lg";
  if (minDim >= 600) return "md";
  return "sm";
}

function subscribe(cb) {
  window.addEventListener("resize", cb);
  return () => window.removeEventListener("resize", cb);
}

function useBreakpoint() {
  return useSyncExternalStore(subscribe, getBreakpoint, () => "lg");
}

function rem(v) {
  return `${v}rem`;
}

/**
 * Positions an element in its corner/edge using the layout's universal inset.
 * Every element gets the same distance from the screen edge — no per-element padding.
 */
function positionStyle(position, inset, size, opts) {
  if (position === "full") {
    return { position: "absolute", inset: 0, width: "100%", height: "100%" };
  }

  const { maxWidth, maxHeight } = size;
  const style = {
    position: "absolute",
    pointerEvents: "none",
  };

  if (opts?.opacity !== undefined) style.opacity = opts.opacity;

  // Sizing
  if (opts?.fixedSize) {
    style.width = rem(maxWidth);
    style.height = rem(maxHeight);
  } else if (maxHeight > maxWidth * 1.5) {
    // Tall images: constrain height first
    style.maxHeight = rem(maxHeight);
    style.width = "auto";
    style.maxWidth = rem(maxWidth);
  } else {
    // Wide/square images: constrain width, auto height
    style.width = rem(maxWidth);
    style.height = "auto";
    style.maxHeight = rem(maxHeight);
    style.objectFit = "contain";
  }

  // Per-element padding overrides the layout's universal inset when specified
  const edge = rem(opts?.padding ?? inset);
  if (position.includes("top")) style.top = edge;
  if (position.includes("bottom")) style.bottom = edge;
  if (position.includes("left")) style.left = edge;
  if (position.includes("right")) style.right = edge;

  if (position === "middle-right") {
    style.right = edge;
    style.top = "50%";
    style.transform = "translateY(-50%)";
  }

  return style;
}

export const Overlays = memo(function Overlays() {
  const { layout, mascot, activeConvention } = useBooth();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const bp = useBreakpoint();

  if (!mounted) return null;

  const inset = layout.inset[bp];
  const logoSize = layout.logo.size[bp];
  const titleFontSize = layout.title.fontSize[bp];
  const cornerSize = layout.corners.size[bp];
  const qrSize = layout.qr.size[bp];

  // Title aligns next to the logo, vertically centered with it.
  // When the logo is on the right, the title sits to its left instead.
  const logoInset = layout.logo.padding?.[bp] ?? inset;
  const titleHeight = titleFontSize * 2.2;
  const titleTop = logoInset + (logoSize - titleHeight) / 2;
  const logoOnRight = layout.logo.position.includes("right");

  return (
    <>
      {/* Vignettes — CSS on screen, drawn procedurally on canvas by compositePhoto */}
      <div data-overlay="vignette-radial" className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.4) 100%)" }} />
      <div data-overlay="vignette-bottom" className="absolute bottom-0 left-0 right-0 h-[45%] pointer-events-none bg-linear-to-t from-black/50 via-black/20 to-transparent" />
      <div data-overlay="vignette-top" className="absolute top-0 left-0 right-0 h-[20%] pointer-events-none bg-linear-to-b from-black/40 to-transparent" />

      {/* Corners — same inset as everything else */}
      {CORNERS.map((c) => {
        const cornerEdge = layout.corners.padding?.[bp] ?? inset;
        const style = { width: rem(cornerSize), height: rem(cornerSize) };
        if (c.position.includes("top")) style.top = rem(cornerEdge);
        if (c.position.includes("bottom")) style.bottom = rem(cornerEdge);
        if (c.position.includes("left")) style.left = rem(cornerEdge);
        if (c.position.includes("right")) style.right = rem(cornerEdge);
        return (
          <img key={c.src} src={c.src} alt="" data-overlay="corner" draggable={false}
            className="absolute pointer-events-none" style={style} />
        );
      })}

      {/* Logo */}
      <img
        src={LOGO.src} alt="" data-overlay="image" draggable={false}
        className="pointer-events-none"
        style={positionStyle(layout.logo.position, inset, { maxWidth: logoSize, maxHeight: logoSize }, { fixedSize: true, padding: layout.logo.padding?.[bp] })}
      />

      {/* Mascot */}
      <img
        src={mascot.path} alt="" data-overlay="image" draggable={false}
        className="pointer-events-none"
        style={positionStyle(layout.mascot.position, inset, layout.mascot.sizes[bp], { opacity: layout.mascot.opacity, padding: layout.mascot.padding?.[bp] })}
      />

      {/* Convention banner — only when a convention is active today */}
      {activeConvention && (
        <img
          src={activeConvention.bannerPath} alt="" data-overlay="image" draggable={false}
          className="pointer-events-none"
          style={positionStyle(layout.convention.position, inset, activeConvention.sizes[bp], { opacity: activeConvention.opacity, padding: activeConvention.padding?.[bp] ?? layout.convention.padding?.[bp] })}
        />
      )}

      {/* Title — positioned relative to the logo so they always align */}
      <div
        data-overlay="title"
        className="absolute pointer-events-none drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]"
        style={{
          top: rem(titleTop),
          ...(logoOnRight
            ? { right: rem(logoInset + logoSize + titleFontSize) }
            : { left: rem(logoInset + logoSize + titleFontSize) }),
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
        style={positionStyle(layout.qr.position, inset, { maxWidth: qrSize, maxHeight: qrSize }, { opacity: layout.qr.opacity, fixedSize: true, padding: layout.qr.padding?.[bp] })}
      />

      {/* Date stamp */}
      <span
        data-overlay="date"
        className="absolute text-white/70 font-mono pointer-events-none z-10 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)] left-1/2 -translate-x-1/2"
        style={{ bottom: `${layout.date.bottomPercent[bp]}%`, fontSize: rem(layout.date.fontSize[bp]) }}
      >
        {new Date().toLocaleDateString("nl-NL", { day: "2-digit", month: "long", year: "numeric" })}
      </span>
    </>
  );
});
