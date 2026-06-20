"use client"

import Image from "next/image"
import { assetPath } from "@/lib/config/basePath"

/**
 * Shared base for full-screen overlays (splash, attract, etc.).
 * Provides the logo, title, and subtitle in a consistent layout.
 *
 * @param {object} props
 * @param {boolean} props.visible
 * @param {string} [props.bgClass="bg-ground"] - Background class
 * @param {string} [props.logoClass] - Extra classes for the logo image
 * @param {React.ReactNode} [props.children] - Content below the title block
 * @param {React.ReactNode} [props.footer] - Content at the absolute bottom
 */
export function FullScreenOverlay({
  visible,
  bgClass = "bg-ground",
  logoClass = "",
  children,
  footer,
}) {
  return (
    <div
      className={`absolute inset-0 z-30 flex flex-col items-center justify-center ${bgClass} transition-opacity duration-500 ${
        visible ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      <Image
        src={assetPath("/overlays/logo.svg")}
        alt=""
        width={200}
        height={200}
        className={`h-32 w-32 drop-shadow-[0_0_40px_rgba(230,193,137,0.25)] md:h-40 md:w-40 ${logoClass}`}
        draggable={false}
      />

      <div className="mt-6 text-center">
        <h1 className="font-display text-2xl font-semibold uppercase tracking-[0.15em] text-ink md:text-3xl">
          Photo Booth
        </h1>
        <p className="mt-2 text-sm tracking-wide text-gold">Dutch Anime Community</p>
        <p className="mt-1 text-[0.625rem] text-ink-dim">v{process.env.APP_VERSION}</p>
      </div>

      {children}

      {footer && (
        <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center">
          {footer}
        </div>
      )}
    </div>
  )
}