"use client"

import { useUiStore } from "@/stores/uiStore"
import { useCameraStore } from "@/features/camera/store"
import { STRIP_PHOTO_COUNT } from "@/lib/config"

/**
 * Center bottom shutter button.
 * Normal mode: white inner circle with pulse.
 * Strip mode: gold with count badge.
 * Countdown active: red stop square.
 * Touch target: 5rem (80px) for cosplay gloves.
 */
export function CaptureButton({ onCapture }) {
  const appState = useUiStore((s) => s.appState)
  const isReady = useCameraStore((s) => s.isReady)
  const stripModeEnabled = useUiStore((s) => s.stripModeEnabled)
  const isCounting = appState === "countdown"
  const disabled = !isReady || appState === "capturing"

  return (
    <button
      onClick={onCapture}
      disabled={disabled}
      className="pointer-events-auto absolute bottom-[12%] left-1/2 -translate-x-1/2 max-lg:landscape:bottom-auto max-lg:landscape:left-auto max-lg:landscape:translate-x-0 max-lg:landscape:right-[8%] max-lg:landscape:top-1/2 max-lg:landscape:-translate-y-1/2 z-10 cursor-pointer disabled:cursor-not-allowed group"
      aria-label={
        isCounting
          ? "Annuleren"
          : stripModeEnabled
            ? `Strip foto maken (${STRIP_PHOTO_COUNT}x)`
            : "Maak foto"
      }
    >
      <div
        className={`w-20 h-20 md:w-24 md:h-24 rounded-full border-2 flex items-center justify-center transition-all hover:scale-105 active:scale-95 ${
          isCounting
            ? "bg-black border-white/60"
            : disabled
              ? "bg-black border-white/40 opacity-40"
              : stripModeEnabled
                ? "bg-black border-[#e6c189] animate-shutter-pulse"
                : "bg-black border-white/50 animate-shutter-pulse"
        }`}
      >
        {isCounting ? (
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-sm bg-white group-hover:bg-white/80 transition-colors" />
        ) : (
          <div
            className={`rounded-full transition-colors ${
              stripModeEnabled
                ? "w-12 h-12 md:w-14 md:h-14 bg-[#e6c189] group-hover:bg-[#d4af72]"
                : "w-14 h-14 md:w-16 md:h-16 bg-white group-hover:bg-white/90"
            }`}
          >
            {stripModeEnabled && (
              <span className="flex items-center justify-center w-full h-full text-black font-bold text-lg md:text-xl select-none font-mono">
                {STRIP_PHOTO_COUNT}
              </span>
            )}
          </div>
        )}
      </div>
    </button>
  )
}
