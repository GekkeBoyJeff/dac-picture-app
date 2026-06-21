# Attract Screen & Post-Capture Send Animation Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** Replace the dark full-screen attract scrim with a bottom-right mascot + speech bubble (touch-aware Dutch copy, legible on every screen size, no dimming), and replace the fire-and-forget corner-pill send feedback with an honest, high-quality post-capture animation (`reveal → sending → outcome → joinHint → dismiss`) driven by the real `sendOrQueue` result, ending in a Discord-join hint.

**Architecture:** One new `result` app state owned by a single self-contained `PhotoResultOverlay` with an internal phase machine. `PhotoBooth` only parks the captured blob as an object URL, flips `appState` to `"result"`, and starts the existing send; the overlay reflects the real outcome and dismisses itself. Attract overlay is a pure presentational rewrite; visibility logic in `PhotoBooth` is unchanged. All motion via `@theme --animate-*` tokens + `@keyframes` in `globals.css` and the inline-`style` + `setTimeout(ANIM_MS)` pattern — NO animation library. JS timers drive sequencing so the global `prefers-reduced-motion` rule cannot stall the flow.

**Tech Stack:** Next.js 16 / React 19 static-export PWA, plain JS+JSX (NOT TypeScript), Tailwind v4 CSS-first (`@theme` in `src/app/globals.css`, NO `tailwind.config.js`), Zustand (+ `persist`) stores, Vitest. Tests for DOM/hooks use `@testing-library/react` `renderHook` under a per-file `// @vitest-environment happy-dom` docblock.

## Global Constraints

- **DO NOT run `git commit`.** The user commits themselves. Every task ends with a STAGING step: `git add <paths>` only. (Non-negotiable user preference.)
- **Work on a NEW feature branch**, not `main`. Task 1 creates it.
- **No animation library.** Motion = `@theme --animate-*` tokens + `@keyframes` in `src/app/globals.css`, composed with `cn()` (`src/lib/styles/cn.js`), plus the inline-`style` + `setTimeout(ANIM_MS)` enter/exit pattern (reference: `src/components/ui/BottomDrawer.jsx`, `ANIM_MS = 250`).
- **Sequencing MUST use JS `setTimeout`, never `animationend`.** A global `@media (prefers-reduced-motion: reduce)` rule in `globals.css:278-286` near-zeroes all `animation-duration`/`transition-duration` to `0.001ms`, so `animationend` could fire instantly or be skipped — JS timers keep the flow correct under reduced motion.
- **All UI copy is hardcoded Dutch, inline.** The i18n `t()` system is unused outside tests — do NOT wire it. Match existing inline-Dutch components.
- **Keep the Discord webhook send mechanism UNCHANGED** — `src/lib/discord/sendToDiscord.js` and `src/lib/discord/sendQueue.js` (`sendOrQueue`) are not edited.
- **Vitest env is `node` globally** (`vitest.config.mjs`); jsdom@29 is broken under Node 20.19 (`ERR_REQUIRE_ASYNC_MODULE`) — do NOT switch the global env to jsdom. For DOM/hook tests add a per-file `// @vitest-environment happy-dom` docblock as the FIRST line. `happy-dom` must be a devDependency (Task 2 adds it).
- **`src/__tests__/` is gitignored** — stage test files with `git add -f`.
- **ESLint enforces `eol-last: never`** (no trailing newline) but Prettier-on-save adds one. Run `npx eslint --fix <files>` as the LAST step before staging each task that touches `src/`.
- `react-hooks/set-state-in-effect` is an ERROR here. For a legitimate synchronous setState in an effect, wrap only that line in a bounded `/* eslint-disable react-hooks/set-state-in-effect */ … /* eslint-enable */`.
- Asset paths go through `BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || ""` (`src/lib/config/overlays.js`). Mascot/QR assets are referenced as ``${BASE_PATH}/overlays/...``. The mascot for attract is the FIXED `amelia-smile.webp` (not the configured mascot).
- **`appState` is NOT persisted** (verified: `uiStore.js` `partialize` at `:160-174` lists only settings — `debugEnabled, gesturesEnabled, stripModeEnabled, flashEnabled, forceLowPower, lowPowerOverride, detectionIntervalMs, numHands, minDetectionConfidence, minPresenceConfidence, minTrackingConfidence, triggerMinScore, gestureHoldMs`). New `capturedPhoto` field must likewise stay out of `partialize`. A defensive `onRehydrateStorage` reset to `"camera"` is still added per the spec.

## File Structure

| File | Create / Modify | Single responsibility |
|---|---|---|
| `src/hooks/useIsTouch.js` | Create | SSR-safe boolean hook: `true` on coarse-pointer / no-hover / touch devices. |
| `src/__tests__/useIsTouch.test.js` | Create | Unit tests for `useIsTouch` matchMedia branches + SSR default (happy-dom). |
| `src/stores/uiStore.js` | Modify | Add `"result"` appState value, transient `capturedPhoto` + `setCapturedPhoto`, exclude from persist, reset on rehydrate. |
| `src/__tests__/uiStore.result.test.js` | Create | Unit tests for `capturedPhoto`/`setCapturedPhoto` and `result` state (node env). |
| `src/app/globals.css` | Modify | New `@keyframes` + `--animate-*` tokens: bubble pop, mascot bob, send-fly, gold ripple, QR entrance, countdown ring. Remove `--animate-wave`/`hand-wave` (emoji removed). |
| `src/lib/config/index.js` | Modify | Add `JOIN_HINT` copy block (community + invite line) and re-export. |
| `src/components/camera/AttractOverlay.jsx` | Rewrite | Presentational: bottom-right `amelia-smile.webp` + speech bubble, no scrim, touch-aware copy, responsive (row landscape / column portrait), mascot bob + bubble pop. |
| `src/components/capture/PhotoResultOverlay.jsx` | Create | Self-contained post-capture phase machine + UI; consumes the captured object URL and a send promise; reuses QR + join copy; auto-dismiss + tap-to-dismiss; revokes URL on dismiss. |
| `src/__tests__/photoResultOverlay.test.js` | Create | Unit tests for the overlay phase machine: success/queued/error branches + auto-dismiss timer (happy-dom). |
| `src/components/PhotoBooth.jsx` | Modify | `doCapture` + `handleStripComplete` park the object URL, set `appState="result"`, hand the send promise to the overlay; render `<PhotoResultOverlay>`; keep `UploadStatus` for background queue drains only. |
| `package.json` | Modify | Add `happy-dom` to `devDependencies` (test-only). |

---

### Task 1: Create the feature branch

**Files:** none (git only).

- [ ] **Step 1: Confirm clean tree and current branch.**
  Run: `git status --short && git branch --show-current`
  Expected: branch is `main`. (Untracked spec files under `docs/superpowers/specs/` may be present — leave them.)
- [ ] **Step 2: Create and switch to the feature branch.**
  Run: `git switch -c feature/attract-and-send-animation`
  Expected: `Switched to a new branch 'feature/attract-and-send-animation'`.
- [ ] **Step 3: Verify.**
  Run: `git branch --show-current`
  Expected output: `feature/attract-and-send-animation`.

---

### Task 2: Add `happy-dom` devDependency for DOM/hook tests

**Files:**
- Modify: `package.json` (`devDependencies` block, ~`:14-26`)

**Interfaces:**
- Produces: test environment capability `// @vitest-environment happy-dom` works under Node 20.19 with `@testing-library/react` `renderHook`. (Verified during planning: jsdom@29 fails `ERR_REQUIRE_ASYNC_MODULE`; happy-dom + per-file docblock passes and does NOT alter the global `node` env used by existing tests.)

- [ ] **Step 1: Install happy-dom as a dev dependency (writes package.json + lockfile).**
  Run: `npm install --save-dev happy-dom`
  Expected: completes; `package.json` `devDependencies` now contains a `"happy-dom"` entry.
