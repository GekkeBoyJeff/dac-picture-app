export const PROTOCOL_VERSION = 1
export const CHANNEL_PREFIX = "dac-remote-"
export const CODE_LEN = 6

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
const NON_CODE_CHARS = new RegExp(`[^${CODE_CHARS}]`, "g")

export const channelName = (code) => `${CHANNEL_PREFIX}${code}`

export function generateRoomCode() {
  const buf = new Uint32Array(CODE_LEN)
  crypto.getRandomValues(buf)
  return Array.from(buf, (n) => CODE_CHARS[n % CODE_CHARS.length]).join("")
}

// Per-client id so the booth can address grant/deny/occupied to one controller.
export function generateClientId() {
  const buf = new Uint8Array(18)
  crypto.getRandomValues(buf)
  return btoa(String.fromCharCode(...buf))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "")
}

export function normalizeCode(raw) {
  // Keep only chars that can actually appear in a code. The alphabet excludes
  // the ambiguous I/O/0/1, so a mistyped one is stripped (not remapped —
  // remapping could turn a typo into a different valid-looking code).
  return (raw || "").toUpperCase().replace(NON_CODE_CHARS, "").slice(0, CODE_LEN)
}

export function tokenMatch(a, b) {
  if (!a || !b || a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

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
const MODAL_NAMES = new Set(["gallery"])

const isNum = (v) => typeof v === "number" && Number.isFinite(v)
const clamp01 = (v) => Math.min(1, Math.max(0, v))

export function validateCommand(msg) {
  if (!msg || typeof msg.t !== "string") return null
  switch (msg.t) {
    case "trigger":
    case "preset:highPower":
    case "preset:lowPower":
      return { t: msg.t }
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
    case "modal":
      return MODAL_NAMES.has(msg.name) ? { t: "modal", name: msg.name } : null
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