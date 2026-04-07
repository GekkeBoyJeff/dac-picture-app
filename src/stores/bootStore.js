import { create } from "zustand"

export const BOOT_STAGES = {
  HYDRATING: "hydrating",
  DEVICE_CHECK: "device_check",
  DEVICE_PROMPT: "device_prompt",
  CAMERA_STARTING: "camera_starting",
  READY: "ready",
  ERROR: "error",
}

export const useBootStore = create((set) => ({
  bootStage: BOOT_STAGES.HYDRATING,
  setBootStage: (bootStage) => set({ bootStage }),
}))