- [ ] **Step 2: Verify it is recorded.**
  Run: `node -e "console.log(require('./package.json').devDependencies['happy-dom'] || 'MISSING')"`
  Expected: a version string (e.g. `^15.x` / `^16.x`), NOT `MISSING`.
- [ ] **Step 3: Confirm the existing suite is unchanged (still the 2 known-pre-existing failures only).**
  Run: `npx vitest run src/__tests__ 2>&1 | tail -6`
  Expected: the run completes; the only failing unit tests are the pre-existing `uiStore > setLocale changes locale` and `getCanvasSize > caps at MAX_PIXELS for large sources` (both unrelated to this work). Do NOT fix them here.
- [ ] **Step 4: Stage.**
  Run: `git add package.json package-lock.json`

---

### Task 3: New SSR-safe `useIsTouch` hook + unit test

The hook returns `false` during SSR/first render and resolves to `true` on touch devices after mount, updating on `matchMedia` change. Touch = coarse pointer OR no hover OR `navigator.maxTouchPoints > 0`.

**Files:**
- Create: `src/hooks/useIsTouch.js`
- Create: `src/__tests__/useIsTouch.test.js`

**Interfaces:**
- Produces: `useIsTouch(): boolean` — default export-free named export `useIsTouch`. `false` during SSR/initial render; resolves on mount; updates when the coarse-pointer/no-hover media queries change.
- Consumes: React `useState`, `useEffect`; browser `window.matchMedia`, `navigator.maxTouchPoints`.

- [ ] **Step 1: Write the failing test.**
  Create `src/__tests__/useIsTouch.test.js`:
  ```js
  // @vitest-environment happy-dom
  import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
  import { renderHook, act } from "@testing-library/react"
  import { useIsTouch } from "@/hooks/useIsTouch"

  function mockMatchMedia(matchesByQuery) {
    const listeners = new Set()
    const mql = (query) => ({
      matches: !!matchesByQuery[query],
      media: query,
      addEventListener: (_e, cb) => listeners.add(cb),
      removeEventListener: (_e, cb) => listeners.delete(cb),
    })
    window.matchMedia = vi.fn(mql)
    return {
      fire: () => listeners.forEach((cb) => cb()),
    }
  }

  describe("useIsTouch", () => {
    let originalMM
    let originalMTP
    beforeEach(() => {
      originalMM = window.matchMedia
      originalMTP = Object.getOwnPropertyDescriptor(navigator, "maxTouchPoints")
    })
    afterEach(() => {
      window.matchMedia = originalMM
      if (originalMTP) Object.defineProperty(navigator, "maxTouchPoints", originalMTP)
    })

    it("returns false when not a touch device", () => {
      mockMatchMedia({})
      Object.defineProperty(navigator, "maxTouchPoints", { value: 0, configurable: true })
      const { result } = renderHook(() => useIsTouch())
      expect(result.current).toBe(false)
    })

    it("returns true when pointer is coarse", () => {
      mockMatchMedia({ "(pointer: coarse)": true })
      Object.defineProperty(navigator, "maxTouchPoints", { value: 0, configurable: true })
      const { result } = renderHook(() => useIsTouch())
      expect(result.current).toBe(true)
    })

    it("returns true when hover is none", () => {
      mockMatchMedia({ "(hover: none)": true })
      Object.defineProperty(navigator, "maxTouchPoints", { value: 0, configurable: true })
      const { result } = renderHook(() => useIsTouch())
      expect(result.current).toBe(true)
    })

    it("returns true when navigator.maxTouchPoints > 0", () => {
      mockMatchMedia({})
      Object.defineProperty(navigator, "maxTouchPoints", { value: 5, configurable: true })
      const { result } = renderHook(() => useIsTouch())
      expect(result.current).toBe(true)
    })

    it("updates when the media query changes", () => {
      const matches = { "(pointer: coarse)": false }
      const ctrl = mockMatchMediaDynamic(matches)
      Object.defineProperty(navigator, "maxTouchPoints", { value: 0, configurable: true })
      const { result } = renderHook(() => useIsTouch())
      expect(result.current).toBe(false)
      act(() => {
        matches["(pointer: coarse)"] = true
        ctrl.fire()
      })
      expect(result.current).toBe(true)
    })
  })

  function mockMatchMediaDynamic(matchesByQuery) {
    const listeners = new Set()
    window.matchMedia = vi.fn((query) => ({
      get matches() {
        return !!matchesByQuery[query]
      },
      media: query,
      addEventListener: (_e, cb) => listeners.add(cb),
      removeEventListener: (_e, cb) => listeners.delete(cb),
    }))
    return { fire: () => listeners.forEach((cb) => cb()) }
  }
  ```
- [ ] **Step 2: Run it — expect FAIL (module does not exist).**
  Run: `npx vitest run src/__tests__/useIsTouch.test.js`
  Expected: FAIL — `Failed to resolve import "@/hooks/useIsTouch"`.
- [ ] **Step 3: Implement the hook.**
  Create `src/hooks/useIsTouch.js`:
  ```js
  "use client"

  import { useState, useEffect } from "react"

  const QUERIES = ["(pointer: coarse)", "(hover: none)"]

  function computeIsTouch() {
    if (typeof window === "undefined") return false
    const byMedia =
      typeof window.matchMedia === "function" &&
      QUERIES.some((q) => window.matchMedia(q).matches)
    const byTouchPoints =
      typeof navigator !== "undefined" && (navigator.maxTouchPoints || 0) > 0
    return byMedia || byTouchPoints
  }

  /**
   * SSR-safe touch detection. Returns `false` during SSR / first client render
   * (so server and client markup match — see useHydrated), then resolves on
   * mount and updates when the coarse-pointer / no-hover media queries change.
   */
  export function useIsTouch() {
    const [isTouch, setIsTouch] = useState(false)

    useEffect(() => {
      if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
        return undefined
      }
      const update = () => setIsTouch(computeIsTouch())
      update()
      const mqls = QUERIES.map((q) => window.matchMedia(q))
      mqls.forEach((mql) => mql.addEventListener?.("change", update))
      return () => {
        mqls.forEach((mql) => mql.removeEventListener?.("change", update))
      }
    }, [])

    return isTouch
  }
  ```
- [ ] **Step 4: Run it — expect PASS.**
  Run: `npx vitest run src/__tests__/useIsTouch.test.js`
  Expected: PASS (5 tests).
- [ ] **Step 5: Lint the new source file.**
  Run: `npx eslint --fix src/hooks/useIsTouch.js`
  Expected: no errors.
- [ ] **Step 6: Stage** (`src/__tests__/` is gitignored — force-add the test).
  Run: `git add src/hooks/useIsTouch.js && git add -f src/__tests__/useIsTouch.test.js`

---

### Task 4: uiStore — add `result` state + transient `capturedPhoto` (not persisted, reset on rehydrate)

**Verified facts:** `appState` is already excluded from `partialize` (`uiStore.js:160-174`), so it is not persisted today. There is currently NO `onRehydrateStorage`/`merge`. We add `capturedPhoto` (also excluded from persist) plus a defensive `onRehydrateStorage` that forces `appState: "camera"` and `capturedPhoto: null` after rehydrate.

**Files:**
- Modify: `src/stores/uiStore.js` — initial state (`:8-9`), actions (after `setAppState` at `:41`), persist options (`:158-175`).
- Create: `src/__tests__/uiStore.result.test.js`

**Interfaces:**
- Produces: store fields `appState: "camera" | "countdown" | "capturing" | "result"`, `capturedPhoto: { url: string, isStrip: boolean } | null`; action `setCapturedPhoto(photo: { url, isStrip } | null): void`. Both `appState` and `capturedPhoto` are NON-persisted.
- Consumes: existing `setAppState(appState)`.

