"use client"

import { useEffect, useState, useRef } from "react"
import { playCountdownTick, playCountdownFinal } from "@/lib/audio"

export function Countdown({ seconds, onComplete, showLookUp = false }) {
  const [count, setCount] = useState(seconds)
  const firedRef = useRef(false)
  const onCompleteRef = useRef(onComplete)

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
        <span className="absolute top-[18%] left-1/2 -translate-x-1/2 text-white/80 text-lg md:text-2xl font-bold tracking-[0.2em] uppercase font-display whitespace-nowrap">
          Kijk naar de webcam
        </span>
      )}
      <span
        key={count}
        className="text-[8rem] md:text-[14rem] font-black text-[#e6c189] font-display animate-countdown select-none"
      >
        {count}
      </span>
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2">
        <span className="text-white/40 text-xs md:text-sm font-mono tracking-[0.15em] uppercase">
          Druk opnieuw om te annuleren
        </span>
      </div>
    </div>
  )
}
