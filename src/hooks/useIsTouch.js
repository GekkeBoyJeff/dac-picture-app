"use client"

import { useState, useEffect } from "react"

const QUERIES = ["(pointer: coarse)", "(hover: none)"]

function computeIsTouch() {
  if (typeof window === "undefined") return false
  const byMedia =
    typeof window.matchMedia === "function" && QUERIES.some((q) => window.matchMedia(q).matches)
  const byTouchPoints = typeof navigator !== "undefined" && (navigator.maxTouchPoints || 0) > 0
  return byMedia || byTouchPoints
}

/**
 * SSR-safe touch detection. Returns `false` during SSR / first client render
 * (so server and client markup match — see useHydrated), then resolves on
 * mount and updates when the coarse-pointer / no-hover media queries change.
 */
export function useIsTouch() {
  const [isTouch, setIsTouch] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return undefined
    const update = () => setIsTouch(computeIsTouch())
    update()
    if (typeof window.matchMedia !== "function") return undefined
    const mqls = QUERIES.map((q) => window.matchMedia(q))
    mqls.forEach((mql) => mql.addEventListener?.("change", update))
    return () => {
      mqls.forEach((mql) => mql.removeEventListener?.("change", update))
    }
  }, [])

  return isTouch
}
