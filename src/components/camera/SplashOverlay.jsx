"use client"

import { FullScreenOverlay } from "@/components/ui/FullScreenOverlay"

const TIPS = [
  "Maak een peace-teken om de timer te starten",
  "Swipe door layouts voor de perfecte look",
  "Foto's worden automatisch naar Discord gestuurd",
  "Probeer de verschillende mascots!",
]

export function SplashOverlay({ visible }) {
  const tipIndex = 0

  return (
    <FullScreenOverlay
      visible={visible}
      logoClass="animate-splash-logo drop-shadow-[0_0_40px_rgba(230,193,137,0.3)]"
      footer={
        <>
          <div className="flex gap-1.5 animate-splash-text" style={{ animationDelay: "1s" }}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-white/50 animate-splash-dots"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
          <p
            className="text-white/30 text-xs md:text-sm text-center px-8 max-w-sm animate-splash-text mt-3"
            style={{ animationDelay: "0.8s" }}
          >
            {TIPS[tipIndex]}
          </p>
        </>
      }
    />
  )
}