"use client"

import { PhotoBooth } from "@/components/PhotoBooth"
import { useHydrated } from "@/hooks/useHydrated"

const Home = () => {
  const hydrated = useHydrated()
  if (!hydrated) return null
  return <PhotoBooth />
}

export default Home