- [ ] **Step 1: Write the failing test.**
  Create `src/__tests__/uiStore.result.test.js`:
  ```js
  import { describe, it, expect, beforeEach } from "vitest"

  describe("uiStore — result state + capturedPhoto", () => {
    let useUiStore

    beforeEach(async () => {
      const mod = await import("@/stores/uiStore")
      useUiStore = mod.useUiStore
      useUiStore.setState({ appState: "camera", capturedPhoto: null })
    })

    it("defaults capturedPhoto to null", () => {
      expect(useUiStore.getState().capturedPhoto).toBeNull()
    })

    it("setCapturedPhoto stores the photo descriptor", () => {
      useUiStore.getState().setCapturedPhoto({ url: "blob:abc", isStrip: true })
      expect(useUiStore.getState().capturedPhoto).toEqual({ url: "blob:abc", isStrip: true })
    })

    it("setCapturedPhoto(null) clears it", () => {
      useUiStore.getState().setCapturedPhoto({ url: "blob:abc", isStrip: false })
      useUiStore.getState().setCapturedPhoto(null)
      expect(useUiStore.getState().capturedPhoto).toBeNull()
    })

    it("setAppState accepts result", () => {
      useUiStore.getState().setAppState("result")
      expect(useUiStore.getState().appState).toBe("result")
    })

    it("does not persist appState or capturedPhoto", () => {
      const persisted = useUiStore.persist.getOptions().partialize({
        appState: "result",
        capturedPhoto: { url: "blob:x", isStrip: false },
        flashEnabled: true,
        gesturesEnabled: false,
      })
      expect("appState" in persisted).toBe(false)
      expect("capturedPhoto" in persisted).toBe(false)
      expect(persisted.flashEnabled).toBe(true)
    })
  })
  ```
- [ ] **Step 2: Run it — expect FAIL.**
  Run: `npx vitest run src/__tests__/uiStore.result.test.js`
  Expected: FAIL — `setCapturedPhoto is not a function` / `capturedPhoto` undefined.
- [ ] **Step 3: Add the initial state.** In `src/stores/uiStore.js`, replace the app-phase comment/line (`:8-9`):
  ```js
      // --- App phase (not persisted) ---
      appState: "camera", // "camera" | "countdown" | "capturing"
  ```
  with:
  ```js
      // --- App phase (not persisted) ---
      appState: "camera", // "camera" | "countdown" | "capturing" | "result"

      // --- Transient captured photo for the result overlay (not persisted).
      // { url: objectURL, isStrip: boolean } | null. The object URL is created
      // and revoked by PhotoBooth/PhotoResultOverlay, never persisted.
      capturedPhoto: null,
  ```
- [ ] **Step 4: Add the setter.** In the same file, after the `setAppState` action (`:41`):
  ```js
      setAppState: (appState) => set({ appState }),
  ```
  add on the next line:
  ```js
      setCapturedPhoto: (capturedPhoto) => set({ capturedPhoto }),
  ```
- [ ] **Step 5: Add the rehydrate guard to the persist options.** In `src/stores/uiStore.js`, the persist options object currently is:
  ```js
      {
        name: "ui-settings",
        partialize: (state) => ({
  ```
  Insert an `onRehydrateStorage` BEFORE `name` so the object becomes:
  ```js
      {
        onRehydrateStorage: () => (state) => {
          // appState/capturedPhoto are never persisted; force transient defaults
          // after any rehydrate so a reload can never resurrect a "result" frame.
          if (state) {
            state.appState = "camera"
            state.capturedPhoto = null
          }
        },
        name: "ui-settings",
        partialize: (state) => ({
  ```
  (Leave the `partialize` body unchanged — it already omits `appState` and now also omits `capturedPhoto` because we are NOT adding either to it.)
- [ ] **Step 6: Run it — expect PASS.**
  Run: `npx vitest run src/__tests__/uiStore.result.test.js`
  Expected: PASS (5 tests).
- [ ] **Step 7: Lint.**
  Run: `npx eslint --fix src/stores/uiStore.js`
  Expected: no errors.
- [ ] **Step 8: Stage.**
  Run: `git add src/stores/uiStore.js && git add -f src/__tests__/uiStore.result.test.js`

---

### Task 5: globals.css — new keyframes + `--animate-*` tokens; retire `hand-wave`

Add tokens/keyframes for: speech-bubble pop, mascot idle bob, send-fly (photo glides to the Discord mark), gold ripple, QR entrance, countdown ring. Remove the now-unused `--animate-wave`/`hand-wave` (the 👋 emoji is removed in Task 6). Keep `attract-fade-up`/`--animate-attract-cta` (still referenced elsewhere — verify before removing; this plan does NOT remove it).

**Files:**
- Modify: `src/app/globals.css` — `@theme` tokens block (`:44-58`) and the `@keyframes` section (after `:276`, before the reduced-motion rule at `:278`).

**Interfaces:**
- Produces CSS utility tokens: `animate-bubble-pop`, `animate-mascot-bob`, `animate-send-fly`, `animate-gold-ripple`, `animate-qr-in`, `animate-countdown-ring`. (Tailwind v4 turns each `--animate-X: …` into the `animate-X` utility.)

- [ ] **Step 1: Remove the unused wave token.** In `src/app/globals.css`, delete this line in the `@theme` block (`:56`):
  ```css
    --animate-wave: hand-wave 1.8s var(--ease-standard) infinite;
  ```
- [ ] **Step 2: Add the new tokens.** In the same `@theme` block, immediately after the `--animate-peace-bob` line (`:58`):
  ```css
    --animate-peace-bob: peace-bob 1.7s ease-in-out infinite;
  ```
  insert:
  ```css

    /* Attract screen */
    --animate-mascot-bob: mascot-bob 3.2s ease-in-out infinite;
    --animate-bubble-pop: bubble-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) backwards;

    /* Post-capture result overlay */
    --animate-send-fly: send-fly 1.6s var(--ease-standard) forwards;
    --animate-gold-ripple: gold-ripple 0.7s var(--ease-standard) forwards;
    --animate-qr-in: qr-in 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) backwards;
    --animate-countdown-ring: countdown-ring 9s linear forwards;
  ```
- [ ] **Step 3: Remove the `hand-wave` keyframes.** Delete this block (`:260-264`):
  ```css
  @keyframes hand-wave {
    0%, 60%, 100% { transform: rotate(0deg); }
    10% { transform: rotate(14deg); }
    30% { transform: rotate(-8deg); }
  }
  ```
- [ ] **Step 4: Add the new keyframes.** Insert these blocks AFTER the `peace-bob` keyframes (`:273-276`) and BEFORE the `@media (prefers-reduced-motion: reduce)` rule (`:278`):
  ```css

  /* Mascot gentle idle bob */
  @keyframes mascot-bob {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-0.5rem); }
  }

  /* Speech bubble pops in */
  @keyframes bubble-pop {
    0% { opacity: 0; transform: scale(0.85) translateY(0.5rem); }
    100% { opacity: 1; transform: scale(1) translateY(0); }
  }

  /* Captured photo tilts and glides toward the Discord mark */
  @keyframes send-fly {
    0% {
      transform: translate(0, 0) rotate(0deg) scale(1);
      opacity: 1;
      filter: blur(0);
    }
    65% {
      transform: translate(0, -16vh) rotate(-8deg) scale(0.55);
      opacity: 1;
      filter: blur(0.5px);
    }
    100% {
      transform: translate(0, -22vh) rotate(-4deg) scale(0.32);
      opacity: 0.9;
      filter: blur(0);
    }
  }

  /* Gold success ripple expanding from the Discord mark */
  @keyframes gold-ripple {
    0% { transform: scale(0.2); opacity: 0.65; }
    100% { transform: scale(2.6); opacity: 0; }
  }

  /* QR card scales into the join hint */
  @keyframes qr-in {
    0% { opacity: 0; transform: scale(0.6); }
    100% { opacity: 1; transform: scale(1); }
  }

  /* Countdown ring sweep (SVG stroke-dashoffset) for auto-return */
  @keyframes countdown-ring {
    0% { stroke-dashoffset: 0; }
    100% { stroke-dashoffset: var(--ring-circumference, 283); }
  }
  ```
