"use client"

import { useEffect } from "react"
import { PhotoBooth } from "@/components/PhotoBooth"
import { DeviceSetupGate } from "@/components/DeviceSetupGate"
import { AppLoader } from "@/components/ui/AppLoader"
import { useHydrated } from "@/hooks/useHydrated"
import { BOOT_STAGES, useBootStore } from "@/stores/bootStore"
import { useCameraStore } from "@/features/camera/store"

const Home = () => {
  const hydrated = useHydrated()
  const bootStage = useBootStore((s) => s.bootStage)
  const setBootStage = useBootStore((s) => s.setBootStage)
  const isReady = useCameraStore((s) => s.isReady)
  const cameraError = useCameraStore((s) => s.error)

  useEffect(() => {
    if (!hydrated) {
      setBootStage(BOOT_STAGES.HYDRATING)
      return
    }

    if (bootStage === BOOT_STAGES.HYDRATING) {
      setBootStage(BOOT_STAGES.DEVICE_CHECK)
    }
  }, [hydrated, bootStage, setBootStage])

  useEffect(() => {
    if (!hydrated) return

    if (bootStage === BOOT_STAGES.CAMERA_STARTING && cameraError) {
      setBootStage(BOOT_STAGES.ERROR)
      return
    }

    if ((bootStage === BOOT_STAGES.CAMERA_STARTING || bootStage === BOOT_STAGES.ERROR) && isReady) {
      setBootStage(BOOT_STAGES.READY)
    }
  }, [hydrated, bootStage, isReady, cameraError, setBootStage])

  const showBootLoader =
    !isReady &&
    !cameraError &&
    (bootStage === BOOT_STAGES.HYDRATING ||
      bootStage === BOOT_STAGES.DEVICE_CHECK ||
      bootStage === BOOT_STAGES.CAMERA_STARTING)

  return (
    <>
      <DeviceSetupGate>
        <PhotoBooth />
      </DeviceSetupGate>
      <AppLoader visible={showBootLoader} />
    </>
  )
}

export default Home