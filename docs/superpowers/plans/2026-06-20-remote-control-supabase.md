# Remote Control (Supabase Realtime) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Vervang de kapotte PeerJS/WebRTC remote-control door een betrouwbare, cross-network, control-only remote via Supabase Realtime Broadcast + Presence.

**Architecture:** Booth (`useRemoteHost`) en telefoon (`useRemoteController`) joinen hetzelfde Supabase broadcast-kanaal `dac-remote-<CODE>`. De telefoon stuurt gevalideerde commando's; de booth past ze toe op de `uiStore` en broadcast (gedebounced/gediffed) zijn state terug. Eén gedeeld `protocol.js` is de bron van het wire-contract. Geen WebRTC, geen STUN/TURN, geen video. Frontend blijft static op GitHub Pages.

**Tech Stack:** Next.js 16 (`output: "export"`), React 19, Zustand 5, `@supabase/supabase-js` v2 (Realtime), `qrcode`, Vitest.

## Global Constraints

- Frontend blijft 100% static (`output: "export"`), gehost op GitHub Pages onder basePath `/dac-picture-app`.
- Geen server-runtime. App-runtime gebruikt **alleen** Supabase Realtime (broadcast + presence) — géén database.
- Env-vars zijn publiek en build-time inlined: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- Supabase-project: `dac-photobooth-remote`, ref `wmmugadkmfcfkiiyntye`, regio `eu-central-1`, URL `https://wmmugadkmfcfkiiyntye.supabase.co`, publishable key `sb_publishable_FVT9n8hko436R71pBNnstw_1zWFte53`.
- Toegang = operator-only: QR-token → auto-grant; handmatige code → booth-goedkeuring; single-owner via Presence.
- Codealfabet: `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (ondubbelzinnig). Codelengte 6. `PROTOCOL_VERSION = 1`.
- Commit na elke taak. Tests via `npm run test` (Vitest). Lint via `npm run lint`. Build via `npm run build`.

---

## File Structure

**Create**
- `src/lib/remote/protocol.js` — wire-contract: versie, kanaalnaam, code/token-generatie, `tokenMatch`, `pickStatePayload`, `validateCommand`, `mergeRemoteState`.
- `src/lib/remote/commands.js` — `applyCommand(state, cmd)`: gevalideerd commando → `uiStore`-actie / `remote:trigger`-event.
- `src/lib/remote/supabase.js` — `getSupabaseClient()` (lazy singleton) + `isRemoteConfigured()`.
- `src/hooks/useRemoteHost.js` — booth: join, presence/owner, ontvang `cmd`, broadcast `state`, goedkeuring.
- `src/hooks/useRemoteController.js` — telefoon: join, `hello`, verstuur `cmd`, ontvang state/grant/deny/occupied/awaiting, status/timeout/retry, eigenaar van `remoteState`.
- `public/.nojekyll` — leeg bestand; borgt `_next/*`-assets op Pages.
- `.github/workflows/supabase-keepalive.yml` — cron keep-alive.
- `src/__tests__/remoteProtocol.test.js`, `src/__tests__/remoteCommands.test.js`, `src/__tests__/remoteSupabase.test.js` — unit-tests.

**Modify**
- `src/components/PhotoBooth.jsx` — `usePeerHost` → `useRemoteHost`; approval-overlay; `remote:trigger` blijft.
- `src/components/camera/RemoteConnectModal.jsx` — QR `?r&k`, statussen, approval-knoppen.
- `src/app/remote/page.jsx` — wachtwoordpoort eruit; `useRemoteController`; handmatige code.
- `src/components/remote/RemotePanel.jsx` — video eruit; scene-selectie; slider-debounce; status/retry.
- `package.json` — `@supabase/supabase-js` erbij, `peerjs` eruit.
- `.env.example`, `.github/workflows/deploy.yml`.

**Delete**
- `src/hooks/usePeerHost.js`, `src/hooks/usePeerRemote.js`, `src/lib/webrtc/iceServers.js`, `src/components/remote/CameraPreview.jsx`, `src/components/remote/RemotePasswordGate.jsx`.

---

### Task 1: Shared protocol module

**Files:**
- Create: `src/lib/remote/protocol.js`
- Test: `src/__tests__/remoteProtocol.test.js`

**Interfaces:**
- Produces:
  - `PROTOCOL_VERSION: number`, `CHANNEL_PREFIX: string`, `CODE_LEN: number`
  - `channelName(code: string): string`
  - `generateRoomCode(): string` (6 chars), `generateClientId(): string`, `normalizeCode(raw: string): string`
  - `tokenMatch(a: string, b: string): boolean`
  - `pickStatePayload(state): object`
  - `validateCommand(msg): object | null` (returns a sanitized command or null)
  - `mergeRemoteState(prev: object, payload: object, localEdits: Record<string,number>, now: number, windowMs?: number): object`

- [ ] **Step 1: Write the failing tests**

```js
// src/__tests__/remoteProtocol.test.js
import { describe, it, expect } from "vitest"
import {
  PROTOCOL_VERSION, CODE_LEN, channelName, generateRoomCode, generateClientId,
  normalizeCode, tokenMatch, pickStatePayload, validateCommand, mergeRemoteState,
} from "@/lib/remote/protocol"

describe("protocol basics", () => {
  it("has a version", () => expect(PROTOCOL_VERSION).toBe(1))
  it("builds a channel name", () => expect(channelName("ABC234")).toBe("dac-remote-ABC234"))
  it("generates a 6-char code from the safe alphabet", () => {
    const c = generateRoomCode()
    expect(c).toHaveLength(CODE_LEN)
    expect(c).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/)
  })
  it("generateClientId is non-empty and unique-ish", () => {
    expect(generateClientId().length).toBeGreaterThan(8)
    expect(generateClientId()).not.toBe(generateClientId())
  })
  it("normalizes codes (uppercase, strip, slice 6)", () => {
    expect(normalizeCode("ab c2-3!x9z")).toBe("ABC23X")
  })
})

describe("tokenMatch (constant-time-ish equality)", () => {
  it("matches equal", () => expect(tokenMatch("abc", "abc")).toBe(true))
  it("rejects different", () => expect(tokenMatch("abc", "abd")).toBe(false))
  it("rejects empty / length mismatch", () => {
    expect(tokenMatch("", "")).toBe(false)
    expect(tokenMatch("ab", "abc")).toBe(false)
  })
})

describe("pickStatePayload", () => {
  it("picks only the wire fields and drops the rest", () => {
    const p = pickStatePayload({ flashEnabled: true, numHands: 4, appState: "camera", secret: 1, toggleFlash: () => {} })
    expect(p).toEqual(expect.objectContaining({ flashEnabled: true, numHands: 4, appState: "camera" }))
    expect(p).not.toHaveProperty("secret")
    expect(p).not.toHaveProperty("toggleFlash")
    expect(p).not.toHaveProperty("lowPowerOverride")
  })
})

describe("validateCommand", () => {
  it("passes param-less commands", () => {
    for (const t of ["trigger", "preset:highPower", "preset:lowPower"]) {
      expect(validateCommand({ t })).toEqual({ t })
    }
  })
  it("accepts known toggles, rejects unknown", () => {
    expect(validateCommand({ t: "toggle", key: "flashEnabled" })).toEqual({ t: "toggle", key: "flashEnabled" })
    expect(validateCommand({ t: "toggle", key: "evil" })).toBeNull()
  })
  it("clamps confidences to [0,1] and rejects non-numbers", () => {
    expect(validateCommand({ t: "set", key: "triggerMinScore", value: 5 })).toEqual({ t: "set", key: "triggerMinScore", value: 1 })
    expect(validateCommand({ t: "set", key: "minDetectionConfidence", value: -2 })).toEqual({ t: "set", key: "minDetectionConfidence", value: 0 })
    expect(validateCommand({ t: "set", key: "triggerMinScore", value: NaN })).toBeNull()
  })
  it("only allows numHands from the option set", () => {
    expect(validateCommand({ t: "set", key: "numHands", value: 4 })).toEqual({ t: "set", key: "numHands", value: 4 })
    expect(validateCommand({ t: "set", key: "numHands", value: 7 })).toBeNull()
  })
  it("validates presets and modal allowlist", () => {
    expect(validateCommand({ t: "preset:scene", id: "booth" })).toEqual({ t: "preset:scene", id: "booth" })
    expect(validateCommand({ t: "preset:scene", id: "../etc" })).toBeNull()
    expect(validateCommand({ t: "preset:hold", ms: 1500 })).toEqual({ t: "preset:hold", ms: 1500 })
    expect(validateCommand({ t: "preset:hold", ms: 999 })).toBeNull()
    expect(validateCommand({ t: "preset:gesture", interval: 120, score: 0.35 })).toEqual({ t: "preset:gesture", interval: 120, score: 0.35 })
    expect(validateCommand({ t: "modal", name: "gallery" })).toEqual({ t: "modal", name: "gallery" })
    expect(validateCommand({ t: "modal", name: "settings" })).toBeNull()
  })
  it("rejects junk", () => {
    expect(validateCommand(null)).toBeNull()
    expect(validateCommand({})).toBeNull()
    expect(validateCommand({ t: "nope" })).toBeNull()
  })
})

describe("mergeRemoteState", () => {
  it("merges incoming over prev", () => {
    expect(mergeRemoteState({ a: 1 }, { b: 2 }, {}, 1000)).toEqual({ a: 1, b: 2 })
  })
  it("skips a key that was locally edited within the window", () => {
    const merged = mergeRemoteState({ numHands: 4 }, { numHands: 8 }, { numHands: 950 }, 1000, 400)
    expect(merged.numHands).toBe(4) // local edit (950) within 400ms of now (1000) wins
  })
  it("accepts incoming once the local-edit window has passed", () => {
    const merged = mergeRemoteState({ numHands: 4 }, { numHands: 8 }, { numHands: 500 }, 1000, 400)
    expect(merged.numHands).toBe(8)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test -- src/__tests__/remoteProtocol.test.js`
Expected: FAIL — `Failed to resolve import "@/lib/remote/protocol"`.

- [ ] **Step 3: Implement `src/lib/remote/protocol.js`**

```js
export const PROTOCOL_VERSION = 1
export const CHANNEL_PREFIX = "dac-remote-"
export const CODE_LEN = 6

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

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
  return btoa(String.fromCharCode(...buf)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "")
}

export function normalizeCode(raw) {
  return (raw || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, CODE_LEN)
}

export function tokenMatch(a, b) {
  if (!a || !b || a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

const STATE_KEYS = [
  "appState", "stripModeEnabled", "flashEnabled", "gesturesEnabled", "debugEnabled",
  "forceLowPower", "detectionIntervalMs", "numHands", "minDetectionConfidence",
  "minPresenceConfidence", "minTrackingConfidence", "triggerMinScore", "gestureHoldMs",
]
export function pickStatePayload(state) {
  const out = {}
  for (const k of STATE_KEYS) out[k] = state[k]
  return out
}

const TOGGLE_KEYS = new Set(["stripModeEnabled", "flashEnabled", "gesturesEnabled", "debugEnabled", "forceLowPower"])
const CONF_KEYS = new Set(["minDetectionConfidence", "minPresenceConfidence", "minTrackingConfidence", "triggerMinScore"])
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
      if (msg.key === "numHands") return HAND_OPTIONS.has(msg.value) ? { t: "set", key: "numHands", value: msg.value } : null
      if (CONF_KEYS.has(msg.key) && isNum(msg.value)) return { t: "set", key: msg.key, value: clamp01(msg.value) }
      return null
    case "preset:scene":
      return SCENE_IDS.has(msg.id) ? { t: "preset:scene", id: msg.id } : null
    case "preset:gesture":
      return isNum(msg.interval) && isNum(msg.score)
        ? { t: "preset:gesture", interval: Math.max(0, Math.min(2000, Math.round(msg.interval))), score: clamp01(msg.score) }
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test -- src/__tests__/remoteProtocol.test.js`
Expected: PASS (all).

- [ ] **Step 5: Commit**

```bash
git add src/lib/remote/protocol.js src/__tests__/remoteProtocol.test.js
git commit -m "feat(remote): shared protocol module with command validation"
```

---

### Task 2: Command dispatch module

**Files:**
- Create: `src/lib/remote/commands.js`
- Test: `src/__tests__/remoteCommands.test.js`

**Interfaces:**
- Consumes: `scenePresets` from `@/components/drawers/settings/settingsPresets`.
- Produces: `applyCommand(state, cmd): void` — `state` is a `useUiStore` snapshot (with action functions); `cmd` is already validated by `validateCommand`. `trigger` dispatches a `window` `CustomEvent("remote:trigger")`.

- [ ] **Step 1: Write the failing tests**

```js
// src/__tests__/remoteCommands.test.js
import { describe, it, expect, vi } from "vitest"
import { applyCommand } from "@/lib/remote/commands"

function mockState() {
  return {
    toggleFlash: vi.fn(), toggleStripMode: vi.fn(), toggleGestures: vi.fn(),
    toggleDebug: vi.fn(), toggleForceLowPower: vi.fn(),
    setNumHands: vi.fn(), setMinDetectionConfidence: vi.fn(), setMinPresenceConfidence: vi.fn(),
    setMinTrackingConfidence: vi.fn(), setTriggerScore: vi.fn(),
    setDetectionInterval: vi.fn(), setGestureHold: vi.fn(),
    applyScenePreset: vi.fn(), applyHighPowerPreset: vi.fn(), applyLowPowerPreset: vi.fn(),
    openModal: vi.fn(),
  }
}

describe("applyCommand", () => {
  it("maps toggle to the right action", () => {
    const s = mockState()
    applyCommand(s, { t: "toggle", key: "flashEnabled" })
    expect(s.toggleFlash).toHaveBeenCalledOnce()
  })
  it("maps set to the right setter with the value", () => {
    const s = mockState()
    applyCommand(s, { t: "set", key: "numHands", value: 8 })
    expect(s.setNumHands).toHaveBeenCalledWith(8)
  })
  it("applies a scene preset object", () => {
    const s = mockState()
    applyCommand(s, { t: "preset:scene", id: "booth" })
    expect(s.applyScenePreset).toHaveBeenCalledWith(expect.objectContaining({ id: "booth", numHands: 4 }))
  })
  it("preset:gesture sets interval + score", () => {
    const s = mockState()
    applyCommand(s, { t: "preset:gesture", interval: 120, score: 0.35 })
    expect(s.setDetectionInterval).toHaveBeenCalledWith(120)
    expect(s.setTriggerScore).toHaveBeenCalledWith(0.35)
  })
  it("opens a modal", () => {
    const s = mockState()
    applyCommand(s, { t: "modal", name: "gallery" })
    expect(s.openModal).toHaveBeenCalledWith("gallery")
  })
  it("trigger dispatches the remote:trigger window event", () => {
    // Test env is "node" (no jsdom), so stub a minimal window. Node 20 has a
    // global CustomEvent, which applyCommand uses.
    const dispatch = vi.fn()
    vi.stubGlobal("window", { dispatchEvent: dispatch })
    applyCommand(mockState(), { t: "trigger" })
    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: "remote:trigger" }))
    vi.unstubAllGlobals()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test -- src/__tests__/remoteCommands.test.js`
Expected: FAIL — cannot resolve `@/lib/remote/commands`.

- [ ] **Step 3: Implement `src/lib/remote/commands.js`**

```js
import { scenePresets } from "@/components/drawers/settings/settingsPresets"

// cmd MUST be the output of validateCommand (trusted shape + clamped values).
export function applyCommand(state, cmd) {
  switch (cmd.t) {
    case "trigger":
      if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("remote:trigger"))
      return
    case "toggle": {
      const fns = {
        stripModeEnabled: state.toggleStripMode, flashEnabled: state.toggleFlash,
        gesturesEnabled: state.toggleGestures, debugEnabled: state.toggleDebug,
        forceLowPower: state.toggleForceLowPower,
      }
      fns[cmd.key]?.()
      return
    }
    case "set": {
      const fns = {
        numHands: state.setNumHands, minDetectionConfidence: state.setMinDetectionConfidence,
        minPresenceConfidence: state.setMinPresenceConfidence, minTrackingConfidence: state.setMinTrackingConfidence,
        triggerMinScore: state.setTriggerScore,
      }
      fns[cmd.key]?.(cmd.value)
      return
    }
    case "preset:scene": {
      const preset = scenePresets.find((p) => p.id === cmd.id)
      if (preset) state.applyScenePreset(preset)
      return
    }
    case "preset:gesture":
      state.setDetectionInterval(cmd.interval)
      state.setTriggerScore(cmd.score)
      return
    case "preset:hold":
      state.setGestureHold(cmd.ms)
      return
    case "preset:highPower":
      state.applyHighPowerPreset()
      return
    case "preset:lowPower":
      state.applyLowPowerPreset()
      return
    case "modal":
      state.openModal(cmd.name)
      return
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test -- src/__tests__/remoteCommands.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/remote/commands.js src/__tests__/remoteCommands.test.js
git commit -m "feat(remote): command dispatch from validated wire commands to uiStore"
```

---

### Task 3: Supabase client + config helper + dependency swap

**Files:**
- Create: `src/lib/remote/supabase.js`
- Test: `src/__tests__/remoteSupabase.test.js`
- Modify: `package.json`, `.env.example`

**Interfaces:**
- Produces: `isRemoteConfigured(): boolean`, `getSupabaseClient(): SupabaseClient | null` (lazy singleton; `null` when unconfigured).

- [ ] **Step 1: Install/remove deps**

Run:
```bash
npm install @supabase/supabase-js
npm uninstall peerjs
```
Expected: `package.json` gains `@supabase/supabase-js`, loses `peerjs`; `package-lock.json` updated.

- [ ] **Step 2: Write the failing test**

```js
// src/__tests__/remoteSupabase.test.js
import { describe, it, expect, afterEach } from "vitest"
import { isRemoteConfigured } from "@/lib/remote/supabase"

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

afterEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = URL
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = KEY
})

describe("isRemoteConfigured", () => {
  it("true when both env vars present", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://x.supabase.co"
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_x"
    expect(isRemoteConfigured()).toBe(true)
  })
  it("false when a var is missing", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://x.supabase.co"
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    expect(isRemoteConfigured()).toBe(false)
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm run test -- src/__tests__/remoteSupabase.test.js`
Expected: FAIL — cannot resolve `@/lib/remote/supabase`.

- [ ] **Step 4: Implement `src/lib/remote/supabase.js`**

```js
import { createClient } from "@supabase/supabase-js"

// NEXT_PUBLIC_* are inlined at build time; reading inside the function keeps it
// testable (Vitest can mutate process.env) and avoids a stale module-load capture.
export const isRemoteConfigured = () =>
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)

let client = null
export function getSupabaseClient() {
  if (!isRemoteConfigured()) return null
  if (!client) {
    client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      { auth: { persistSession: false }, realtime: { params: { eventsPerSecond: 20 } } },
    )
  }
  return client
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm run test -- src/__tests__/remoteSupabase.test.js`
Expected: PASS.

- [ ] **Step 6: Update `.env.example`**

Replace the whole file with:
```bash
# --- Supabase Realtime: transport voor de remote-control feature (/remote) ---
# Publieke waarden (komen sowieso in de client-bundle) — veilig om te delen.
# Zet deze ook als GitHub Actions *Variables* (niet Secrets) voor de deploy-build.
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx
```

- [ ] **Step 7: Commit**

```bash
git add src/lib/remote/supabase.js src/__tests__/remoteSupabase.test.js package.json package-lock.json .env.example
git commit -m "feat(remote): supabase client + config helper; swap peerjs for supabase-js"
```

---

### Task 4: Booth host hook (`useRemoteHost`)

**Files:**
- Create: `src/hooks/useRemoteHost.js`

**Interfaces:**
- Consumes: `getSupabaseClient`, `isRemoteConfigured` (Task 3); `protocol` (Task 1); `applyCommand` (Task 2); `useUiStore`.
- Produces: `useRemoteHost({ enabled: boolean }): { roomCode: string, token: string, status: "idle"|"waiting"|"awaiting-approval"|"connected"|"error", pendingApproval: boolean, approve(): void, deny(): void }`

**Wire events (this hook ↔ controller):**
- Receives `broadcast` `hello` `{ from, token, v }` and `cmd` `{ from, cmd, v }`.
- Sends `broadcast` `granted`/`denied`/`occupied`/`awaiting` each `{ to }`, and `state` `{ payload, v }`.

- [ ] **Step 1: Implement `src/hooks/useRemoteHost.js`**

```js
"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useUiStore } from "@/stores/uiStore"
import { getSupabaseClient } from "@/lib/remote/supabase"
import { applyCommand } from "@/lib/remote/commands"
import {
  PROTOCOL_VERSION, channelName, generateRoomCode, generateClientId,
  pickStatePayload, tokenMatch, validateCommand,
} from "@/lib/remote/protocol"

const STATE_DEBOUNCE_MS = 60

function shallowEqual(a, b) {
  if (a === b) return true
  if (!a || !b) return false
  const ak = Object.keys(a)
  if (ak.length !== Object.keys(b).length) return false
  return ak.every((k) => a[k] === b[k])
}

export function useRemoteHost({ enabled }) {
  const [roomCode] = useState(generateRoomCode)
  const [token] = useState(generateClientId) // 24-byte secret used as the QR token
  const [status, setStatus] = useState("idle")
  const [pendingApproval, setPendingApproval] = useState(false)

  const channelRef = useRef(null)
  const ownerRef = useRef(null)       // clientId of the active controller
  const pendingRef = useRef(null)     // clientId awaiting manual approval
  const approvedRef = useRef(new Set()) // clientIds already approved (seamless reconnect)
  const lastSentRef = useRef(null)
  const debounceRef = useRef(null)

  const send = useCallback((event, payload) => {
    channelRef.current?.send({ type: "broadcast", event, payload })
  }, [])

  const pushState = useCallback(() => {
    if (!ownerRef.current) return
    const payload = pickStatePayload(useUiStore.getState())
    if (shallowEqual(payload, lastSentRef.current)) return
    lastSentRef.current = payload
    send("state", { payload, v: PROTOCOL_VERSION })
  }, [send])

  const schedulePush = useCallback(() => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(pushState, STATE_DEBOUNCE_MS)
  }, [pushState])

  const grant = useCallback((to) => {
    ownerRef.current = to
    approvedRef.current.add(to)
    pendingRef.current = null
    setPendingApproval(false)
    setStatus("connected")
    useUiStore.getState().setRemoteConnected(true)
    send("granted", { to })
    lastSentRef.current = null
    pushState()
  }, [send, pushState])

  const approve = useCallback(() => { if (pendingRef.current) grant(pendingRef.current) }, [grant])
  const deny = useCallback(() => {
    if (pendingRef.current) send("denied", { to: pendingRef.current })
    pendingRef.current = null
    setPendingApproval(false)
    if (!ownerRef.current) setStatus("waiting")
  }, [send])

  useEffect(() => {
    if (!enabled) return
    const supabase = getSupabaseClient()
    if (!supabase) { setStatus("error"); return }

    const channel = supabase.channel(channelName(roomCode), {
      config: { broadcast: { self: false }, presence: { key: "booth" } },
    })
    channelRef.current = channel

    channel.on("broadcast", { event: "hello" }, ({ payload }) => {
      const from = payload?.from
      if (!from) return
      if (ownerRef.current && ownerRef.current !== from) { send("occupied", { to: from }); return }
      // Already-approved clients (incl. token holders) reconnect seamlessly.
      if (approvedRef.current.has(from) || (payload.token && tokenMatch(payload.token, token))) { grant(from); return }
      // No/invalid token, first time => manual entry => require operator approval.
      pendingRef.current = from
      setPendingApproval(true)
      setStatus("awaiting-approval")
      send("awaiting", { to: from })
    })

    channel.on("broadcast", { event: "cmd" }, ({ payload }) => {
      if (!payload || payload.from !== ownerRef.current) return
      const cmd = validateCommand(payload.cmd)
      if (cmd) applyCommand(useUiStore.getState(), cmd)
    })

    channel.on("presence", { event: "leave" }, ({ key }) => {
      // The controller tracks presence with key = its clientId. When the owner
      // leaves (tab closed / dropped past reconnect), free ownership so a new
      // phone can pair instead of getting a stuck "occupied".
      if (key === ownerRef.current) {
        ownerRef.current = null
        lastSentRef.current = null
        setStatus("waiting")
        useUiStore.getState().setRemoteConnected(false)
      }
    })

    channel.subscribe((s) => {
      if (s === "SUBSCRIBED") { setStatus(ownerRef.current ? "connected" : "waiting"); channel.track({ role: "booth" }) }
      else if (s === "CHANNEL_ERROR" || s === "TIMED_OUT") setStatus("error")
    })

    const unsub = useUiStore.subscribe(schedulePush)

    return () => {
      unsub()
      clearTimeout(debounceRef.current)
      supabase.removeChannel(channel)
      channelRef.current = null
      ownerRef.current = null
      pendingRef.current = null
      lastSentRef.current = null
      setPendingApproval(false)
      setStatus("idle")
      useUiStore.getState().setRemoteConnected(false)
    }
  }, [enabled, roomCode, token, grant, send, schedulePush])

  return { roomCode, token, status, pendingApproval, approve, deny }
}
```

- [ ] **Step 2: Lint + typecheck the new file**

Run: `npm run lint`
Expected: no errors for `src/hooks/useRemoteHost.js` (warnings about exhaustive-deps acceptable if pre-existing pattern; resolve any error).

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useRemoteHost.js
git commit -m "feat(remote): booth host hook over supabase realtime (presence owner + approval)"
```

> Functional verification of this hook happens end-to-end in Task 9 (with the controller + UI wired).

---

### Task 5: Controller hook (`useRemoteController`)

**Files:**
- Create: `src/hooks/useRemoteController.js`

**Interfaces:**
- Consumes: `getSupabaseClient`, `isRemoteConfigured` (Task 3); `protocol` (Task 1).
- Produces: `useRemoteController({ code: string|null, token: string|null }): { status, send(cmd): void, remoteState: object, retry(): void }`
  - `status ∈ "idle"|"connecting"|"awaiting-approval"|"connected"|"reconnecting"|"denied"|"occupied"|"error-config"|"error-timeout"`
  - `send(cmd)` broadcasts `{ from, cmd, v }`; records local edits for `set`/`toggle` keys so echoes don't fight the UI.

- [ ] **Step 1: Implement `src/hooks/useRemoteController.js`**

```js
"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { getSupabaseClient, isRemoteConfigured } from "@/lib/remote/supabase"
import {
  PROTOCOL_VERSION, channelName, generateClientId, mergeRemoteState,
} from "@/lib/remote/protocol"

const CONNECT_TIMEOUT_MS = 10000

export function useRemoteController({ code, token }) {
  const [status, setStatus] = useState("idle")
  const [remoteState, setRemoteState] = useState({})
  const [attempt, setAttempt] = useState(0)

  const fromRef = useRef(generateClientId())
  const channelRef = useRef(null)
  const localEditsRef = useRef({})
  const timeoutRef = useRef(null)

  const send = useCallback((cmd) => {
    if (cmd?.t === "set" || cmd?.t === "toggle") localEditsRef.current[cmd.key] = Date.now()
    channelRef.current?.send({ type: "broadcast", event: "cmd", payload: { from: fromRef.current, cmd, v: PROTOCOL_VERSION } })
  }, [])

  const retry = useCallback(() => setAttempt((n) => n + 1), [])

  useEffect(() => {
    if (!code) return
    if (!isRemoteConfigured()) { setStatus("error-config"); return }
    const supabase = getSupabaseClient()
    const me = fromRef.current

    setStatus("connecting")
    setRemoteState({})
    const channel = supabase.channel(channelName(code), {
      config: { broadcast: { self: false }, presence: { key: me } }, // key=clientId so the booth detects our leave
    })
    channelRef.current = channel

    const markConnected = () => { clearTimeout(timeoutRef.current); setStatus("connected") }

    channel.on("broadcast", { event: "state" }, ({ payload }) => {
      if (!payload?.payload) return
      markConnected()
      setRemoteState((prev) => mergeRemoteState(prev, payload.payload, localEditsRef.current, Date.now()))
    })
    channel.on("broadcast", { event: "granted" }, ({ payload }) => { if (payload?.to === me) markConnected() })
    channel.on("broadcast", { event: "awaiting" }, ({ payload }) => { if (payload?.to === me) { clearTimeout(timeoutRef.current); setStatus("awaiting-approval") } })
    channel.on("broadcast", { event: "denied" }, ({ payload }) => { if (payload?.to === me) setStatus("denied") })
    channel.on("broadcast", { event: "occupied" }, ({ payload }) => { if (payload?.to === me) setStatus("occupied") })

    channel.subscribe((s) => {
      if (s === "SUBSCRIBED") {
        channel.track({ role: "controller" }) // presence so the booth can detect our leave
        channel.send({ type: "broadcast", event: "hello", payload: { from: me, token: token || null, v: PROTOCOL_VERSION } })
        clearTimeout(timeoutRef.current)
        timeoutRef.current = setTimeout(() => setStatus((cur) => (cur === "connecting" ? "error-timeout" : cur)), CONNECT_TIMEOUT_MS)
      } else if (s === "CHANNEL_ERROR" || s === "TIMED_OUT") {
        setStatus("reconnecting")
      }
    })

    return () => {
      clearTimeout(timeoutRef.current)
      supabase.removeChannel(channel)
      channelRef.current = null
    }
  }, [code, token, attempt])

  return { status, send, remoteState, retry }
}
```

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: no errors for the new file.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useRemoteController.js
git commit -m "feat(remote): controller hook over supabase realtime (status machine + retry + echo guard)"
```

---

### Task 6: Remote page — drop password gate, use controller

**Files:**
- Modify: `src/app/remote/page.jsx`
- Delete: `src/components/remote/RemotePasswordGate.jsx`

- [ ] **Step 1: Replace `src/app/remote/page.jsx` entirely**

```jsx
"use client"

import { useEffect, useState } from "react"
import { RemotePanel } from "@/components/remote/RemotePanel"
import { useRemoteController } from "@/hooks/useRemoteController"
import { normalizeCode, CODE_LEN } from "@/lib/remote/protocol"
import { isRemoteConfigured } from "@/lib/remote/supabase"

export default function RemotePage() {
  const [code, setCode] = useState(null)
  const [token, setToken] = useState(null)
  const [manualCode, setManualCode] = useState("")

  // Client-only mount reads (URL params). Set after mount to avoid SSR/hydration
  // mismatch on the static export — window/URLSearchParams are never touched in prerender.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const r = normalizeCode(params.get("r"))
    if (r.length === CODE_LEN) setCode(r)
    const k = params.get("k")
    if (k) setToken(k)
  }, [])
  /* eslint-enable react-hooks/set-state-in-effect */

  const { status, send, remoteState, retry } = useRemoteController({ code, token })

  if (!isRemoteConfigured()) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-base px-4 text-center">
        <p className="max-w-sm text-sm text-ink-muted">
          Remote is niet geconfigureerd op deze build (Supabase-omgevingsvariabelen ontbreken).
        </p>
      </div>
    )
  }

  if (!code) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-base px-4">
        <div className="w-full max-w-sm space-y-6 text-center">
          <h1 className="text-2xl font-bold text-gold">DAC Remote</h1>
          <p className="text-sm text-ink-muted">Voer de 6-cijferige code in die op het scherm staat</p>
          <div className="space-y-3">
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(normalizeCode(e.target.value))}
              placeholder="bijv. DAC7XK"
              maxLength={CODE_LEN}
              autoFocus
              className="w-full rounded-2xl border border-hairline bg-surface px-4 py-3 text-center font-mono text-2xl tracking-widest text-ink placeholder:text-ink-subtle outline-none focus:border-gold/60"
            />
            <button
              onClick={() => { if (manualCode.length === CODE_LEN) setCode(manualCode) }}
              disabled={manualCode.length !== CODE_LEN}
              className="w-full cursor-pointer rounded-2xl bg-gold py-3 text-sm font-semibold text-[#1b1407] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Verbinden
            </button>
          </div>
        </div>
      </div>
    )
  }

  return <RemotePanel remoteState={remoteState} send={send} status={status} retry={retry} />
}
```

- [ ] **Step 2: Delete the password gate**

Run: `git rm src/components/remote/RemotePasswordGate.jsx`

- [ ] **Step 3: Verify no other file imports the gate**

Run: `grep -rn "RemotePasswordGate" src/`
Expected: no matches.

- [ ] **Step 4: Commit**

```bash
git add src/app/remote/page.jsx
git commit -m "feat(remote): /remote page uses controller hook; remove password gate"
```

---

### Task 7: RemotePanel — remove video, fix scene selection, debounce sliders, status/retry

**Files:**
- Modify: `src/components/remote/RemotePanel.jsx`
- Delete: `src/components/remote/CameraPreview.jsx`

**Interfaces:**
- Consumes: `useRemoteController` output (`remoteState`, `send`, `status`, `retry`); `scenePresets` from settingsPresets.
- New prop signature: `RemotePanel({ remoteState, send, status, retry })` (drops `stream`).

- [ ] **Step 1: Update the component signature + header status**

In `src/components/remote/RemotePanel.jsx`:

Replace the import of `CameraPreview` (line ~4) — delete this line:
```jsx
import { CameraPreview } from "./CameraPreview"
```

Replace the signature (line ~20):
```jsx
export function RemotePanel({ remoteState, send, status, retry }) {
```

Replace the status block in the header (the `<span>` dot + label, lines ~33-44) with status-aware text + a retry affordance:
```jsx
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${isConnected ? "animate-pulse bg-green-400" : "bg-ink-subtle"}`} />
          <span className={`text-xs font-medium ${isConnected ? "text-green-400" : "text-ink-muted"}`}>
            {STATUS_LABEL[status] ?? "Verbroken"}
          </span>
          {NEEDS_RETRY.has(status) && (
            <button onClick={retry} className="ml-1 cursor-pointer rounded-full border border-hairline px-2 py-0.5 text-xs text-gold hover:bg-surface">
              Opnieuw
            </button>
          )}
        </div>
```

- [ ] **Step 2: Add the status label map + remove the preview**

Near the top of the file (after imports), add:
```jsx
const STATUS_LABEL = {
  connecting: "Verbinden…",
  "awaiting-approval": "Wacht op goedkeuring…",
  connected: "Verbonden",
  reconnecting: "Herverbinden…",
  denied: "Geweigerd",
  occupied: "Booth is al in gebruik",
  "error-config": "Niet geconfigureerd",
  "error-timeout": "Booth niet gevonden",
}
const NEEDS_RETRY = new Set(["reconnecting", "denied", "occupied", "error-timeout"])
```

Remove the `<CameraPreview .../>` block (lines ~48-52):
```jsx
        {/* Live camera preview */}
        <CameraPreview stream={stream} className="aspect-video w-full rounded-2xl border border-hairline" />
```

- [ ] **Step 3: Fix scene-preset `selected`**

Replace the hardcoded `selected={false}` in the scene `ChoiceCard` (line ~99) with a derived value:
```jsx
                selected={
                  s.numHands === preset.numHands &&
                  s.minDetectionConfidence === preset.minDetectionConfidence &&
                  s.minTrackingConfidence === preset.minTrackingConfidence
                }
```

- [ ] **Step 4: Debounce slider sends**

Replace the `setValue` callback (line ~26) so confidence/triggerMinScore sends are debounced (~80ms), while toggles/discrete sets stay immediate:
```jsx
  const debounceRef = useRef(null)
  const setValue = useCallback((key, value) => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => send({ t: "set", key, value }), 80)
  }, [send])
```
Add `useRef` to the React import at the top:
```jsx
import { useState, useCallback, useRef } from "react"
```

- [ ] **Step 5: Delete CameraPreview**

Run: `git rm src/components/remote/CameraPreview.jsx`

- [ ] **Step 6: Verify + lint**

Run: `grep -rn "CameraPreview\|stream=" src/components/remote/ ; npm run lint`
Expected: no `CameraPreview` references; lint clean.

- [ ] **Step 7: Commit**

```bash
git add src/components/remote/RemotePanel.jsx
git commit -m "feat(remote): RemotePanel control-only — status/retry, scene selection, slider debounce"
```

---

### Task 8: RemoteConnectModal — QR with token, statuses, approval buttons

**Files:**
- Modify: `src/components/camera/RemoteConnectModal.jsx`

**Interfaces:**
- New props: `RemoteConnectModal({ isOpen, onClose, onStop, roomCode, token, status, pendingApproval, approve, deny })`.
- QR encodes `${origin}${BASE_PATH}/remote?r=<roomCode>&k=<token>`.

- [ ] **Step 1: Update the URL builder + signature**

In `src/components/camera/RemoteConnectModal.jsx`:

Replace the signature (line 6):
```jsx
export function RemoteConnectModal({ isOpen, onClose, onStop, roomCode, token, status, pendingApproval, approve, deny }) {
```

Replace the `remoteUrl` memo (lines 9-13):
```jsx
  const remoteUrl = useMemo(() => {
    if (typeof window === "undefined") return ""
    const k = token ? `&k=${token}` : ""
    return `${window.location.origin}${BASE_PATH}/remote?r=${roomCode}${k}`
  }, [roomCode, token])
```

- [ ] **Step 2: Replace the status pill with a status-aware label + approval prompt**

Replace the status pill block (lines ~56-65) with:
```jsx
        <div className="flex items-center gap-2.5 rounded-full border border-hairline bg-surface px-4 py-2">
          <span className={`h-2 w-2 rounded-full animate-pulse ${status === "connected" ? "bg-green-400" : "bg-ink-subtle"}`} />
          <span className={`text-sm font-medium ${status === "connected" ? "text-green-400" : "text-ink-muted"}`}>
            {status === "connected" ? "Verbonden"
              : status === "error" ? "Supabase niet bereikbaar"
              : status === "awaiting-approval" ? "Telefoon wil verbinden…"
              : "Wachten op verbinding…"}
          </span>
        </div>

        {pendingApproval && (
          <div className="w-full space-y-3 rounded-2xl border border-gold/40 bg-gold/10 p-4 text-center">
            <p className="text-sm text-ink">Een telefoon wil de booth bedienen. Toestaan?</p>
            <div className="flex gap-3">
              <button onClick={deny} className="flex-1 cursor-pointer rounded-xl border border-hairline px-4 py-2 text-sm text-ink-muted hover:bg-surface">Weigeren</button>
              <button onClick={approve} className="flex-1 cursor-pointer rounded-xl bg-gold px-4 py-2 text-sm font-semibold text-[#1b1407] hover:opacity-90">Toestaan</button>
            </div>
          </div>
        )}
```

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add src/components/camera/RemoteConnectModal.jsx
git commit -m "feat(remote): connect modal QR token + statuses + approval prompt"
```

---

### Task 9: PhotoBooth integration + remove PeerJS

**Files:**
- Modify: `src/components/PhotoBooth.jsx`
- Delete: `src/hooks/usePeerHost.js`, `src/hooks/usePeerRemote.js`, `src/lib/webrtc/iceServers.js`

- [ ] **Step 1: Swap the import + hook**

In `src/components/PhotoBooth.jsx`:

Replace the import (line 45):
```jsx
import { useRemoteHost } from "@/hooks/useRemoteHost"
```

Replace the `usePeerHost` call (lines ~76-85) with:
```jsx
  const {
    roomCode,
    token: remoteToken,
    status: remoteStatus,
    pendingApproval,
    approve,
    deny,
  } = useRemoteHost({ enabled: remoteActive })
```

- [ ] **Step 2: Pass the new props to the modal**

Replace the `<RemoteConnectModal .../>` block (lines ~527-537):
```jsx
        <RemoteConnectModal
          isOpen={modals.remote}
          onClose={() => closeModal("remote")}
          onStop={() => { setRemoteActive(false); closeModal("remote") }}
          roomCode={roomCode}
          token={remoteToken}
          status={remoteStatus}
          pendingApproval={pendingApproval}
          approve={approve}
          deny={deny}
        />
```

- [ ] **Step 3: Add a standalone approval prompt (visible even when the QR modal is hidden)**

Immediately after the `<RemoteConnectModal .../>` block, add:
```jsx
        {pendingApproval && !modals.remote && (
          <div className="fixed inset-x-0 bottom-4 z-50 mx-auto w-[min(92vw,28rem)] space-y-3 rounded-2xl border border-gold/40 bg-base/95 p-4 text-center shadow-2xl backdrop-blur-xl">
            <p className="text-sm text-ink">Een telefoon wil de booth bedienen. Toestaan?</p>
            <div className="flex gap-3">
              <button onClick={deny} className="flex-1 cursor-pointer rounded-xl border border-hairline px-4 py-2 text-sm text-ink-muted hover:bg-surface">Weigeren</button>
              <button onClick={approve} className="flex-1 cursor-pointer rounded-xl bg-gold px-4 py-2 text-sm font-semibold text-[#1b1407] hover:opacity-90">Toestaan</button>
            </div>
          </div>
        )}
```

- [ ] **Step 4: Delete the PeerJS modules**

Run:
```bash
git rm src/hooks/usePeerHost.js src/hooks/usePeerRemote.js src/lib/webrtc/iceServers.js
```

- [ ] **Step 5: Verify nothing still references PeerJS/iceServers**

Run: `grep -rn "usePeerHost\|usePeerRemote\|iceServers\|peerjs\|PEER_CONFIG\|authToken" src/`
Expected: no matches (note: `remoteToken` is fine; the old `authToken`/`remoteAuthToken` names must be gone).

- [ ] **Step 6: Run the full test suite + build**

Run: `npm run test && npm run build`
Expected: tests PASS; build completes; `out/remote.html` is emitted.

- [ ] **Step 7: Commit**

```bash
git add src/components/PhotoBooth.jsx
git commit -m "feat(remote): wire booth to useRemoteHost; remove peerjs/webrtc modules"
```

---

### Task 10: Routing hardening (.nojekyll)

**Files:**
- Create: `public/.nojekyll`

- [ ] **Step 1: Create the file**

Run: `touch public/.nojekyll`

- [ ] **Step 2: Verify it lands in the export**

Run: `npm run build && ls -la out/.nojekyll`
Expected: `out/.nojekyll` exists (Next copies `public/*` to `out/`).

- [ ] **Step 3: Commit**

```bash
git add public/.nojekyll
git commit -m "chore(deploy): emit .nojekyll so _next assets serve on GitHub Pages"
```

---

### Task 11: Deploy workflow — Supabase vars, drop password

**Files:**
- Modify: `.github/workflows/deploy.yml`

**Manual prerequisite (operator):** In GitHub → Settings → Secrets and variables → Actions → **Variables**, add:
- `NEXT_PUBLIC_SUPABASE_URL` = `https://wmmugadkmfcfkiiyntye.supabase.co`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` = `sb_publishable_FVT9n8hko436R71pBNnstw_1zWFte53`

- [ ] **Step 1: Update the build step env**

In `.github/workflows/deploy.yml`, replace the `env:` block under "Build static export":
```yaml
        env:
          GITHUB_ACTIONS: true
          NEXT_PUBLIC_BASE_PATH: /dac-picture-app
          NEXT_PUBLIC_DISCORD_WEBHOOK_URL: ${{ secrets.DISCORD_WEBHOOK_URL }}
          NEXT_PUBLIC_SUPABASE_URL: ${{ vars.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: ${{ vars.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY }}
```
(Removes `NEXT_PUBLIC_REMOTE_PASSWORD` and its comment.)

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "chore(deploy): pass Supabase public env vars; drop remote password"
```

---

### Task 12: Keep-alive (cron) so the project never pauses

**Files:**
- Create: `.github/workflows/supabase-keepalive.yml`
- Supabase migration (applied at execution via the Supabase MCP `apply_migration`).

- [ ] **Step 1: Create the `keepalive` table + read policy (via Supabase MCP)**

Apply this migration (name `keepalive_table`) to project `wmmugadkmfcfkiiyntye`:
```sql
create table if not exists public.keepalive (id smallint primary key, pinged_at timestamptz default now());
insert into public.keepalive (id) values (1) on conflict (id) do nothing;
alter table public.keepalive enable row level security;
create policy "anon can read keepalive" on public.keepalive for select to anon using (true);
```
Expected: table exists with one row; anon `select` allowed.

- [ ] **Step 2: Verify the REST ping works**

Run (substitute the publishable key):
```bash
curl -s "https://wmmugadkmfcfkiiyntye.supabase.co/rest/v1/keepalive?select=id&limit=1" \
  -H "apikey: sb_publishable_FVT9n8hko436R71pBNnstw_1zWFte53" | head
```
Expected: JSON `[{"id":1}]`.

- [ ] **Step 3: Create `.github/workflows/supabase-keepalive.yml`**

```yaml
name: Supabase keep-alive

on:
  schedule:
    - cron: "17 6 * * 1,4" # Mon & Thu 06:17 UTC — resets the 7-day pause timer
  workflow_dispatch:

jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - name: Ping Supabase REST (resets inactivity timer)
        run: |
          curl -sS -o /dev/null -w "%{http_code}\n" \
            "${{ vars.NEXT_PUBLIC_SUPABASE_URL }}/rest/v1/keepalive?select=id&limit=1" \
            -H "apikey: ${{ vars.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY }}" \
            | grep -qE "^2" || (echo "keep-alive ping failed" && exit 1)
```

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/supabase-keepalive.yml
git commit -m "chore(supabase): twice-weekly keep-alive cron to prevent free-tier pause"
```

- [ ] **Step 5 (after first push): manually trigger once to confirm**

In GitHub → Actions → "Supabase keep-alive" → Run workflow. Expected: green run, `2xx` status printed.

---

## Final verification (manual, end-to-end)

1. `npm run dev`, open the booth, click the Remote button → QR + 6-char code shown, status "Wachten op verbinding…".
2. Scan the QR with a phone **on mobile data** (not the booth's wifi) → phone shows "Verbonden"; toggles/triggers/presets drive the booth; gallery opens.
3. Enter the code manually on a second phone (no QR) → booth shows the "Toestaan?" prompt → approve → phone connects.
4. Connect a third phone with the code → it shows "Booth is al in gebruik".
5. Toggle airplane mode briefly on the phone → it auto-reconnects (no reload) and returns to "Verbonden".
6. Build (`npm run build`) and confirm `out/remote.html` + `out/.nojekyll` exist.

---

## Self-Review notes (filled during planning)

- **Spec coverage:** §3 transport → Tasks 3-5; §4 protocol/validation → Tasks 1-2; §5 reliability/status/debounce → Tasks 5,7; §6 security (token/approval/single-owner) → Tasks 4,5,8,9; §7 file plan → all tasks; §8 config/graceful-degradation → Tasks 3,6,11; §9 routing → Task 10; §10 tests → Tasks 1-3; §13 keep-alive → Task 12. No gaps.
- **Type consistency:** host returns `{ roomCode, token, status, pendingApproval, approve, deny }` (Task 4) — consumed verbatim in Task 9; controller returns `{ status, send, remoteState, retry }` (Task 5) — consumed in Tasks 6,7. QR uses `?r`/`?k`; controller reads `?r`/`?k`. Channel name `dac-remote-<CODE>` identical on both sides via `channelName`.
- **Placeholders:** none — all steps carry real code/commands.
