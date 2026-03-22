"use client";

import { useState, useEffect } from "react";
import { OVERLAYS, CORNERS, CORNER_SIZES, QR_CODE, TITLE_SIZES, DATE_STAMP } from "@/lib/config";
import { getOverlayClassName } from "@/lib/overlayStyles";
import { getBreakpoint, type Breakpoint } from "@/lib/overlayPosition";
import type { OverlayConfig } from "@/lib/types";

function useBreakpoint(): Breakpoint {
  // Start with server-safe default; update immediately on mount to avoid
  // hydration mismatch between server ("lg") and client (actual).
  const [bp, setBp] = useState<Breakpoint>("lg");

  useEffect(() => {
    const update = () => setBp(getBreakpoint());
    update(); // set correct value on first mount
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return bp;
}

function rem(value: number): string {
  return `${value}rem`;
}

function getOverlayStyleForBp(config: OverlayConfig, bp: Breakpoint): React.CSSProperties {
  if (config.position === "full") {
    return { position: "absolute", inset: 0, width: "100%", height: "100%" };
  }

  const { maxWidth, maxHeight, padding } = config.sizes[bp];

  const style: React.CSSProperties = {
    position: "absolute",
    opacity: config.opacity,
    pointerEvents: "none",
  };

  if (config.fixedSize) {
    style.width = rem(maxWidth);
    style.height = rem(maxHeight);
  } else if (maxHeight > maxWidth * 1.5) {
    style.maxHeight = rem(maxHeight);
    style.width = "auto";
    style.maxWidth = rem(maxWidth);
  } else {
    style.width = rem(maxWidth);
    style.height = "auto";
    style.maxHeight = rem(maxHeight);
    style.objectFit = "contain";
  }

  if (config.position.includes("top")) style.top = rem(padding);
  if (config.position.includes("bottom")) style.bottom = rem(padding);
  if (config.position.includes("left")) style.left = rem(padding);
  if (config.position.includes("right")) style.right = rem(padding);

  if (config.position === "middle-right") {
    style.right = rem(padding);
    style.top = "50%";
    style.transform = "translateY(-50%)";
  }

  return style;
}

export function Overlays() {
  const bp = useBreakpoint();
  const corner = CORNER_SIZES[bp];
  const qr = QR_CODE.sizes[bp];
  const title = TITLE_SIZES[bp];
  const date = DATE_STAMP[bp];

  return (
    <>
      {/* Vignettes — drawn procedurally on canvas, not measured from DOM */}
      <div
        data-overlay="vignette-radial"
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.4) 100%)",
        }}
      />
      <div data-overlay="vignette-bottom" className="absolute bottom-0 left-0 right-0 h-[45%] pointer-events-none bg-linear-to-t from-black/50 via-black/20 to-transparent" />
      <div data-overlay="vignette-top" className="absolute top-0 left-0 right-0 h-[20%] pointer-events-none bg-linear-to-b from-black/40 to-transparent" />

      {/* Corners */}
      {CORNERS.map((c) => {
        const style: React.CSSProperties = {
          width: rem(corner.size),
          height: rem(corner.size),
        };
        if (c.position.includes("top")) style.top = rem(corner.offset);
        if (c.position.includes("bottom")) style.bottom = rem(corner.offset);
        if (c.position.includes("left")) style.left = rem(corner.offset);
        if (c.position.includes("right")) style.right = rem(corner.offset);
        return (
          <img
            key={c.src}
            src={c.src}
            alt=""
            data-overlay="corner"
            draggable={false}
            className="absolute pointer-events-none"
            style={style}
          />
        );
      })}

      {/* Main overlays */}
      {OVERLAYS.map((config) => (
        <img
          key={config.path}
          src={config.path}
          alt=""
          data-overlay="image"
          style={getOverlayStyleForBp(config, bp)}
          className={getOverlayClassName(config)}
          draggable={false}
        />
      ))}

      {/* Title */}
      <div
        data-overlay="title"
        className="absolute flex items-center gap-3 pointer-events-none drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]"
        style={{ top: rem(title.top), left: rem(title.left) }}
      >
        <span
          className="text-white/90 font-semibold tracking-[0.15em] uppercase leading-tight"
          style={{ fontSize: rem(title.fontSize) }}
        >
          Dutch Anime<br />Community
        </span>
      </div>

      {/* QR code */}
      <img
        src={QR_CODE.src}
        alt=""
        data-overlay="qr"
        draggable={false}
        className="absolute pointer-events-none drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]"
        style={{
          top: rem(qr.top),
          left: rem(qr.left),
          width: rem(qr.size),
          height: rem(qr.size),
          opacity: QR_CODE.opacity,
        }}
      />

      {/* Date stamp */}
      <span
        data-overlay="date"
        className="absolute text-white/70 font-mono pointer-events-none z-10 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)] left-1/2 -translate-x-1/2"
        style={{ bottom: `${date.bottomPercent}%`, fontSize: rem(date.fontSize) }}
      >
        {new Date().toLocaleDateString("nl-NL", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })}
      </span>
    </>
  );
}
