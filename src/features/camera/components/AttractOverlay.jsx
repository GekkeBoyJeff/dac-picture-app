"use client"

/**
 * Attract screen shown after a period of inactivity.
 *
 * Design: BIG typography, minimal dark scrim (no blur -- Pi safe).
 * Tapping, moving, or waving a hand dismisses it.
 */
export function AttractOverlay({ visible }) {
  return (
    <div
      className={`absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/70 transition-all duration-700 ${
        visible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      <p className="text-white text-4xl md:text-7xl font-black tracking-[0.1em] uppercase text-center font-display animate-attract-cta">
        KOM OP DE FOTO
      </p>
      <p
        className="text-white/40 text-xs md:text-sm mt-4 tracking-[0.3em] uppercase font-mono animate-attract-cta"
        style={{ animationDelay: "0.15s" }}
      >
        Photo Booth
      </p>
    </div>
  )
}
