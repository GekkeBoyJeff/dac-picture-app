"use client"

import { createContext, useContext } from "react"

const OverlayContext = createContext(null)

export function OverlayProvider({ value, children }) {
  return <OverlayContext.Provider value={value}>{children}</OverlayContext.Provider>
}

export function useOverlayContext() {
  const ctx = useContext(OverlayContext)
  if (!ctx) throw new Error("useOverlayContext must be used within OverlayProvider")
  return ctx
}