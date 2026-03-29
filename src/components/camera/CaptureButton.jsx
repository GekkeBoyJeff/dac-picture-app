"use client"

import { useUiStore } from "@/stores/uiStore"
import { useCameraStore } from "@/stores/cameraStore"
import { STRIP_PHOTO_COUNT } from "@/lib/config"

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
      aria-label={isCounting ? "Annuleren" : stripModeEnabled ? `Strip foto maken (${STRIP_PHOTO_COUNT}x)` : "Maak foto"}
    >
      <div
        className={`w-20 h-20 md:w-24 md:h-24 rounded-full backdrop-blur-md border-2 flex items-center justify-center transition-all hover:scale-105 active:scale-95 ${
          isCounting
            ? "bg-red-500/10 border-red-400/60"
            : disabled
              ? "bg-white/10 border-white/50 opacity-40"
              : stripModeEnabled
                ? "bg-violet-400/10 border-violet-400/60 animate-shutter-pulse"
                : "bg-white/10 border-white/50 animate-shutter-pulse"
        }`}
      >
        {isCounting ? (
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-sm bg-red-400 group-hover:bg-red-300 transition-colors" />
        ) : (
          <div className={`rounded-full transition-colors ${
            stripModeEnabled
              ? "w-12 h-12 md:w-14 md:h-14 bg-violet-400/80 group-hover:bg-violet-400/70"
              : "w-14 h-14 md:w-16 md:h-16 bg-white group-hover:bg-white/90"
          }`}>
            {stripModeEnabled && (
              <span className="flex items-center justify-center w-full h-full text-white font-bold text-lg md:text-xl select-none">
                {STRIP_PHOTO_COUNT}
              </span>
            )}
          </div>
        )}
      </div>
    </button>
  )
}
