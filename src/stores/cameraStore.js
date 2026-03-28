import { create } from "zustand"

export const useCameraStore = create((set) => ({
  isReady: false,
  isRecalibrating: false,
  isSwitching: false,
  isMirrored: true,
  error: null,
  devices: [],
  selectedDeviceId: null,

  setReady: (isReady) => set({ isReady }),
  setRecalibrating: (isRecalibrating) => set({ isRecalibrating }),
  setSwitching: (isSwitching) => set({ isSwitching }),
  setMirrored: (isMirrored) => set({ isMirrored }),
  setError: (error) => set({ error }),
  setDevices: (devices) => set({ devices }),
  setSelectedDevice: (selectedDeviceId) => set({ selectedDeviceId }),
}))