"use client"

import { AppLoader } from "@/components/ui/AppLoader"

export function SplashOverlay({ visible }) {
  return <AppLoader absolute visible={visible} />
}