- [ ] **Step 5: Confirm `--animate-wave`/`hand-wave` are no longer referenced anywhere.**
  Run: `grep -rn "animate-wave\|hand-wave" src/`
  Expected: NO matches (the 👋 emoji block is removed in Task 6; if any match remains in `AttractOverlay.jsx`, that file is rewritten next — but no OTHER file should reference it). If a match appears outside `AttractOverlay.jsx`, STOP and re-add the token instead of removing it.
- [ ] **Step 6: Build-sanity (Tailwind compiles the new tokens).**
  Run: `grep -n "animate-mascot-bob\|animate-send-fly\|countdown-ring" src/app/globals.css`
  Expected: token + keyframe lines present.
- [ ] **Step 7: Stage.**
  Run: `git add src/app/globals.css`

---

### Task 6: Add join-hint copy to config

**Files:**
- Modify: `src/lib/config/index.js` — append after `DISCORD_MESSAGE` (`:85-86`).

**Interfaces:**
- Produces: `JOIN_HINT = { TITLE: string, SUBTITLE: string, COMMUNITY: string }` (inline Dutch). `QR_CODE` (already exported from `./overlays`, `src/lib/config/index.js:2`) is reused unchanged for the QR image.

- [ ] **Step 1: Add the copy block.** In `src/lib/config/index.js`, after the closing line of `DISCORD_MESSAGE` (the file currently ends at `:86`), append:
  ```js

  // --- Join-Discord-to-download hint (shown in the post-capture result overlay) ---
  export const JOIN_HINT = {
    TITLE: "Word lid van DAC",
    SUBTITLE: "en download je foto in Discord",
    COMMUNITY: "Dutch Anime Community",
  }
  ```
- [ ] **Step 2: Verify it parses / exports.**
  Run: `node --input-type=module -e "import('./src/lib/config/index.js').then(m=>console.log(m.JOIN_HINT.TITLE, '|', m.QR_CODE.src))"`
  Expected: prints `Word lid van DAC | /overlays/qr-discord.svg` (BASE_PATH empty in dev).
  > If Node cannot resolve the `@/…` alias inside `presets`/`overlays` imports, skip this probe and instead run: `npx eslint src/lib/config/index.js` (expected: no errors) — the export shape is trivial.
- [ ] **Step 3: Lint.**
  Run: `npx eslint --fix src/lib/config/index.js`
  Expected: no errors.
- [ ] **Step 4: Stage.**
  Run: `git add src/lib/config/index.js`

---

### Task 7: Rewrite `AttractOverlay.jsx` — mascot + speech bubble, no scrim, touch-aware, responsive

Replaces the centered-text-over-scrim with a bottom-right `amelia-smile.webp` mascot and a speech bubble. NO full-screen dimming. Bubble sits LEFT of the mascot on landscape/wide (`row`) and ABOVE it on portrait/narrow (`column`). `clamp()` sizing; cluster width capped; cluster kept clear of the bottom-center `CaptureButton` (rendered `<1200px` at `bottom-[12%]`, and in `max-lg:landscape` at `right-[8%] top-1/2`). Touch-aware copy via `useIsTouch`. Mascot idle bob + bubble pop. Respects reduced motion (global rule). Visibility prop shape unchanged: `visible` boolean.

**Files:**
- Rewrite: `src/components/camera/AttractOverlay.jsx` (full file, currently 38 lines).

**Interfaces:**
- Consumes: prop `visible: boolean` (unchanged — `CameraView.jsx:188` passes `visible={showAttract && isReady}`); `useIsTouch()` from `@/hooks/useIsTouch`; `cn` from `@/lib/styles/cn`; `QR`/mascot path via inline ``${BASE_PATH}…`` (mascot is the fixed `amelia-smile.webp`).
- Produces: `AttractOverlay({ visible })` — named export, unchanged signature.

- [ ] **Step 1: Rewrite the file.** Replace the ENTIRE contents of `src/components/camera/AttractOverlay.jsx` with:
  ```jsx
  "use client"

  import { cn } from "@/lib/styles/cn"
  import { useIsTouch } from "@/hooks/useIsTouch"

  const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || ""
  const MASCOT_SRC = `${BASE_PATH}/overlays/mascots/amelia-smile.webp`

  /**
   * Attract screen shown after inactivity.
   *
   * No full-screen scrim — the live preview stays bright so people see
   * themselves. A fixed "amelia-smile" mascot sits bottom-right with a speech
   * bubble at her upper-left (row on landscape/wide; column/above on
   * portrait/narrow so it never clips). Copy is touch-aware. Motion is a gentle
   * mascot bob + a bubble pop, both reduced by the global prefers-reduced-motion
   * rule. Tapping/moving/waving (handled upstream) dismisses it.
   */
  export function AttractOverlay({ visible }) {
    const isTouch = useIsTouch()
    const subtitle = isTouch
      ? "Tik op het scherm"
      : "Zwaai met je hand of tik op het scherm"

    return (
      <div
        aria-hidden={!visible}
        className={cn(
          "pointer-events-none absolute inset-0 z-30 flex items-end justify-end p-4 transition-opacity duration-700 md:p-6",
          visible ? "opacity-100" : "opacity-0",
        )}
      >
        {/* Bottom-right cluster: bubble + mascot.
            Portrait => stack (column, bubble above). Landscape => row, bubble left. */}
        <div className="flex max-w-[min(90vw,40rem)] flex-col items-end gap-2 landscape:flex-row landscape:items-end landscape:gap-3">
          {/* Speech bubble */}
          <div
            className={cn(
              "relative max-w-[min(78vw,22rem)] rounded-[1.6rem] border border-gold/35 bg-surface/95 px-5 py-4 shadow-[0_10px_40px_rgba(0,0,0,0.5)] backdrop-blur-md",
              "landscape:self-center",
              visible && "animate-bubble-pop",
            )}
          >
            <p className="text-center font-display text-2xl font-semibold tracking-tight text-ink md:text-3xl">
              Kom op de foto!
            </p>
            <p className="mt-1 text-center text-sm text-ink-muted md:text-base">{subtitle}</p>

            {/* Tail — points down toward the mascot (portrait/stacked) … */}
            <span
              aria-hidden="true"
              className="absolute -bottom-2 right-10 h-4 w-4 rotate-45 border-b border-r border-gold/35 bg-surface/95 landscape:hidden"
            />
            {/* … or points right toward the mascot (landscape/row). */}
            <span
              aria-hidden="true"
              className="absolute -right-2 top-1/2 hidden h-4 w-4 -translate-y-1/2 rotate-45 border-r border-t border-gold/35 bg-surface/95 landscape:block"
            />
          </div>

          {/* Mascot — fixed amelia-smile, anchored bottom-right, gentle bob.
              clamp() height ≈22vh (small) → ≈38vh (large). Kept clear of the
              bottom-center capture button (which is bottom-[12%], <1200px). */}
          <img
            src={MASCOT_SRC}
            alt=""
            aria-hidden="true"
            draggable="false"
            className={cn("h-auto w-auto select-none object-contain", visible && "animate-mascot-bob")}
            style={{ height: "clamp(11rem, 28vh, 22rem)", maxWidth: "min(46vw, 22rem)" }}
          />
        </div>
      </div>
    )
  }
  ```
