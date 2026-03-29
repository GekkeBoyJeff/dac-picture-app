"use client"

import { useEffect, useRef, useState } from "react"

const GESTURE_CONFIG = {
  Victory: { emoji: "\u270C\uFE0F", label: "Houd vast..." },
}

const CIRCUMFERENCE = 2 * Math.PI * 15
const DEBOUNCE_MS = 50

export function GestureIndicator({ gesture, holdProgressRef }) {
  const [visible, setVisible] = useState(false)
  const timerRef = useRef(null)
  const circleRef = useRef(null)
  const rafRef = useRef(0)

  useEffect(() => {
    clearTimeout(timerRef.current)
    if (gesture) {
      timerRef.current = setTimeout(() => setVisible(true), DEBOUNCE_MS)
    } else {
      setVisible(false)
    }
    return () => clearTimeout(timerRef.current)
  }, [gesture])

  // Drive circle fill from ref — own rAF loop, zero React re-renders
  useEffect(() => {
    if (!visible || !gesture) return

    const tick = () => {
      const circle = circleRef.current
      if (circle) {
        const progress = holdProgressRef?.current ?? 0
        circle.setAttribute("stroke-dasharray", `${progress * CIRCUMFERENCE} ${CIRCUMFERENCE}`)
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)

    return () => cancelAnimationFrame(rafRef.current)
  }, [visible, gesture, holdProgressRef])

  if (!visible || !gesture) return null

  const { emoji, label } = GESTURE_CONFIG[gesture]

  return (
    <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 px-4 py-2 rounded-full bg-white/15 backdrop-blur-md border border-white/20">
      <div className="relative w-9 h-9 flex items-center justify-center">
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 36 36">
          <circle
            cx="18" cy="18" r="15"
            fill="none"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="3"
          />
          <circle
            ref={circleRef}
            cx="18" cy="18" r="15"
            fill="none"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={`0 ${CIRCUMFERENCE}`}
          />
        </svg>
        <span className="text-xl">{emoji}</span>
      </div>
      <span className="text-white text-sm font-medium">{label}</span>
    </div>
  )
}
