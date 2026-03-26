"use client"

import { createContext, useContext } from "react"

const ModalContext = createContext(null)

export function ModalProvider({ value, children }) {
  return <ModalContext.Provider value={value}>{children}</ModalContext.Provider>
}

export function useModalContext() {
  const ctx = useContext(ModalContext)
  if (!ctx) throw new Error("useModalContext must be used within ModalProvider")
  return ctx
}