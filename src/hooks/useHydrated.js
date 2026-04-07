import { useSyncExternalStore } from "react"

const emptySubscribe = () => () => {}

/**
 * Returns false during SSR/SSG and true after client hydration.
 * Prevents React error #418 caused by Zustand persist stores
 * rehydrating from localStorage with values that differ from
 * the server-rendered defaults.
 */
export function useHydrated() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  )
}