"use client"

import { useEffect, useState, useRef } from "react"
import { playCountdownTick, playCountdownFinal } from "@/lib/audio"

export function Countdown({ seconds, onComplete, showLookUp = false }) {
  const [count, setCount] = useState(seconds)
  const firedRef = useRef(false)
  const onCompleteRef = useRef(onComplete)

  // Keep ref in sync — avoids putting onComplete in effect deps
  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  // Play beep on each count change
  useEffect(() => {
    if (count <= 0) return
    if (count === 1) {
      playCountdownFinal()
    } else {
      playCountdownTick()
    }
  }, [count])

  useEffect(() => {
    if (count <= 0) {
      if (!firedRef.current) {
        firedRef.current = true
        onCompleteRef.current()
      }
      return
    }

    const timer = setTimeout(() => {
      setCount((c) => c - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [count])

  if (count <= 0) return null

  return (
    <div className="fixed inset-0 z-40 flex flex-col items-center justify-center pointer-events-none">
      {showLookUp && (
        <span className="absolute top-[18%] left-1/2 -translate-x-1/2 text-gold text-lg md:text-2xl font-display font-semibold tracking-wide [text-shadow:0_0_24px_rgba(230,193,137,0.55),0_2px_8px_rgba(0,0,0,0.6)] whitespace-nowrap">
          Kijk naar de webcam 📸
        </span>
      )}
      <span
        key={count}
        className="text-[6rem] md:text-[12rem] font-display font-bold text-gold-strong [text-shadow:0_0_60px_rgba(230,193,137,0.6),0_0_24px_rgba(242,214,164,0.5)] animate-countdown select-none"
      >
        {count}
      </span>
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2">
        <span className="text-ink-muted text-xs md:text-sm [text-shadow:0_2px_8px_rgba(0,0,0,0.7)]">
          Druk opnieuw om te annuleren
        </span>
      </div>
    </div>
  )
}