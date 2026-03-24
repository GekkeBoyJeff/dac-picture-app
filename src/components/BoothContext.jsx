"use client";

import { createContext, useContext } from "react";

const BoothContext = createContext(null);

export function BoothProvider({ value, children }) {
  return <BoothContext value={value}>{children}</BoothContext>;
}

export function useBooth() {
  const ctx = useContext(BoothContext);
  if (!ctx) throw new Error("useBooth must be used within BoothProvider");
  return ctx;
}
