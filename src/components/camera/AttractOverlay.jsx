"use client"

/**
 * Attract screen shown after a period of inactivity.
 *
 * Design: minimal dark scrim (no blur) so people clearly see themselves
 * on camera, lifted by a soft gold glow from below. A waving hand hints at
 * both touch and gesture control. Tapping, moving, or waving dismisses it.
 */
export function AttractOverlay({ visible }) {
  return (
    <div
      className={`absolute inset-0 z-30 flex flex-col items-center justify-end gap-3 pb-[24%] transition-all duration-700 max-lg:landscape:pb-[12%] ${
        visible ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
      style={{
        background:
          "radial-gradient(80% 55% at 50% 100%, rgba(230,193,137,0.14), transparent 70%), rgba(12,11,16,0.35)",
      }}
    >
      <span
        className="origin-[70%_70%] text-5xl animate-wave drop-shadow-[0_2px_16px_rgba(0,0,0,0.8)]"
        aria-hidden="true"
      >
        👋
      </span>
      <p className="animate-attract-cta text-center font-display text-2xl font-semibold tracking-tight text-ink drop-shadow-[0_2px_20px_rgba(0,0,0,0.9)] md:text-4xl">
        Kom op de foto!
      </p>
      <p
        className="animate-attract-cta text-center text-sm text-ink-muted drop-shadow-[0_1px_8px_rgba(0,0,0,0.9)] md:text-base"
        style={{ animationDelay: "0.15s" }}
      >
        Tik op het scherm of zwaai met je hand
      </p>
    </div>
  )
}