- [ ] **Step 2: Verify there is no scrim and no emoji left.**
  Run: `grep -n "rgba(12,11,16\|👋\|animate-wave\|radial-gradient" src/components/camera/AttractOverlay.jsx`
  Expected: NO matches (scrim, emoji, and wave token are gone).
- [ ] **Step 3: Confirm the mount prop shape is unchanged in `CameraView.jsx`.**
  Run: `grep -n "AttractOverlay" src/components/camera/CameraView.jsx`
  Expected: `:188` still `<AttractOverlay visible={showAttract && isReady} />`. No change needed (the rewrite kept the `visible` prop).
- [ ] **Step 4: Lint.**
  Run: `npx eslint --fix src/components/camera/AttractOverlay.jsx`
  Expected: no errors. (Note: `<img>` here is intentional — overlay decoration, not `next/image`; if a `@next/next/no-img-element` warning appears, it is acceptable and matches existing overlay usage — confirm by `grep -rn "no-img-element" eslint.config.* .eslintrc* 2>/dev/null` and, if the rule is on as an error, add an inline `{/* eslint-disable-next-line @next/next/no-img-element */}` above the `<img>`.)
- [ ] **Step 5: Stage.**
  Run: `git add src/components/camera/AttractOverlay.jsx`

---

### Task 8: New `PhotoResultOverlay.jsx` — post-capture phase machine

A full-screen overlay shown while `appState === "result"`. It owns the whole timeline. Phases: `reveal` (~0.4s, photo settles in center) → `sending` (min ~1.6s OR until the send resolves, whichever is longer; photo glides toward a Discord mark, "Versturen naar Discord…" with animated dots) → `outcome` (~0.6s, honest result: success / queued / error) → `joinHint` (photo shrinks to a corner thumbnail, `qr-discord.svg` scales in with join copy + countdown ring) → `dismiss` (auto after ~9s in joinHint, or tap anywhere). On dismiss it revokes the object URL, clears `capturedPhoto`, and sets `appState` back to `"camera"`. Sequencing is JS-timer driven so reduced motion cannot stall it. Outcome is read from the REAL `sendOrQueue` result handed in as a promise.

**Files:**
- Create: `src/components/capture/PhotoResultOverlay.jsx`
- Create: `src/__tests__/photoResultOverlay.test.js`

**Interfaces:**
- Consumes (props): `photo: { url: string, isStrip: boolean }`, `sendPromise: Promise<{ success: boolean, queued: boolean }>` (the exact shape returned by `sendOrQueue` — `{ success, queued }`; a thrown/rejected promise is treated as `error`), `onDismiss: () => void`. Also imports `JOIN_HINT`, `QR_CODE` from `@/lib/config`; `cn` from `@/lib/styles/cn`.
- Produces: `PhotoResultOverlay({ photo, sendPromise, onDismiss })` — named export. It calls `onDismiss()` once, after the join-hint timer or a tap. It does NOT itself revoke the URL or touch the store — the caller (PhotoBooth, Task 9) revokes the URL and resets state inside `onDismiss`. (This keeps the overlay pure/testable; the spec's "revoked on dismiss" is satisfied by the caller's `onDismiss`.)
- Internal phase constant `PHASES = ["reveal", "sending", "outcome", "joinHint"]`; outcome kinds `"success" | "queued" | "error"`.

**Timing constants (named, reused in tests):** `REVEAL_MS = 400`, `SENDING_MIN_MS = 1600`, `OUTCOME_MS = 600`, `JOIN_HINT_MS = 9000`.

- [ ] **Step 1: Write the failing test.**
  Create `src/__tests__/photoResultOverlay.test.js`:
  ```js
  // @vitest-environment happy-dom
  import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
  import { render, screen, act } from "@testing-library/react"
  import { PhotoResultOverlay } from "@/components/capture/PhotoResultOverlay"

  function flushMicrotasks() {
    return act(async () => {
      await Promise.resolve()
      await Promise.resolve()
    })
  }

  describe("PhotoResultOverlay phase machine", () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })
    afterEach(() => {
      vi.runOnlyPendingTimers()
      vi.useRealTimers()
    })

    it("shows the sending copy during the sending phase", async () => {
      const photo = { url: "blob:x", isStrip: false }
      render(
        <PhotoResultOverlay
          photo={photo}
          sendPromise={Promise.resolve({ success: true, queued: false })}
          onDismiss={() => {}}
        />,
      )
      await act(async () => {
        vi.advanceTimersByTime(400) // reveal -> sending
      })
      expect(screen.getByText(/Versturen naar Discord/i)).toBeTruthy()
    })

    it("renders the success outcome when the send succeeds", async () => {
      const photo = { url: "blob:x", isStrip: false }
      render(
        <PhotoResultOverlay
          photo={photo}
          sendPromise={Promise.resolve({ success: true, queued: false })}
          onDismiss={() => {}}
        />,
      )
      await act(async () => {
        vi.advanceTimersByTime(400 + 1600) // reveal + sending min
      })
      await flushMicrotasks()
      expect(screen.getByText(/Verzonden/i)).toBeTruthy()
    })

    it("renders the queued outcome when the send is queued", async () => {
      const photo = { url: "blob:x", isStrip: false }
      render(
        <PhotoResultOverlay
          photo={photo}
          sendPromise={Promise.resolve({ success: false, queued: true })}
          onDismiss={() => {}}
        />,
      )
      await act(async () => {
        vi.advanceTimersByTime(400 + 1600)
      })
      await flushMicrotasks()
      expect(screen.getByText(/weer online bent/i)).toBeTruthy()
    })

    it("renders the error outcome when the send rejects", async () => {
      const photo = { url: "blob:x", isStrip: false }
      render(
        <PhotoResultOverlay
          photo={photo}
          sendPromise={Promise.reject(new Error("boom"))}
          onDismiss={() => {}}
        />,
      )
      await act(async () => {
        vi.advanceTimersByTime(400 + 1600)
      })
      await flushMicrotasks()
      expect(screen.getByText(/proberen het automatisch opnieuw/i)).toBeTruthy()
    })

    it("auto-dismisses after the full sequence", async () => {
      const onDismiss = vi.fn()
      const photo = { url: "blob:x", isStrip: false }
      render(
        <PhotoResultOverlay
          photo={photo}
          sendPromise={Promise.resolve({ success: true, queued: false })}
          onDismiss={onDismiss}
        />,
      )
      await act(async () => {
        vi.advanceTimersByTime(400 + 1600)
      })
      await flushMicrotasks()
      await act(async () => {
        vi.advanceTimersByTime(600 + 9000) // outcome + joinHint
      })
      expect(onDismiss).toHaveBeenCalledTimes(1)
    })

    it("tap dismisses immediately during the join hint", async () => {
      const onDismiss = vi.fn()
      const photo = { url: "blob:x", isStrip: false }
      const { container } = render(
        <PhotoResultOverlay
          photo={photo}
          sendPromise={Promise.resolve({ success: true, queued: false })}
          onDismiss={onDismiss}
        />,
      )
      await act(async () => {
        vi.advanceTimersByTime(400 + 1600)
      })
      await flushMicrotasks()
      await act(async () => {
        vi.advanceTimersByTime(600) // into joinHint
      })
      act(() => {
        container.firstChild.click()
      })
      expect(onDismiss).toHaveBeenCalledTimes(1)
    })
  })
  ```
- [ ] **Step 2: Run it — expect FAIL (module missing).**
  Run: `npx vitest run src/__tests__/photoResultOverlay.test.js`
  Expected: FAIL — `Failed to resolve import "@/components/capture/PhotoResultOverlay"`.
