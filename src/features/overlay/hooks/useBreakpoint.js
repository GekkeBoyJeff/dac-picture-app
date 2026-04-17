"use client"

import { useSyncExternalStore } from "react"

/**
 * Computes breakpoint tier and orientation from the viewport.
 *
 * Tiers based on the smaller viewport dimension:
 *   - sm: minDim < 600
 *   - md: 600 - 1023
 *   - lg: >= 1024
 *
 * @returns {string} Serialized "tier|orientation" (e.g. "md|portrait")
 */
function getBreakpointSnapshot() {
  if (typeof document === "undefined") return "lg|landscape"
  const w = document.documentElement.clientWidth
  const h = document.documentElement.clientHeight
  const minDim = Math.min(w, h)
  const tier = minDim >= 1024 ? "lg" : minDim >= 600 ? "md" : "sm"
  const orientation = h > w ? "portrait" : "landscape"
  return `${tier}|${orientation}`
}

function getServerSnapshot() {
  return "lg|landscape"
}

function subscribeToResize(callback) {
  window.addEventListener("resize", callback)
  return () => window.removeEventListener("resize", callback)
}

/**
 * Orientation-aware breakpoint tier hook.
 *
 * Uses useSyncExternalStore to subscribe to resize events
 * without causing tearing or hydration mismatches.
 *
 * @returns {{ tier: "sm" | "md" | "lg", orientation: "portrait" | "landscape" }}
 */
export function useBreakpoint() {
  const raw = useSyncExternalStore(subscribeToResize, getBreakpointSnapshot, getServerSnapshot)
  const [tier, orientation] = raw.split("|")
  return { tier, orientation }
}

/**
 * Resolve a breakpoint-keyed object, with optional orientation override.
 * Looks for "tier-orientation" key first, then falls back to "tier".
 *
 * @param {object} obj - Object keyed by breakpoint (e.g. { sm: 1, md: 2, lg: 3 })
 * @param {string} tier - Current tier
 * @param {string} orientation - Current orientation
 * @returns {*}
 */
export function resolveBreakpoint(obj, tier, orientation) {
  return obj?.[`${tier}-${orientation}`] ?? obj?.[tier]
}