import { create } from "zustand"

export const useCameraStore = create((set) => ({
  isReady: false,
  isMirrored: true,
  error: null,
  devices: [],
  selectedDeviceId: null,
  isRecalibrating: false,
  isSwitching: false,

  setReady: (isReady) => set({ isReady }),
  setMirrored: (isMirrored) => set({ isMirrored }),
  setError: (error) => set({ error }),
  setDevices: (devices) => set({ devices }),
  setSelectedDevice: (selectedDeviceId) => set({ selectedDeviceId }),
  setRecalibrating: (isRecalibrating) => set({ isRecalibrating }),
  setSwitching: (isSwitching) => set({ isSwitching }),
}))

// -- Selectors --

export const selectCameraReady = (state) => state.isReady
export const selectCameraMirrored = (state) => state.isMirrored
export const selectCameraError = (state) => state.error
export const selectCameraDevices = (state) => state.devices
export const selectSelectedDeviceId = (state) => state.selectedDeviceId
export const selectIsRecalibrating = (state) => state.isRecalibrating
export const selectIsSwitching = (state) => state.isSwitching