- [ ] **Step 3: Implement the overlay.**
  Create `src/components/capture/PhotoResultOverlay.jsx`:
  ```jsx
  "use client"

  import { useState, useEffect, useRef, useCallback } from "react"
  import { cn } from "@/lib/styles/cn"
  import { JOIN_HINT, QR_CODE } from "@/lib/config"

  const REVEAL_MS = 400
  const SENDING_MIN_MS = 1600
  const OUTCOME_MS = 600
  const JOIN_HINT_MS = 9000

  function DiscordMark({ className }) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M20.317 4.369a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.371-.291a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.009c.12.099.245.198.372.292a.077.077 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.891.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
      </svg>
    )
  }

  /**
   * Self-contained post-capture overlay. Owns the full timeline:
   * reveal -> sending -> outcome -> joinHint -> (onDismiss).
   *
   * Sequencing is JS-timer driven (NOT animationend) so the global
   * prefers-reduced-motion rule, which near-zeroes CSS durations, cannot stall
   * the flow. The honest outcome is read from the real sendOrQueue result
   * handed in as `sendPromise` ({ success, queued }); a rejection => "error".
   *
   * The caller's `onDismiss` is responsible for revoking the object URL and
   * resetting app state. This component is otherwise pure/presentational.
   */
  export function PhotoResultOverlay({ photo, sendPromise, onDismiss }) {
    const [phase, setPhase] = useState("reveal")
    const [outcome, setOutcome] = useState(null) // "success" | "queued" | "error"
    const sendDoneRef = useRef(false)
    const sendOutcomeRef = useRef(null)
    const dismissedRef = useRef(false)
    const timers = useRef([])

    const after = useCallback((ms, fn) => {
      const id = setTimeout(fn, ms)
      timers.current.push(id)
      return id
    }, [])

    const dismiss = useCallback(() => {
      if (dismissedRef.current) return
      dismissedRef.current = true
      timers.current.forEach(clearTimeout)
      timers.current = []
      onDismiss()
    }, [onDismiss])

    // Resolve the real send result once.
    useEffect(() => {
      let alive = true
      Promise.resolve(sendPromise)
        .then((r) => {
          if (!alive) return
          sendOutcomeRef.current = r && r.success ? "success" : r && r.queued ? "queued" : "error"
          sendDoneRef.current = true
        })
        .catch(() => {
          if (!alive) return
          sendOutcomeRef.current = "error"
          sendDoneRef.current = true
        })
      return () => {
        alive = false
      }
    }, [sendPromise])

    // Drive the phase machine with JS timers.
    useEffect(() => {
      // reveal -> sending
      after(REVEAL_MS, () => setPhase("sending"))

      // After the sending minimum, wait (poll) until the real send resolves,
      // then move to the outcome frame. Poll keeps the "no premature success"
      // guarantee without depending on animationend.
      const startedAt = Date.now()
      const tick = () => {
        const elapsed = Date.now() - startedAt
        if (elapsed >= REVEAL_MS + SENDING_MIN_MS && sendDoneRef.current) {
          setOutcome(sendOutcomeRef.current || "error")
          setPhase("outcome")
          // outcome -> joinHint
          after(OUTCOME_MS, () => setPhase("joinHint"))
          return
        }
        after(120, tick)
      }
      after(REVEAL_MS + SENDING_MIN_MS, tick)

      return () => {
        timers.current.forEach(clearTimeout)
        timers.current = []
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Auto-dismiss once we reach the join hint.
    useEffect(() => {
      if (phase !== "joinHint") return undefined
      const id = setTimeout(dismiss, JOIN_HINT_MS)
      return () => clearTimeout(id)
    }, [phase, dismiss])

    const inJoinHint = phase === "joinHint"

    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Foto verzonden"
        onClick={dismiss}
        className="fixed inset-0 z-[60] flex items-center justify-center bg-ground/92 backdrop-blur-md"
      >
        {/* Photo — center during reveal/sending/outcome, shrinks to a corner thumb in joinHint */}
        <img
          src={photo.url}
          alt=""
          aria-hidden="true"
          draggable="false"
          className={cn(
            "select-none rounded-2xl border border-hairline-strong object-contain shadow-[0_20px_60px_rgba(0,0,0,0.6)] transition-all duration-500 ease-out",
            inJoinHint
              ? "fixed bottom-6 right-6 max-h-[22vh] max-w-[22vw]"
              : "max-h-[64vh] max-w-[80vw]",
            phase === "reveal" && "animate-pop-in",
            phase === "sending" && "animate-send-fly",
          )}
        />

        {/* Sending + outcome cluster */}
        {!inJoinHint && (
          <div className="pointer-events-none absolute inset-x-0 bottom-[14%] flex flex-col items-center gap-4">
            <span className="relative flex h-16 w-16 items-center justify-center">
              {outcome === "success" && (
                <span
                  aria-hidden="true"
                  className="absolute inset-0 rounded-full bg-gold/40 animate-gold-ripple"
                />
              )}
              <DiscordMark
                className={cn(
                  "h-12 w-12",
                  outcome === "success" ? "text-gold" : "text-ink-muted",
                )}
              />
            </span>

            {phase === "sending" && (
              <p className="text-lg font-medium text-ink">
                Versturen naar Discord
                <span className="animate-splash-dots">.</span>
                <span className="animate-splash-dots" style={{ animationDelay: "0.2s" }}>
                  .
                </span>
                <span className="animate-splash-dots" style={{ animationDelay: "0.4s" }}>
                  .
                </span>
              </p>
            )}

            {phase === "outcome" && outcome === "success" && (
              <p className="text-xl font-semibold text-gold">Verzonden! ✓</p>
            )}
            {phase === "outcome" && outcome === "queued" && (
              <p className="max-w-[80vw] text-center text-lg font-medium text-warning">
                Wordt verzonden zodra je weer online bent
              </p>
            )}
            {phase === "outcome" && outcome === "error" && (
              <p className="max-w-[80vw] text-center text-lg font-medium text-danger">
                Versturen lukte even niet — we proberen het automatisch opnieuw
              </p>
            )}
          </div>
        )}

        {/* Join-Discord hint */}
        {inJoinHint && (
          <div className="flex flex-col items-center gap-5 px-6 text-center animate-qr-in">
            <img
              src={QR_CODE.src}
              alt=""
              aria-hidden="true"
              draggable="false"
              className="h-44 w-44 rounded-2xl border border-gold/30 bg-white p-3 shadow-[0_12px_40px_rgba(0,0,0,0.5)] md:h-52 md:w-52"
            />
            <div>
              <p className="font-display text-2xl font-semibold tracking-tight text-ink md:text-3xl">
                {JOIN_HINT.TITLE}
              </p>
              <p className="mt-1 text-base text-ink-muted md:text-lg">{JOIN_HINT.SUBTITLE}</p>
              <p className="mt-2 text-sm text-gold">{JOIN_HINT.COMMUNITY}</p>
            </div>

            {/* Countdown ring — purely decorative auto-return indicator */}
            <svg viewBox="0 0 100 100" className="h-10 w-10 -rotate-90" aria-hidden="true">
              <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(245,241,232,0.12)" strokeWidth="6" />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="var(--color-gold)"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray="283"
                className="animate-countdown-ring"
                style={{ "--ring-circumference": "283" }}
              />
            </svg>

            <p className="text-xs text-ink-dim">Tik om door te gaan</p>
          </div>
        )}
      </div>
    )
  }
  ```
- [ ] **Step 4: Run it — expect PASS.**
  Run: `npx vitest run src/__tests__/photoResultOverlay.test.js`
  Expected: PASS (6 tests). If the `tap dismisses` test flakes because the click target is the `<img>` not the root, the `dismiss` handler on the root still fires via bubbling — keep `onClick={dismiss}` on the root `<div>` only.
