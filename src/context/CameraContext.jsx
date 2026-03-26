"use client"

import { createContext, useContext } from "react"

const CameraContext = createContext(null)

export function CameraProvider({ value, children }) {
  return <CameraContext.Provider value={value}>{children}</CameraContext.Provider>
}

export function useCameraContext() {
  const ctx = useContext(CameraContext)
  if (!ctx) throw new Error("useCameraContext must be used within CameraProvider")
  return ctx
}