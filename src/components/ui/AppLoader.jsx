"use client"

import Image from "next/image"
import { assetPath } from "@/lib/config/basePath"

export function AppLoader({ absolute = false, visible = true, label = "Laden..." }) {
  const baseClass = absolute ? "absolute inset-0 z-40" : "fixed inset-0 z-50"

  return (
    <div
      className={`${baseClass} flex flex-col items-center justify-center bg-black text-white transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      aria-live="polite"
      role="status"
    >
      <Image
        src={assetPath("/overlays/logo.svg")}
        alt=""
        width={120}
        height={120}
        className="h-20 w-20 opacity-55"
        draggable={false}
        priority
      />
      <div className="mt-5 h-6 w-6 rounded-full border-2 border-white/15 border-t-white/70 animate-spin" />
      <p className="mt-3 text-xs uppercase tracking-[0.22em] text-white/45">{label}</p>
    </div>
  )
}