- [ ] **Step 5: Lint.**
  Run: `npx eslint --fix src/components/capture/PhotoResultOverlay.jsx`
  Expected: no errors. (If `@next/next/no-img-element` is an error in this repo, add `{/* eslint-disable-next-line @next/next/no-img-element */}` above each `<img>` — same handling as Task 7 Step 4.)
- [ ] **Step 6: Stage.**
  Run: `git add src/components/capture/PhotoResultOverlay.jsx && git add -f src/__tests__/photoResultOverlay.test.js`

---

### Task 9: Wire `PhotoBooth.jsx` — park the blob, enter `result`, render the overlay

`doCapture` (single mode) and `handleStripComplete` (strip mode) currently set `appState("camera")` and fire-and-forget `sendAndTrack`. Change them to: create an object URL for the blob, set `capturedPhoto` + `appState("result")`, and start `sendAndTrack` returning its `sendOrQueue` result so the overlay can reflect it. `addPhoto` (gallery/IndexedDB) and analytics stay. Render `<PhotoResultOverlay>` when `appState === "result"`. `onDismiss` revokes the URL, clears `capturedPhoto`, and returns `appState` to `"camera"`. `UploadStatus` stays mounted (background queue-drain feedback) but `sendAndTrack` no longer needs to create a pill for the in-overlay flow — keep `sendAndTrack` as the queue-aware sender and have it RETURN the result for the overlay.

**Verified current code** (`PhotoBooth.jsx`): `sendAndTrack` is `:154-191` and returns nothing; `handleStripComplete` is `:194-207`; `doCapture` is `:305-329`; render/return is `:443-551`; `<UploadStatus … />` is `:518`.

**Files:**
- Modify: `src/components/PhotoBooth.jsx` — import (`:15`), `sendAndTrack` (`:154-191`), `handleStripComplete` (`:194-207`), `doCapture` (`:305-329`), render section (add overlay near `:519`).

**Interfaces:**
- Consumes: `useUiStore` `setCapturedPhoto` (Task 4), `capturedPhoto`, `setAppState`; `PhotoResultOverlay` (Task 8) with props `photo`, `sendPromise`, `onDismiss`.
- Produces: `parkAndSend(blob, { isStrip }): void` (new helper) that creates the object URL, sets store fields, and stores the in-flight `sendOrQueue` promise in a ref for the overlay; `handleResultDismiss(): void`.
- `sendAndTrack(blob, { isStrip }): Promise<{ success, queued }>` — now RETURNS the result (was `void`).

- [ ] **Step 1: Import the overlay.** In `src/components/PhotoBooth.jsx`, after the existing import at `:15`:
  ```js
  import { UploadStatus, createUploadEntry } from "./ui/UploadStatus"
  ```
  add:
  ```js
  import { PhotoResultOverlay } from "./capture/PhotoResultOverlay"
  ```
- [ ] **Step 2: Pull the new store actions/state.** After the existing `setAppState` line (`:70`):
  ```js
    const setAppState = useUiStore((s) => s.setAppState)
  ```
  add:
  ```js
    const capturedPhoto = useUiStore((s) => s.capturedPhoto)
    const setCapturedPhoto = useUiStore((s) => s.setCapturedPhoto)
  ```
- [ ] **Step 3: Make `sendAndTrack` return its result.** In `sendAndTrack` (`:154-191`), the three branches currently `return` (in the catch) or fall through. Change the function so it returns the result object. Replace the catch block and the final branches:
  Current (`:164-189`):
  ```js
        let result
        try {
          result = await sendOrQueue(blob)
        } catch {
          update("error")
          trackEvent("discord_failed", { isStrip })
          return
        }

        if (result.success) {
          update("success")
          trackEvent("discord_sent", { isStrip })
        } else if (result.queued) {
          update("queued")
          trackEvent("discord_queued", { isStrip })
        } else {
          update("error")
          trackEvent("discord_failed", { isStrip })
        }

        logger.info("capture", "Photo captured", {
          sent: result.success,
          queued: result.queued,
          isStrip,
        })
  ```
  Replace with:
  ```js
        let result
        try {
          result = await sendOrQueue(blob)
        } catch {
          update("error")
          trackEvent("discord_failed", { isStrip })
          return { success: false, queued: false }
        }

        if (result.success) {
          update("success")
          trackEvent("discord_sent", { isStrip })
        } else if (result.queued) {
          update("queued")
          trackEvent("discord_queued", { isStrip })
        } else {
          update("error")
          trackEvent("discord_failed", { isStrip })
        }

        logger.info("capture", "Photo captured", {
          sent: result.success,
          queued: result.queued,
          isStrip,
        })

        return result
  ```
  > Note: `UploadStatus` pills still get created/updated by `sendAndTrack`. The spec says keep `UploadStatus` for background queue-drain only and avoid double-feedback during the result overlay. To prevent the pill appearing on top of the overlay, Step 4 routes the in-overlay send through a path that does NOT create a pill. We therefore split sending: `sendAndTrack` keeps the pill (used only for the rare non-overlay path / future background sends), and add a pill-free `sendForResult` used by the overlay flow.
- [ ] **Step 4: Add a pill-free sender + a ref to hold the in-flight promise + a park helper + a dismiss handler.** Insert AFTER the `sendAndTrack` definition (after its closing `, [addPhoto])` at `:191`):
  ```js

    // Send used by the result overlay: saves to gallery + sends, returns the
    // honest sendOrQueue result, and creates NO UploadStatus pill (the overlay
    // is the feedback; the corner pill is reserved for background queue drains).
    const sendForResult = useCallback(
      async (blob, { isStrip = false } = {}) => {
        await addPhoto(blob)
        let result
        try {
          result = await sendOrQueue(blob)
        } catch {
          trackEvent("discord_failed", { isStrip })
          return { success: false, queued: false }
        }
        if (result.success) trackEvent("discord_sent", { isStrip })
        else if (result.queued) trackEvent("discord_queued", { isStrip })
        else trackEvent("discord_failed", { isStrip })
        logger.info("capture", "Photo captured", {
          sent: result.success,
          queued: result.queued,
          isStrip,
        })
        return result
      },
      [addPhoto],
    )

    // Holds the in-flight send promise for the active result overlay.
    const resultSendRef = useRef(null)

    // Park the captured blob as an object URL, start the send, enter "result".
    const parkAndSend = useCallback(
      (blob, { isStrip = false } = {}) => {
        const url = URL.createObjectURL(blob)
        resultSendRef.current = sendForResult(blob, { isStrip })
        setCapturedPhoto({ url, isStrip })
        setAppState("result")
      },
      [sendForResult, setCapturedPhoto, setAppState],
    )

    // Overlay dismiss: revoke the object URL, clear it, return to camera.
    const handleResultDismiss = useCallback(() => {
      const current = useUiStore.getState().capturedPhoto
      if (current?.url) URL.revokeObjectURL(current.url)
      resultSendRef.current = null
      setCapturedPhoto(null)
      setAppState("camera")
    }, [setCapturedPhoto, setAppState])
  ```
- [ ] **Step 5: Rewrite the single-photo branch of `doCapture`.** In `doCapture` (`:305-329`), the `else` branch currently is (`:320-323`):
  ```js
        if (isStrip) {
          await stripRef.current.addPhoto(blob)
        } else {
          setAppState("camera")
          sendAndTrack(blob)
        }
  ```
  Replace with:
  ```js
        if (isStrip) {
          await stripRef.current.addPhoto(blob)
        } else {
          parkAndSend(blob)
        }
  ```
  Then update `doCapture`'s dependency array (`:329`) from `[captureOnePhoto, sendAndTrack, setAppState]` to:
  ```js
    }, [captureOnePhoto, parkAndSend, setAppState])
  ```
