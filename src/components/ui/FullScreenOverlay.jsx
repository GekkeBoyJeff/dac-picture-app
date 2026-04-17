"use client"

import Image from "next/image"
import { assetPath } from "@/lib/config/basePath"

/**
 * Shared base for full-screen overlays (splash, attract, etc.).
 * Provides the logo, title, and subtitle in a consistent layout.
 */
export function FullScreenOverlay({
  visible,
  bgClass = "bg-black",
  logoClass = "",
  children,
  footer,
}) {
  return (
    <div
      className={`absolute inset-0 z-30 flex flex-col items-center justify-center ${bgClass} transition-opacity duration-500 ${
        visible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      <Image
        src={assetPath("/overlays/logo.svg")}
        alt=""
        width={200}
        height={200}
        className={`w-32 h-32 md:w-40 md:h-40 ${logoClass}`}
        draggable={false}
      />

      <div className="mt-6 text-center">
        <h1 className="text-white text-2xl md:text-3xl font-bold tracking-[0.15em] uppercase font-display">
          Photo Booth
        </h1>
        <p className="text-white/40 text-sm mt-2 tracking-[0.2em] uppercase font-mono">
          Dutch Anime Community
        </p>
        <p className="text-white/30 text-[0.625rem] mt-1 font-mono">v{process.env.APP_VERSION}</p>
      </div>

      {children}

      {footer && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center">
          {footer}
        </div>
      )}
    </div>
  )
}
