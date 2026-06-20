// Settings data + formatters, extracted from SettingsDrawer so the UI stays thin.

export const gesturePresets = [
  {
    label: "Realtime",
    detectionInterval: 0,
    triggerMinScore: 0.25,
    note: "Max snelheid, meer CPU",
  },
  { label: "Gebalanceerd", detectionInterval: 120, triggerMinScore: 0.35, note: "Standaard" },
  {
    label: "Spaarstand",
    detectionInterval: 400,
    triggerMinScore: 0.5,
    note: "Rustiger voor batterij",
  },
]

export const scenePresets = [
  {
    id: "convention",
    label: "Conventie",
    note: "Drukke omgeving",
    numHands: 8,
    minDetectionConfidence: 0.4,
    minPresenceConfidence: 0.4,
    minTrackingConfidence: 0.4,
  },
  {
    id: "booth",
    label: "Photobooth",
    note: "Vaste camera",
    numHands: 4,
    minDetectionConfidence: 0.5,
    minPresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
  },
  {
    id: "mobile",
    label: "Mobiel",
    note: "Telefoon of tablet",
    numHands: 2,
    minDetectionConfidence: 0.6,
    minPresenceConfidence: 0.6,
    minTrackingConfidence: 0.5,
  },
  {
    id: "lowpower",
    label: "Zuinig",
    note: "Raspberry Pi",
    numHands: 2,
    minDetectionConfidence: 0.65,
    minPresenceConfidence: 0.65,
    minTrackingConfidence: 0.6,
  },
]

export const holdPresets = [
  { label: "0.5s", value: 500 },
  { label: "1s", value: 1000 },
  { label: "1.5s", value: 1500 },
  { label: "2s", value: 2000 },
  { label: "3s", value: 3000 },
]

export const handOptions = [2, 4, 6, 8, 10, 12]

export const formatInterval = (ms) => (ms <= 0 ? "Realtime (0ms)" : `${ms}ms`)
export const formatConfidence = (value) => Number(value).toFixed(2)