- [ ] **Step 6: Rewrite `handleStripComplete`.** Currently (`:194-207`):
  ```js
    const handleStripComplete = useCallback(
      async (blob) => {
        useUiStore.getState().toggleStripMode()

        const overlayState = useOverlayStore.getState()
        trackEvent("strip_completed", {
          mascotId: overlayState.mascotId,
          layoutId: overlayState.layoutId,
        })
        sendAndTrack(blob, { isStrip: true })
        setAppState("camera")
      },
      [sendAndTrack, setAppState],
    )
  ```
  Replace with:
  ```js
    const handleStripComplete = useCallback(
      async (blob) => {
        useUiStore.getState().toggleStripMode()

        const overlayState = useOverlayStore.getState()
        trackEvent("strip_completed", {
          mascotId: overlayState.mascotId,
          layoutId: overlayState.layoutId,
        })
        parkAndSend(blob, { isStrip: true })
      },
      [parkAndSend],
    )
  ```
  > Ordering note: `parkAndSend` and `handleResultDismiss` are defined in Step 4 AFTER `sendAndTrack` (`:191`) but `handleStripComplete` is currently at `:194` — i.e. `parkAndSend` is declared just before `handleStripComplete`, so the reference resolves. If the linter reports use-before-define, move the entire Step-4 block to sit immediately BEFORE `handleStripComplete`. Verify with the lint step.
- [ ] **Step 7: Render the overlay.** In the return/JSX, immediately BEFORE the `<UploadStatus … />` line (`:518`):
  ```jsx
          <UploadStatus entries={displayUploadEntries} onDismiss={dismissEntry} />
  ```
  insert:
  ```jsx
          {appState === "result" && capturedPhoto && resultSendRef.current && (
            <PhotoResultOverlay
              photo={capturedPhoto}
              sendPromise={resultSendRef.current}
              onDismiss={handleResultDismiss}
            />
          )}

  ```
- [ ] **Step 8: Guard the capture trigger against the new `result` state.** `handleCapture` (`:281-293`) already early-returns unless `appState === "camera"` for the start path, and the countdown-cancel path only triggers on `"countdown"` — so `"result"` is safely ignored. Confirm no change needed:
  Run: `grep -n 'appState !== "camera"\|appState === "countdown"' src/components/PhotoBooth.jsx`
  Expected: the existing guards at `:283` and `:288` are intact. (`gestureCallbacks.onVictory` at `:349` also checks `appState === "camera"`, so gestures cannot fire during `result`.)
- [ ] **Step 9: Lint the file.**
  Run: `npx eslint --fix src/components/PhotoBooth.jsx`
  Expected: no errors. Resolve any use-before-define by relocating the Step-4 block per the Step-6 note.
- [ ] **Step 10: Full unit suite — confirm only the 2 pre-existing failures remain.**
  Run: `npx vitest run src/__tests__ 2>&1 | tail -10`
  Expected: the new `useIsTouch`, `uiStore.result`, and `photoResultOverlay` tests PASS; the only failures are the pre-existing `setLocale changes locale` and `getCanvasSize caps at MAX_PIXELS` (unrelated).
- [ ] **Step 11: Production build sanity (static export must still compile).**
  Run: `npm run build 2>&1 | tail -20`
  Expected: build succeeds (no type/JSX/import errors from the new files).
- [ ] **Step 12: Stage.**
  Run: `git add src/components/PhotoBooth.jsx`

---

### Task 10: Manual screenshot verification (attract layout matrix + full capture→send→join sequence)

Run the real app and screenshot-verify both features per repo convention. Use the project's run skill if present; otherwise `npm run dev` and drive a browser. Resize the window to exercise each viewport bucket. The attract overlay appears after the 60s idle timer — to trigger it quickly during manual testing, you may temporarily lower `useIdleTimer(60_000)` in `PhotoBooth.jsx:63` to e.g. `useIdleTimer(3_000)`, screenshot, then REVERT (do NOT stage the revert change). Do not commit any temporary debug edits.

**Files:** none staged (verification only; revert any temporary timer tweak).

- [ ] **Step 1: Start the app.**
  Run: `npm run dev` (background) and open the booth route in a browser.
- [ ] **Step 2: Attract — Portrait, small (e.g. 390×740).** Idle until the attract overlay shows. Screenshot. Verify: NO dark scrim (live preview bright), bubble STACKED ABOVE the mascot, bubble does not clip off-screen, mascot does not overlap the bottom-center capture button, headline + subtitle legible. On a touch profile the subtitle reads **"Tik op het scherm"**.
- [ ] **Step 3: Attract — Portrait, large (e.g. 1080×1920 / tablet portrait).** Screenshot. Verify mascot scales up via `clamp()` (taller, ≈up to 22rem) without overrunning the capture button; bubble still above.
- [ ] **Step 4: Attract — Landscape, small (e.g. 740×390).** Screenshot. Verify bubble sits to the LEFT of the mascot (row); cluster clear of the `max-lg:landscape` capture button (right `~8%`, vertically centered); nothing clips.
- [ ] **Step 5: Attract — Landscape, large (e.g. 1920×1080).** Screenshot. Verify row layout, capped cluster width (`max-w-[min(90vw,40rem)]`), legibility, no overlap with the `min-[1200px]:hidden` capture button (which is hidden ≥1200px — confirm the cluster reads well with the on-screen capture affordance absent).
- [ ] **Step 6: Non-touch copy.** On a desktop (non-touch) profile, confirm the attract subtitle reads **"Zwaai met je hand of tik op het scherm"** (and **"Tik op het scherm"** under a touch/device-emulation profile in DevTools).
- [ ] **Step 7: Full single-photo sequence (online).** Trigger a capture. Screenshot each phase: reveal (photo settles center), sending ("Versturen naar Discord…" + Discord mark + dots, photo gliding), outcome ("Verzonden! ✓" + gold ripple), join hint (photo shrunk to corner thumb, QR centered with "Word lid van DAC" + "en download je foto in Discord" + community + countdown ring). Confirm it auto-returns to camera after the ring completes, and that a tap dismisses immediately. Confirm NO corner `UploadStatus` pill appears during the overlay.
- [ ] **Step 8: Strip sequence (online).** Enable strip mode, complete a strip capture, and verify the SAME overlay sequence runs for the composited strip image.
- [ ] **Step 9: Offline / queued run.** In DevTools set the network Offline, capture, and verify the outcome frame reads **"Wordt verzonden zodra je weer online bent"** (queued) and the join hint still shows. Go back Online and confirm the background queue drains (a corner `UploadStatus`/`Wachtrij` indicator may appear — that is the intended background feedback, separate from the overlay).
- [ ] **Step 10: Reduced motion.** Enable OS "Reduce motion" (or emulate `prefers-reduced-motion: reduce` in DevTools), repeat Step 7, and confirm the flow still completes end-to-end (reveal→sending→outcome→joinHint→camera) without stalling — only the decorative motion is reduced.
- [ ] **Step 11: Revert any temporary debug edits** (idle timer) so `PhotoBooth.jsx:63` is back to `useIdleTimer(60_000)`.
  Run: `git diff --stat src/components/PhotoBooth.jsx` — expected: only the Task-9 changes remain; no stray timer change.
- [ ] **Step 12: Final lint sweep over all touched source files.**
  Run: `npx eslint --fix src/hooks/useIsTouch.js src/stores/uiStore.js src/lib/config/index.js src/components/camera/AttractOverlay.jsx src/components/capture/PhotoResultOverlay.jsx src/components/PhotoBooth.jsx src/app/globals.css`
  Expected: no errors. Re-stage anything `--fix` modified: `git add <changed files>` (force-add test files if touched).
- [ ] **Step 13: Hand off — DO NOT COMMIT.** Report the staged changes (`git status --short`) and the verification screenshots to the user for review and let them commit.