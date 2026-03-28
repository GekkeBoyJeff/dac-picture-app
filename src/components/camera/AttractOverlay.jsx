"use client"

/**
 * Attract screen shown after a period of inactivity.
 *
 * Design: minimal dark scrim (no blur) so people clearly see themselves
 * on camera. Text uses drop-shadow for readability against any background.
 * Tapping, moving the mouse, or waving a hand dismisses it.
 */
export function AttractOverlay({ visible }) {
  return (
    <div
      className={`absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/30 transition-all duration-700 ${
        visible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      <p className="text-white/80 text-xl md:text-3xl font-semibold tracking-wide text-center drop-shadow-[0_2px_20px_rgba(0,0,0,0.9)] animate-attract-cta">
        Kom op de foto!
      </p>
      <p className="text-white/25 text-xs md:text-sm mt-2 tracking-widest uppercase drop-shadow-[0_1px_8px_rgba(0,0,0,0.9)] animate-attract-cta" style={{ animationDelay: "0.15s" }}>
        Photo Booth
      </p>
    </div>
  )
}
