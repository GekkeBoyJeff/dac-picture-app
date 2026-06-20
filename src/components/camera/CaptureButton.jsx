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
  const live = !isCounting && !disabled

  return (
    <button
      onClick={onCapture}
      disabled={disabled}
      className="group pointer-events-auto absolute bottom-[12%] left-1/2 z-10 -translate-x-1/2 cursor-pointer disabled:cursor-not-allowed min-[1200px]:hidden max-lg:landscape:bottom-auto max-lg:landscape:left-auto max-lg:landscape:right-[8%] max-lg:landscape:top-1/2 max-lg:landscape:translate-x-0 max-lg:landscape:-translate-y-1/2"
      aria-label={
        isCounting
          ? "Annuleren"
          : stripModeEnabled
            ? `Strip foto maken (${STRIP_PHOTO_COUNT}x)`
            : "Maak foto"
      }
    >
      {/* The light: a soft gold spotlight breathing behind the button */}
      {live && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full animate-spotlight md:h-52 md:w-52"
          style={{
            background:
              "radial-gradient(circle, rgba(230,193,137,0.34), rgba(230,193,137,0.07) 45%, transparent 70%)",
          }}
        />
      )}

      <span
        className={`flex h-20 w-20 items-center justify-center rounded-full border-2 transition-all duration-200 group-hover:scale-105 group-active:scale-95 md:h-24 md:w-24 ${
          isCounting
            ? "border-danger/70 bg-danger/15"
            : disabled
              ? "border-hairline-strong bg-surface opacity-40"
              : "border-gold/70 bg-gold/10 shadow-[0_0_0_1px_rgba(230,193,137,0.35),0_0_36px_rgba(230,193,137,0.4)]"
        }`}
      >
        {isCounting ? (
          <span className="h-8 w-8 rounded-[0.4rem] bg-danger transition-colors group-hover:bg-danger/80 md:h-10 md:w-10" />
        ) : disabled ? (
          <span className="h-14 w-14 rounded-full bg-ink/25 md:h-16 md:w-16" />
        ) : (
          <span
            className={`flex items-center justify-center rounded-full bg-linear-to-b from-gold-strong via-gold to-gold-deep transition-all group-hover:brightness-105 ${
              stripModeEnabled ? "h-12 w-12 md:h-14 md:w-14" : "h-14 w-14 md:h-16 md:w-16"
            }`}
          >
            {stripModeEnabled && (
              <span className="select-none text-lg font-bold text-[#1b1407] md:text-xl">
                {STRIP_PHOTO_COUNT}
              </span>
            )}
          </span>
        )}
      </span>
    </button>
  )
}