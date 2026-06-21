export const PROTOCOL_VERSION = 2

// Single fixed channel: one booth, one /admin. No room codes — the password is
// the gate. Both the booth and /admin join this exact channel name.
export const FIXED_CHANNEL = "dac-photobooth-remote-v1"

// Constant-time string compare (used for the password check).
export function tokenMatch(a, b) {
  if (!a || !b || a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

// uiStore fields broadcast to /admin. Gallery fields are added by the host
// (they come from modals + galleryStore), see useRemoteHost.
const STATE_KEYS = [
  "appState",
  "stripModeEnabled",
  "flashEnabled",
  "gesturesEnabled",
  "debugEnabled",
  "forceLowPower",
  "detectionIntervalMs",
  "numHands",
  "minDetectionConfidence",
  "minPresenceConfidence",
  "minTrackingConfidence",
  "triggerMinScore",
  "gestureHoldMs",
]
export function pickStatePayload(state) {
  const out = {}
  for (const k of STATE_KEYS) out[k] = state[k]
  return out
}

const TOGGLE_KEYS = new Set([
  "stripModeEnabled",
  "flashEnabled",
  "gesturesEnabled",
  "debugEnabled",
  "forceLowPower",
])
const CONF_KEYS = new Set([
  "minDetectionConfidence",
  "minPresenceConfidence",
  "minTrackingConfidence",
  "triggerMinScore",
])
const HAND_OPTIONS = new Set([2, 4, 6, 8, 10, 12])
const SCENE_IDS = new Set(["convention", "booth", "mobile", "lowpower"])
const HOLD_VALUES = new Set([500, 1000, 1500, 2000, 3000])
const NO_PARAM = new Set([
  "trigger",
  "preset:highPower",
  "preset:lowPower",
  "gallery:open",
  "gallery:next",
  "gallery:prev",
  "gallery:close",
])

const isNum = (v) => typeof v === "number" && Number.isFinite(v)
const clamp01 = (v) => Math.min(1, Math.max(0, v))

// Validates + sanitizes an inbound command. Returns a trusted command or null.
export function validateCommand(msg) {
  if (!msg || typeof msg.t !== "string") return null
  if (NO_PARAM.has(msg.t)) return { t: msg.t }
  switch (msg.t) {
    case "toggle":
      return TOGGLE_KEYS.has(msg.key) ? { t: "toggle", key: msg.key } : null
    case "set":
      if (msg.key === "numHands")
        return HAND_OPTIONS.has(msg.value) ? { t: "set", key: "numHands", value: msg.value } : null
      if (CONF_KEYS.has(msg.key) && isNum(msg.value))
        return { t: "set", key: msg.key, value: clamp01(msg.value) }
      return null
    case "preset:scene":
      return SCENE_IDS.has(msg.id) ? { t: "preset:scene", id: msg.id } : null
    case "preset:gesture":
      return isNum(msg.interval) && isNum(msg.score)
        ? {
            t: "preset:gesture",
            interval: Math.max(0, Math.min(2000, Math.round(msg.interval))),
            score: clamp01(msg.score),
          }
        : null
    case "preset:hold":
      return HOLD_VALUES.has(msg.ms) ? { t: "preset:hold", ms: msg.ms } : null
    default:
      return null
  }
}

// Merge a state snapshot, but keep a key the user just changed locally so an
// echoed snapshot can't snap a slider back mid-interaction.
export function mergeRemoteState(prev, payload, localEdits, now, windowMs = 400) {
  const out = { ...prev }
  for (const k of Object.keys(payload)) {
    const editedAt = localEdits[k]
    if (editedAt && now - editedAt < windowMs) continue
    out[k] = payload[k]
  }
  return out
}