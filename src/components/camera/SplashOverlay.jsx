"use client"

import Image from "next/image"
import { useMemo } from "react"
import { assetPath } from "@/lib/config/basePath"

const TIPS = [
  "Maak een peace-teken om de timer te starten",
  "Swipe door layouts voor de perfecte look",
  "Foto's worden automatisch naar Discord gestuurd",
  "Probeer de verschillende mascots!",
]

export function SplashOverlay({ visible }) {
  // Deterministic tip to avoid SSR/CSR hydration mismatches
  const tipIndex = useMemo(() => 0, [])

  return (
    <div
      className={`absolute inset-0 z-30 flex flex-col items-center justify-center bg-black transition-opacity duration-600 pointer-events-none ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      <Image
        src={assetPath("/overlays/logo.svg")}
        alt=""
        width={160}
        height={160}
        className="w-32 h-32 md:w-40 md:h-40 animate-splash-logo drop-shadow-[0_0_40px_rgba(230,193,137,0.3)]"
        draggable={false}
      />

      <div className="mt-6 text-center animate-splash-text" style={{ animationDelay: "0.4s" }}>
        <h1 className="text-white text-2xl md:text-3xl font-semibold tracking-[0.15em] uppercase">
          Photo Booth
        </h1>
        <p className="text-white/40 text-sm mt-2 tracking-wide">
          Dutch Anime Community
        </p>
        <p className="text-white/20 text-[10px] mt-1">v1.0.1</p>
      </div>

      <p
        className="absolute bottom-12 text-white/30 text-xs md:text-sm text-center px-8 max-w-sm animate-splash-text"
        style={{ animationDelay: "0.8s" }}
      >
        {TIPS[tipIndex]}
      </p>

      <div
        className="absolute bottom-6 flex gap-1.5 animate-splash-text"
        style={{ animationDelay: "1s" }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-white/50 animate-splash-dots"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
    </div>
  )
}