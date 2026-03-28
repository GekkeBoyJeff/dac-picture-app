"use client"

import Image from "next/image"
import { assetPath } from "@/lib/config/basePath"

/**
 * Shared base for full-screen overlays (splash, attract, etc.).
 * Provides the logo, title, and subtitle in a consistent layout.
 *
 * @param {object} props
 * @param {boolean} props.visible
 * @param {string} [props.bgClass="bg-black"] - Background class
 * @param {string} [props.logoClass] - Extra classes for the logo image
 * @param {React.ReactNode} [props.children] - Content below the title block
 * @param {React.ReactNode} [props.footer] - Content at the absolute bottom
 */
export function FullScreenOverlay({ visible, bgClass = "bg-black", logoClass = "", children, footer }) {
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
        <h1 className="text-white text-2xl md:text-3xl font-semibold tracking-[0.15em] uppercase">
          Photo Booth
        </h1>
        <p className="text-white/40 text-sm mt-2 tracking-wide">
          Dutch Anime Community
        </p>
        <p className="text-white/20 text-[0.625rem] mt-1">v{process.env.APP_VERSION}</p>
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
