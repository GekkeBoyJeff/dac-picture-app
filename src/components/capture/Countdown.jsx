"use client"

import { useEffect, useState, useRef } from "react"

export function Countdown({ seconds, onComplete, showLookUp = false }) {
  const [count, setCount] = useState(seconds)
  const firedRef = useRef(false)

  useEffect(() => {
    if (count <= 0) {
      if (!firedRef.current) {
        firedRef.current = true
        onComplete()
      }
      return
    }

    const timer = setTimeout(() => {
      setCount((c) => c - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [count, onComplete])

  if (count <= 0) return null

  return (
    <div className="fixed inset-0 z-40 flex flex-col items-center justify-center pointer-events-none">
      {showLookUp && (
        <span className="absolute top-[18%] left-1/2 -translate-x-1/2 text-white/80 text-lg md:text-2xl font-semibold tracking-wide drop-shadow-[0_0_20px_rgba(0,0,0,0.8)] animate-pulse whitespace-nowrap">
          Kijk naar de webcam 📸
        </span>
      )}
      <span
        key={count}
        className="text-[6rem] md:text-[12rem] font-black text-white drop-shadow-[0_0_40px_rgba(0,0,0,0.8)] animate-countdown select-none"
      >
        {count}
      </span>
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2">
        <span className="text-white/40 text-xs md:text-sm drop-shadow-[0_0_10px_rgba(0,0,0,0.8)]">
          Druk opnieuw om te annuleren
        </span>
      </div>
    </div>
  )
}