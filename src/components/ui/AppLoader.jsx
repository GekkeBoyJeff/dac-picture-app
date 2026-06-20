"use client"

import Image from "next/image"
import { assetPath } from "@/lib/config/basePath"
import { Spinner } from "@/components/ui/Spinner"

export function AppLoader({ absolute = false, visible = true, label = "Laden..." }) {
  const baseClass = absolute ? "absolute inset-0 z-40" : "fixed inset-0 z-50"

  return (
    <div
      className={`${baseClass} flex flex-col items-center justify-center bg-ground text-ink transition-opacity duration-300 ${
        visible ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
      aria-live="polite"
      role="status"
    >
      <Image
        src={assetPath("/overlays/logo.svg")}
        alt=""
        width={120}
        height={120}
        className="h-24 w-24 opacity-80 drop-shadow-[0_0_30px_rgba(230,193,137,0.25)]"
        draggable={false}
        priority
      />
      <Spinner className="mt-6 h-6 w-6" />
      <p className="mt-3 text-xs uppercase tracking-[0.22em] text-ink-muted">{label}</p>
    </div>
  )
}