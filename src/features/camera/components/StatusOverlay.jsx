"use client"

import { memo, useMemo, useState, useEffect, useRef } from "react"
import { Spinner } from "@/components/ui/Spinner"
import { pickRandom } from "@/lib/random"

/**
 * Lightweight status overlay shown during camera recalibration or switching.
 * Pi-safe: opaque background, no backdrop-blur.
 */
export const StatusOverlay = memo(function StatusOverlay({
  visible,
  messages,
  backdrop = "bg-black/70",
}) {
  const list = useMemo(() => (Array.isArray(messages) ? messages : [messages]), [messages])
  const cycles = list.length > 1

  const [message, setMessage] = useState(list[0])
  const displayMessage = cycles ? message : list[0]
  const [tick, setTick] = useState(0)
  const intervalRef = useRef(null)

  useEffect(() => {
    const pickNextMessage = () => {
      setMessage((prev) => pickRandom(list, prev))
      setTick((t) => t + 1)
    }

    if (!visible || !cycles) {
      clearInterval(intervalRef.current)
      return
    }

    pickNextMessage()
    intervalRef.current = setInterval(pickNextMessage, 1200)

    return () => {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [visible, cycles, list])

  return (
    <div
      className={`absolute inset-0 z-30 flex items-center justify-center transition-opacity duration-300 ${backdrop} ${
        visible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      <div className="flex items-center gap-3 px-5 py-3 rounded-none bg-black border border-white/20">
        <Spinner />
        <p
          key={`${displayMessage}-${tick}`}
          className="text-white/60 text-sm font-mono"
          style={cycles ? { animation: "splash-text 0.3s ease-out" } : undefined}
        >
          {displayMessage}
        </p>
      </div>
    </div>
  )
})
