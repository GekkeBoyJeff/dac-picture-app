# Gesture Detection Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** Fix the gesture pipeline as a fundamental refactor: (1) self-host the MediaPipe assets so the booth works on offline/flaky venue wifi (regression fix), (2) make worker/model failures visible via an always-on hand + health overlay, (3) give the largest-bounding-box hand (closest person) priority to trigger while still measuring every hand, and (4) make `numHands` actually take effect at runtime by re-creating the recognizer.

**Architecture:** `useHandGesture.js` runs a single `requestAnimationFrame` loop, sends `createImageBitmap(video)` frames to a module Web Worker (`public/gesture-worker.js`) that runs MediaPipe Tasks-Vision `GestureRecognizer` (`runningMode:"VIDEO"`, GPU→CPU fallback). Results (per-hand `gestures` + `landmarks`) return to the hook, which boxes every hand, selects the largest-box trigger hand, and runs the capture-hold timer. Sequences/swipe consume the largest-box hand via `rawGestureNameRef` + `primaryHandLandmarksRef`. Testable arbitration logic is extracted into pure helpers in `src/lib/gesture/`.

**Tech Stack:** Next.js 16 static export (`output:"export"`, `basePath`), React 19, plain JS+JSX (NOT TypeScript), Tailwind v4 CSS-first, Zustand stores, `@mediapipe/tasks-vision@0.10.33` (already a dependency — vendored from `node_modules` into `public/mediapipe/`), Vitest tests.

## Global Constraints

- DO NOT run `git commit`. The user commits themselves. Every task ends with a STAGING step that runs `git add <paths>` only. (User preference — non-negotiable.)
- All implementation happens on a NEW feature branch `feature/gesture-detection-refactor`, never on `main`. Task 1 creates it.
- `src/__tests__/` and `vitest.config.mjs` are gitignored. Stage new/changed test files with `git add -f <path>` so they are tracked; source files use plain `git add`.
- New PURE-logic tests live in `src/__tests__/` and run under the `node` Vitest environment (current `vitest.config.mjs` sets `environment: "node"`). Do NOT add DOM/component tests that need jsdom in this plan — every new test here is pure-function only, so no environment change is required. (Reference gotcha: jsdom@29 breaks the `node` require path; keep tests DOM-free.)
- No animation library. The overlay reuses existing CSS classes and inline styles; no `animationend` for sequencing.
- All new UI copy is hardcoded Dutch, matching existing components (e.g. `TopNotice.jsx`, `settingsPresets.js`).
- The worker has NO `process.env`. `BASE_PATH` (`process.env.NEXT_PUBLIC_BASE_PATH || ""`) is known in `useHandGesture.js` (line 19) and MUST be sent to the worker in the `init` message; the worker builds all local asset URLs from it.
- Keep detection in the worker; respect the `busyRef` single-in-flight guard and `detectionIntervalMs` throttle. Keep hand-count tied to device-capability presets; the selectable ceiling lives in two sets that must stay in sync: `src/components/drawers/settings/settingsPresets.js` `handOptions` (line 66) and `src/lib/remote/protocol.js` `HAND_OPTIONS` (line 51, enforced line 76). This plan does NOT change those ceilings.
- Vendored runtime fetch path: the worker fetches only `vision_bundle.mjs`, the `wasm/` fileset (FilesetResolver picks the SIMD pair `vision_wasm_internal.*` at runtime), and `gesture_recognizer.task` (~8 MB). Accepted for offline kiosk reliability.

## File Structure

| File | Create/Modify | Single responsibility |
|---|---|---|
| `public/mediapipe/vision_bundle.mjs` | Create (vendored) | MediaPipe Tasks-Vision ESM bundle, self-hosted |
| `public/mediapipe/wasm/*` | Create (vendored) | WASM fileset `FilesetResolver.forVisionTasks` loads |
| `public/mediapipe/gesture_recognizer.task` | Create (vendored) | Float16 gesture-recognizer model, self-hosted |
| `public/gesture-worker.js` | Modify | Load assets from BASE_PATH-relative local URLs; detailed init/health/error messages; re-create recognizer on numHands change |
| `src/lib/gesture/boxArea.js` | Create | Pure: area of a normalized box `{x,y,width,height}` |
| `src/lib/gesture/selectTriggerHand.js` | Create | Pure: pick the largest-box trigger-gesture hand index |
| `src/lib/gesture/selectPrimaryHand.js` | Create | Pure: pick the largest-box hand index overall (drives sequences/swipe) |
| `src/lib/gesture/shouldReinitNumHands.js` | Create | Pure: decide whether a numHands change requires recognizer re-create |
| `src/hooks/useHandGesture.js` | Modify | Pass BASE_PATH to worker; largest-box trigger + primary; per-hand box data; numHands re-init wiring; health state |
| `src/components/gestures/GestureDebugOverlay.jsx` | Create | Always-on health readout (worker ready, delegate, model, numHands, hand count, error) |
| `src/components/gestures/HandBox.jsx` | Modify | Accept `isPrimary` + `label` to highlight the largest box and show gesture/score |
| `src/components/camera/CameraView.jsx` | Modify | Render boxes always-on (not gated on `debugEnabled`), highlight largest, mount health overlay |
| `src/components/PhotoBooth.jsx` | Modify | Destructure new `gestureHealth` from `useHandGesture`; pass it to `CameraView` |
| `public/sw.js` | Modify | Cache the vendored `/mediapipe/**` assets for offline use |
| `src/__tests__/gesture.test.js` | Create | Unit tests for the four pure helpers |

---

### Task 1: Create the feature branch

**Files:** none (git only).

**Interfaces:** Consumes / Produces: none.

- [ ] **Step 1: Confirm clean tree on main.** Run:
  ```
  git -C /Users/jeffrey/Documents/projects/dac-picture-app status --porcelain && git -C /Users/jeffrey/Documents/projects/dac-picture-app branch --show-current
  ```
  Expected: empty porcelain output, branch `main`.
- [ ] **Step 2: Create + switch to the feature branch.** Run:
  ```
  git -C /Users/jeffrey/Documents/projects/dac-picture-app checkout -b feature/gesture-detection-refactor
  ```
  Expected: `Switched to a new branch 'feature/gesture-detection-refactor'`.
- [ ] **Step 3: Verify branch.** Run `git -C /Users/jeffrey/Documents/projects/dac-picture-app branch --show-current`. Expected: `feature/gesture-detection-refactor`.

---

### Task 2: Vendor + self-host MediaPipe assets, pass BASE_PATH to the worker

**Files:**
- Create `public/mediapipe/vision_bundle.mjs` (copied from `node_modules/@mediapipe/tasks-vision/vision_bundle.mjs`)
- Create `public/mediapipe/wasm/*` (copied from `node_modules/@mediapipe/tasks-vision/wasm/`)
- Create `public/mediapipe/gesture_recognizer.task` (downloaded float16 model)
- Modify `public/gesture-worker.js` (whole file)
- Modify `src/hooks/useHandGesture.js` lines 167-173 (the `init` postMessage)

**Interfaces:**
- Produces (worker init message): `{ type:"init", basePath:string, numHands:number, minHandDetectionConfidence:number, minHandPresenceConfidence:number, minTrackingConfidence:number }`
- Consumes in worker: `initRecognizer(opts)` reads `opts.basePath` to build `${base}/mediapipe/vision_bundle.mjs`, `${base}/mediapipe/wasm`, `${base}/mediapipe/gesture_recognizer.task`.
- Produces (worker `ready` message, enriched): `{ type:"ready", delegate:string, numHands:number, modelUrl:string }`
- Produces (worker `error` message, enriched): `{ type:"error", phase:"init"|"setOptions"|"reinit", message:string }`

- [ ] **Step 1: Copy the ESM bundle + wasm fileset from node_modules into public.** Run:
  ```
  cd /Users/jeffrey/Documents/projects/dac-picture-app && mkdir -p public/mediapipe/wasm && cp node_modules/@mediapipe/tasks-vision/vision_bundle.mjs public/mediapipe/vision_bundle.mjs && cp node_modules/@mediapipe/tasks-vision/wasm/* public/mediapipe/wasm/ && ls -la public/mediapipe public/mediapipe/wasm
  ```
  Expected: `public/mediapipe/vision_bundle.mjs` exists; `public/mediapipe/wasm/` contains `vision_wasm_internal.js`, `vision_wasm_internal.wasm`, `vision_wasm_module_internal.js`, `vision_wasm_module_internal.wasm`, `vision_wasm_nosimd_internal.js`, `vision_wasm_nosimd_internal.wasm`.
- [ ] **Step 2: Download the float16 gesture model into public** (needs network ONCE, at vendor time; at runtime it is served locally). Run:
  ```
  cd /Users/jeffrey/Documents/projects/dac-picture-app && curl -fSL -o public/mediapipe/gesture_recognizer.task "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task" && ls -la public/mediapipe/gesture_recognizer.task
  ```
  Expected: a `gesture_recognizer.task` file roughly 8 MB. If the host is offline, abort and obtain the file from another machine — it MUST be present before proceeding.
- [ ] **Step 3: Rewrite `public/gesture-worker.js` to load local assets from `basePath`.** Replace the ENTIRE file contents with:
  ```js
  // Web Worker for MediaPipe GestureRecognizer inference.
  // Keeps the heavy recognizeForVideo() call off the main thread.

  // MediaPipe's bundler compiled import(url) into self.import(url), which doesn't
  // exist in module workers. The WASM loader scripts need to run in global scope
  // (like importScripts) to set self.ModuleFactory, so we use fetch + eval.
  self.import = async (url) => {
    const res = await fetch(url)
    const text = await res.text()
    ;(0, eval)(text)
  }

  let recognizer = null
  let vision = null
  // Remember the resolved base + options so we can re-create the recognizer
  // (e.g. on a numHands change) without re-fetching the WASM fileset.
  let basePath = ""
  let currentOptions = {}
  let currentDelegate = null

  function modelUrl() {
    return `${basePath}/mediapipe/gesture_recognizer.task`
  }

  async function loadVision() {
    if (vision) return vision
    const { GestureRecognizer, FilesetResolver } = await import(
      `${basePath}/mediapipe/vision_bundle.mjs`
    )
    vision = await FilesetResolver.forVisionTasks(`${basePath}/mediapipe/wasm`)
    self.__GestureRecognizer = GestureRecognizer
    return vision
  }

  async function createRecognizer(opts) {
    const GestureRecognizer = self.__GestureRecognizer
    const v = await loadVision()

    const baseModelOptions = {
      baseOptions: { modelAssetPath: modelUrl(), delegate: "GPU" },
      runningMode: "VIDEO",
      numHands: opts.numHands ?? 6,
      minHandDetectionConfidence: opts.minHandDetectionConfidence ?? 0.5,
      minHandPresenceConfidence: opts.minHandPresenceConfidence ?? 0.5,
      minTrackingConfidence: opts.minTrackingConfidence ?? 0.5,
    }

    try {
      const r = await GestureRecognizer.createFromOptions(v, baseModelOptions)
      currentDelegate = "GPU"
      return r
    } catch (gpuErr) {
      const r = await GestureRecognizer.createFromOptions(v, {
        ...baseModelOptions,
        baseOptions: { ...baseModelOptions.baseOptions, delegate: "CPU" },
      })
      currentDelegate = "CPU"
      return r
    }
  }

  async function initRecognizer(opts = {}) {
    basePath = opts.basePath ?? ""
    currentOptions = {
      numHands: opts.numHands ?? 6,
      minHandDetectionConfidence: opts.minHandDetectionConfidence ?? 0.5,
      minHandPresenceConfidence: opts.minHandPresenceConfidence ?? 0.5,
      minTrackingConfidence: opts.minTrackingConfidence ?? 0.5,
    }
    recognizer = await createRecognizer(currentOptions)
    self.postMessage({
      type: "ready",
      delegate: currentDelegate,
      numHands: currentOptions.numHands,
      modelUrl: modelUrl(),
    })
  }

  self.addEventListener("message", async (e) => {
    const { type } = e.data

    if (type === "init") {
      try {
        await initRecognizer(e.data)
      } catch (err) {
        self.postMessage({
          type: "error",
          phase: "init",
          message: err?.message || "Init crashed",
        })
      }
      return
    }

    if (type === "detect") {
      const { bitmap, timestamp } = e.data
      if (!recognizer) {
        bitmap.close()
        self.postMessage({ type: "result", gestures: [], landmarks: [], timestamp })
        return
      }
      try {
        const result = recognizer.recognizeForVideo(bitmap, timestamp)
        const gestures = (result?.gestures || []).map((hand) =>
          hand.map((g) => ({ categoryName: g.categoryName, score: g.score })),
        )
        const landmarks = (result?.landmarks || []).map((hand) =>
          hand.map((p) => ({ x: p.x, y: p.y, z: p.z })),
        )
        self.postMessage({ type: "result", gestures, landmarks, timestamp })
      } catch {
        // Skip failed frames
      } finally {
        bitmap.close()
      }
      return
    }

    if (type === "setOptions") {
      if (!recognizer) return
      try {
        recognizer.setOptions(e.data.options)
        Object.assign(currentOptions, e.data.options)
      } catch (err) {
        self.postMessage({
          type: "error",
          phase: "setOptions",
          message: err?.message || "setOptions failed",
        })
      }
      return
    }

    if (type === "close") {
      recognizer?.close()
      recognizer = null
      self.close()
    }
  })
  ```
  (The CDN-fetch is replaced; the GPU→CPU delegate-fallback is preserved inside `createRecognizer`. `setOptions` now reports failures via a visible `error` message instead of silently swallowing. Task 7 adds the `reinit` branch that reuses `createRecognizer`/`currentOptions`.)
- [ ] **Step 4: Pass `basePath` in the hook's init message.** In `src/hooks/useHandGesture.js`, `initWorker` currently posts (lines 167-173):
  ```js
      worker.postMessage({
        type: "init",
        numHands: nh,
        minHandDetectionConfidence: mdc,
        minHandPresenceConfidence: mpc,
        minTrackingConfidence: mtc,
      })
  ```
  Replace with (`BASE_PATH` is already defined at line 19):
  ```js
      worker.postMessage({
        type: "init",
        basePath: BASE_PATH,
        numHands: nh,
        minHandDetectionConfidence: mdc,
        minHandPresenceConfidence: mpc,
        minTrackingConfidence: mtc,
      })
  ```
- [ ] **Step 5: Build the static export to confirm assets are copied + nothing breaks.** Run:
  ```
  cd /Users/jeffrey/Documents/projects/dac-picture-app && npm run build && ls -la out/mediapipe out/mediapipe/wasm
  ```
  Expected: build succeeds; `out/mediapipe/vision_bundle.mjs`, `out/mediapipe/gesture_recognizer.task`, and `out/mediapipe/wasm/*` all exist (Next copies `public/` into the export).
- [ ] **Step 6: Stage.** Run:
  ```
  cd /Users/jeffrey/Documents/projects/dac-picture-app && git add public/mediapipe public/gesture-worker.js src/hooks/useHandGesture.js
  ```

---

### Task 3: OFFLINE verification of self-hosted assets (regression proof)

**Files:** none (verification only).

**Interfaces:** Consumes: the static export from Task 2 Step 5.

- [ ] **Step 1: Serve the static export with NO upstream network.** Run a static server over `out/` in the background:
  ```
  cd /Users/jeffrey/Documents/projects/dac-picture-app/out && python3 -m http.server 4599
  ```
  Expected: server listening on `http://localhost:4599`.
- [ ] **Step 2: Confirm the assets are reachable locally (no CDN).** Run:
  ```
  curl -sI http://localhost:4599/mediapipe/vision_bundle.mjs | head -1 && curl -sI http://localhost:4599/mediapipe/gesture_recognizer.task | head -1 && curl -sI http://localhost:4599/mediapipe/wasm/vision_wasm_internal.wasm | head -1
  ```
  Expected: each returns `HTTP/... 200 OK`.
- [ ] **Step 3: Grep the worker to PROVE no CDN host remains.** Run:
  ```
  cd /Users/jeffrey/Documents/projects/dac-picture-app && grep -nE "cdn\.jsdelivr\.net|storage\.googleapis\.com" public/gesture-worker.js || echo "NO CDN REFERENCES — PASS"
  ```
  Expected: `NO CDN REFERENCES — PASS`.
- [ ] **Step 4: Manual booth check (record result inline; do NOT write a report file).** With the device's wifi/network turned OFF, load `http://localhost:4599/` in the browser, enable gestures, and confirm in the console that the worker logs `MediaPipe initialized in worker (GPU)` or `(CPU)` and that hand boxes appear. This is the regression-fix proof: the recognizer reaches `ready` and detects hands with no internet. (The visible health overlay from Tasks 4-5 makes this confirmable without DevTools.)
- [ ] **Step 5: Stop the static server.** Kill the background `http.server` process.

---

### Task 4: Make worker errors visible + expose health state from the hook

**Files:**
- Modify `src/hooks/useHandGesture.js`: state declarations (after line 83), the worker message listener (lines 140-155), the `worker.error` handler (lines 157-159), the result handler (after line 232), and the returned object (line 359).

**Interfaces:**
- Produces (hook return, ADDED to existing object): `gestureHealth: { ready:boolean, delegate:string|null, modelLoaded:boolean, activeNumHands:number|null, handCount:number, error:string|null }`
- Consumes (worker messages): `{type:"ready", delegate, numHands, modelUrl}`, `{type:"error", phase, message}`, `{type:"result", gestures, landmarks, timestamp}`.

- [ ] **Step 1: Add the health state declaration.** In `src/hooks/useHandGesture.js`, after `const pendingResultRef = useRef(null)` (line 83), add:
  ```js
  const [gestureHealth, setGestureHealth] = useState({
    ready: false,
    delegate: null,
    modelLoaded: false,
    activeNumHands: null,
    handCount: 0,
    error: null,
  })
  ```
- [ ] **Step 2: Update the worker message listener to populate health + surface errors.** Replace the listener body (lines 140-155) with:
  ```js
      worker.addEventListener("message", (e) => {
        const { type } = e.data
        if (type === "ready") {
          logger.info("gesture", `MediaPipe initialized in worker (${e.data.delegate})`)
          setGestureHealth((h) => ({
            ...h,
            ready: true,
            delegate: e.data.delegate ?? null,
            modelLoaded: true,
            activeNumHands: e.data.numHands ?? h.activeNumHands,
            error: null,
          }))
          if (gestureLoadingRef.current) {
            gestureLoadingRef.current = false
            setGestureLoading(false)
          }
        } else if (type === "result") {
          pendingResultRef.current = e.data
          busyRef.current = false
        } else if (type === "error") {
          logger.warn("gesture", `Worker error (${e.data.phase}):`, e.data.message)
          setGestureHealth((h) => ({
            ...h,
            ready: e.data.phase === "init" ? false : h.ready,
            error: `${e.data.phase}: ${e.data.message}`,
          }))
          busyRef.current = false
        }
      })
  ```
- [ ] **Step 3: Surface the worker crash event too.** Replace the existing `worker.addEventListener("error", ...)` (lines 157-159) with:
  ```js
      worker.addEventListener("error", (e) => {
        logger.warn("gesture", "Worker crashed:", e.message)
        setGestureHealth((h) => ({ ...h, ready: false, error: `crash: ${e.message}` }))
      })
  ```
- [ ] **Step 4: Update live hand count in the rAF result handler.** In the tick's result block, immediately after `const allLandmarks = result.landmarks || []` (line 232), add:
  ```js
        const liveHandCount = allLandmarks.filter((lm) => lm && lm.length > 0).length
        setGestureHealth((h) => (h.handCount === liveHandCount ? h : { ...h, handCount: liveHandCount }))
  ```
- [ ] **Step 5: Return the health state.** Change the hook's return (line 359) to include `gestureHealth`:
  ```js
    return { activeGesture, handBoxes, gestureBoxes, holdProgressRef, gestureLoading, rawGestureNameRef, primaryHandLandmarksRef, gestureHealth }
  ```
- [ ] **Step 6: Lint.** Run:
  ```
  cd /Users/jeffrey/Documents/projects/dac-picture-app && npx eslint src/hooks/useHandGesture.js
  ```
  Expected: no errors.
- [ ] **Step 7: Stage.** Run:
  ```
  cd /Users/jeffrey/Documents/projects/dac-picture-app && git add src/hooks/useHandGesture.js
  ```

---

### Task 5: Always-on hand + health overlay (component + wiring)

**Files:**
- Create `src/components/gestures/GestureDebugOverlay.jsx`
- Modify `src/components/gestures/HandBox.jsx` (signature lines 11-18; `boxShadow` line 83; add label badge after line 104)
- Modify `src/components/camera/CameraView.jsx` (props line 46; import after line 12; mount overlay after line 96; box blocks lines 113-137)
- Modify `src/components/PhotoBooth.jsx` (destructure lines 369-377; pass prop after line 461)

**Interfaces:**
- Produces: `GestureDebugOverlay({ health })` where `health` is the `gestureHealth` object from Task 4.
- Consumes (HandBox added props): `isPrimary?:boolean`, `label?:string`.
- CameraView reads `box.isPrimary` and `box.label` (both attached to each box in Task 6 inside `useHandGesture`). Until Task 6 lands, those fields are `undefined`, so boxes render with no highlight/label — harmless.

- [ ] **Step 1: Create `src/components/gestures/GestureDebugOverlay.jsx`.** Full file:
  ```jsx
  "use client"

  /**
   * Always-on gesture-system health readout. Doubles as "the booth sees you"
   * feedback and the live diagnostic that localizes worker/model failures.
   * Copy is Dutch, matching the rest of the booth UI.
   */
  export function GestureDebugOverlay({ health }) {
    if (!health) return null
    const { ready, delegate, modelLoaded, activeNumHands, handCount, error } = health

    const statusColor = error ? "#f87171" : ready ? "#4ade80" : "#fbbf24"
    const statusLabel = error ? "Fout" : ready ? "Actief" : "Laden…"

    return (
      <div className="absolute top-3 left-3 z-40 pointer-events-none select-none">
        <div
          className="rounded-xl px-3 py-2 text-[11px] leading-tight font-mono text-white/90 backdrop-blur-md"
          style={{ background: "rgba(0,0,0,0.45)", border: "1px solid rgba(255,255,255,0.12)" }}
        >
          <div className="flex items-center gap-2 mb-1">
            <span style={{ width: 8, height: 8, borderRadius: 9999, background: statusColor }} />
            <span className="font-semibold">Handdetectie: {statusLabel}</span>
          </div>
          <div>Delegate: {delegate ?? "—"}</div>
          <div>Model: {modelLoaded ? "geladen" : "—"}</div>
          <div>Handen (max): {activeNumHands ?? "—"}</div>
          <div>Handen in beeld: {handCount}</div>
          {error && <div style={{ color: "#fca5a5" }}>{error}</div>}
        </div>
      </div>
    )
  }
  ```
- [ ] **Step 2: Add `isPrimary` + `label` to `HandBox.jsx`.** Change the signature (lines 11-18) to:
  ```jsx
  export function HandBox({
    box,
    videoRef,
    containerRef,
    isPrimary = false,
    label = null,
    borderColor = "rgba(230,193,137,0.95)",
    glowColor = "rgba(230,193,137,0.35)",
    outlineColor = "rgba(230,193,137,0.45)",
  }) {
  ```
  Change the box element's inline `boxShadow` (line 83) from the static value to one that thickens for the primary hand:
  ```jsx
            boxShadow: isPrimary
              ? `0 0 36px ${glowColor}, inset 0 0 0 2px ${outlineColor}`
              : `0 0 28px ${glowColor}, inset 0 0 0 1px ${outlineColor}`,
  ```
  Inside the returned JSX, after the fourth bracket `<span>` (after line 104, before the box element's closing `</div>` at line 105), add a label badge:
  ```jsx
          {label && (
            <span
              className="absolute -top-6 left-0 px-2 py-0.5 rounded-md text-[10px] font-mono whitespace-nowrap"
              style={{
                background: isPrimary ? "rgba(56,189,248,0.85)" : "rgba(0,0,0,0.55)",
                color: "#fff",
              }}
            >
              {label}
            </span>
          )}
  ```
- [ ] **Step 3: Make box rendering always-on + highlight primary + mount health overlay in `CameraView.jsx`.** Add `gestureHealth` to the destructured props (after `gestureBoxes,` at line 46):
  ```jsx
    gestureBoxes,
    gestureHealth,
  ```
  Import the overlay after line 12:
  ```jsx
  import { GestureDebugOverlay } from "@/components/gestures/GestureDebugOverlay"
  ```
  Replace the tracking-box block (lines 113-123) so it renders WITHOUT the `debugEnabled` gate (always-on per spec) and passes `isPrimary`/`label`:
  ```jsx
              {/* Always-on hand tracking boxes — hide in strip mode (coords are full-screen) */}
              {!showStripFrame &&
                handBoxes?.map((box) => (
                  <HandBox
                    key={`track-${box.index}`}
                    box={box}
                    videoRef={videoRef}
                    containerRef={containerRef}
                    isPrimary={box.isPrimary === true}
                    label={box.label ?? null}
                  />
                ))}
  ```
  Replace the gesture-box block (lines 124-137) — drop its `debugEnabled` gate, keep the cyan colors, add `isPrimary`/`label`:
  ```jsx
              {!showLayoutSlider &&
                !showStripFrame &&
                gestureBoxes?.map((box) => (
                  <HandBox
                    key={`gesture-${box.index}`}
                    box={box}
                    videoRef={videoRef}
                    containerRef={containerRef}
                    isPrimary={box.isPrimary === true}
                    label={box.label ?? null}
                    borderColor="rgba(56,189,248,0.8)"
                    glowColor="rgba(56,189,248,0.45)"
                    outlineColor="rgba(56,189,248,0.35)"
                  />
                ))}
  ```
  Mount the health overlay inside the `(isReady || isSwitching || isRecalibrating)` block, right after the `<Overlays />` wrapper div closes (after line 96, before the TopNotice comment at line 98):
  ```jsx
              {!showStripFrame && !showLayoutSlider && (
                <GestureDebugOverlay health={gestureHealth} />
              )}
  ```
- [ ] **Step 4: Wire `gestureHealth` through `PhotoBooth.jsx`.** Add `gestureHealth` to the `useHandGesture` destructure (lines 369-377):
  ```jsx
    const {
      activeGesture,
      handBoxes,
      gestureBoxes,
      holdProgressRef,
      gestureLoading,
      rawGestureNameRef,
      primaryHandLandmarksRef,
      gestureHealth,
    } = useHandGesture(
  ```
  Pass it to `CameraView` (after `gestureBoxes={gestureBoxes}` at line 461):
  ```jsx
            gestureBoxes={gestureBoxes}
            gestureHealth={gestureHealth}
  ```
- [ ] **Step 5: Lint the touched files.** Run:
  ```
  cd /Users/jeffrey/Documents/projects/dac-picture-app && npx eslint src/components/gestures/GestureDebugOverlay.jsx src/components/gestures/HandBox.jsx src/components/camera/CameraView.jsx src/components/PhotoBooth.jsx
  ```
  Expected: no errors. If `debugEnabled` (CameraView line 58) is reported unused after dropping the gates, remove its `const debugEnabled = useUiStore((s) => s.debugEnabled)` line and re-run.
- [ ] **Step 6: Build.** Run:
  ```
  cd /Users/jeffrey/Documents/projects/dac-picture-app && npm run build
  ```
  Expected: build succeeds.
- [ ] **Step 7: Stage.** Run:
  ```
  cd /Users/jeffrey/Documents/projects/dac-picture-app && git add src/components/gestures/GestureDebugOverlay.jsx src/components/gestures/HandBox.jsx src/components/camera/CameraView.jsx src/components/PhotoBooth.jsx
  ```

---

### Task 6: Largest-box trigger selection (pure helpers + unit tests + hook wiring)

**Files:**
- Create `src/lib/gesture/boxArea.js`
- Create `src/lib/gesture/selectTriggerHand.js`
- Create `src/lib/gesture/selectPrimaryHand.js`
- Create `src/__tests__/gesture.test.js` (also covers Task 7's `shouldReinitNumHands`)
- Modify `src/hooks/useHandGesture.js` (imports after line 5; result handler lines 234-265)

**Interfaces:**
- Produces `boxArea(box) -> number`: `box.width * box.height`, or `0` if box null / missing numeric dimensions.
- Produces `selectPrimaryHand(boxes) -> number`: `box.index` of the largest-area box; `-1` if none. Ties broken by lowest `box.index`. `boxes` is `Array<{index, x, y, width, height}>`.
- Produces `selectTriggerHand({ gestures, boxes, triggerGestures, minScore }) -> number`: `box.index` of the largest-box hand whose `gestures[box.index]` contains a `triggerGestures` member at/above `minScore`; `-1` if none. Ties broken by lowest `box.index`.
- `gestures` is the worker's per-hand array: `gestures[handIndex]` is `Array<{categoryName, score}>`. `box.index` maps back to the hand's position in `gestures`/`landmarks` (same `box.index` already set at `useHandGesture.js:259`).

- [ ] **Step 1: Write the failing test file.** Create `src/__tests__/gesture.test.js`:
  ```js
  import { describe, it, expect } from "vitest"
  import { boxArea } from "@/lib/gesture/boxArea"
  import { selectTriggerHand } from "@/lib/gesture/selectTriggerHand"
  import { selectPrimaryHand } from "@/lib/gesture/selectPrimaryHand"
  import { shouldReinitNumHands } from "@/lib/gesture/shouldReinitNumHands"

  const box = (index, w, h) => ({ index, x: 0, y: 0, width: w, height: h })
  const TRIGGERS = new Set(["Victory", "ILoveYou", "Deuces"])

  describe("boxArea", () => {
    it("multiplies width by height", () => {
      expect(boxArea({ x: 0, y: 0, width: 0.4, height: 0.5 })).toBeCloseTo(0.2)
    })
    it("returns 0 for null or dimensionless box", () => {
      expect(boxArea(null)).toBe(0)
      expect(boxArea({ x: 0, y: 0 })).toBe(0)
    })
  })

  describe("selectPrimaryHand", () => {
    it("returns -1 for no boxes", () => {
      expect(selectPrimaryHand([])).toBe(-1)
    })
    it("picks the largest-area box index", () => {
      const boxes = [box(0, 0.2, 0.2), box(1, 0.5, 0.5), box(2, 0.3, 0.3)]
      expect(selectPrimaryHand(boxes)).toBe(1)
    })
    it("breaks ties by lowest index", () => {
      const boxes = [box(2, 0.4, 0.4), box(0, 0.4, 0.4)]
      expect(selectPrimaryHand(boxes)).toBe(0)
    })
  })

  describe("selectTriggerHand", () => {
    it("returns -1 when no hand shows a trigger gesture", () => {
      const gestures = [[{ categoryName: "Open_Palm", score: 0.9 }]]
      const boxes = [box(0, 0.5, 0.5)]
      expect(selectTriggerHand({ gestures, boxes, triggerGestures: TRIGGERS, minScore: 0.35 })).toBe(-1)
    })
    it("ignores trigger gestures below minScore", () => {
      const gestures = [[{ categoryName: "Victory", score: 0.2 }]]
      const boxes = [box(0, 0.5, 0.5)]
      expect(selectTriggerHand({ gestures, boxes, triggerGestures: TRIGGERS, minScore: 0.35 })).toBe(-1)
    })
    it("picks the LARGEST-box triggering hand, not the highest score", () => {
      const gestures = [
        [{ categoryName: "Victory", score: 0.95 }],
        [{ categoryName: "Victory", score: 0.5 }],
      ]
      const boxes = [box(0, 0.1, 0.1), box(1, 0.6, 0.6)]
      expect(selectTriggerHand({ gestures, boxes, triggerGestures: TRIGGERS, minScore: 0.35 })).toBe(1)
    })
    it("breaks box-area ties by lowest index", () => {
      const gestures = [
        [{ categoryName: "Victory", score: 0.5 }],
        [{ categoryName: "Deuces", score: 0.5 }],
      ]
      const boxes = [box(0, 0.4, 0.4), box(1, 0.4, 0.4)]
      expect(selectTriggerHand({ gestures, boxes, triggerGestures: TRIGGERS, minScore: 0.35 })).toBe(0)
    })
    it("matches boxes to gestures by box.index, not array position", () => {
      const gestures = [
        [{ categoryName: "Open_Palm", score: 0.9 }],
        [{ categoryName: "Victory", score: 0.6 }],
      ]
      const boxes = [box(1, 0.5, 0.5)]
      expect(selectTriggerHand({ gestures, boxes, triggerGestures: TRIGGERS, minScore: 0.35 })).toBe(1)
    })
  })

  describe("shouldReinitNumHands", () => {
    it("re-inits when the count changes", () => {
      expect(shouldReinitNumHands(2, 6)).toBe(true)
    })
    it("does not re-init when the count is unchanged", () => {
      expect(shouldReinitNumHands(6, 6)).toBe(false)
    })
    it("does not re-init on null/undefined next", () => {
      expect(shouldReinitNumHands(6, null)).toBe(false)
      expect(shouldReinitNumHands(6, undefined)).toBe(false)
    })
    it("re-inits from null current to a real next", () => {
      expect(shouldReinitNumHands(null, 4)).toBe(true)
    })
  })
  ```
- [ ] **Step 2: Run the test — expect FAIL (modules not created yet).** Run:
  ```
  cd /Users/jeffrey/Documents/projects/dac-picture-app && npx vitest run src/__tests__/gesture.test.js
  ```
  Expected: FAIL — module-not-found for `@/lib/gesture/boxArea` (and the others).
- [ ] **Step 3: Implement `boxArea`.** Create `src/lib/gesture/boxArea.js`:
  ```js
  /**
   * Area of a normalized hand bounding box. Returns 0 for a null box or one
   * missing width/height (treated as "no box, cannot win arbitration").
   * @param {{width?:number, height?:number}|null} box
   * @returns {number}
   */
  export function boxArea(box) {
    if (!box || typeof box.width !== "number" || typeof box.height !== "number") return 0
    return box.width * box.height
  }
  ```
- [ ] **Step 4: Implement `selectPrimaryHand`.** Create `src/lib/gesture/selectPrimaryHand.js`:
  ```js
  import { boxArea } from "./boxArea"

  /**
   * Index (box.index) of the largest-area hand box — the "primary" hand that
   * drives sequences/swipe. Ties broken by lowest box.index. -1 if no boxes.
   * @param {Array<{index:number,width:number,height:number}>} boxes
   * @returns {number}
   */
  export function selectPrimaryHand(boxes) {
    if (!boxes || boxes.length === 0) return -1
    let bestIndex = -1
    let bestArea = -1
    for (const b of boxes) {
      const area = boxArea(b)
      if (area > bestArea || (area === bestArea && bestIndex >= 0 && b.index < bestIndex)) {
        bestArea = area
        bestIndex = b.index
      }
    }
    return bestIndex
  }
  ```
- [ ] **Step 5: Implement `selectTriggerHand`.** Create `src/lib/gesture/selectTriggerHand.js`:
  ```js
  import { boxArea } from "./boxArea"

  /**
   * Among hands showing a trigger gesture at/above minScore, return the box.index
   * of the one with the LARGEST box (closest person wins priority). -1 if none.
   * Ties broken by lowest box.index. Boxes are matched to gestures by box.index.
   * @param {{
   *   gestures: Array<Array<{categoryName:string, score:number}>>,
   *   boxes: Array<{index:number,width:number,height:number}>,
   *   triggerGestures: Set<string>,
   *   minScore: number,
   * }} args
   * @returns {number}
   */
  export function selectTriggerHand({ gestures, boxes, triggerGestures, minScore }) {
    if (!boxes || boxes.length === 0) return -1
    let bestIndex = -1
    let bestArea = -1
    for (const b of boxes) {
      const handGestures = gestures?.[b.index] || []
      const triggers = handGestures.some(
        (g) => triggerGestures.has(g.categoryName) && g.score >= minScore,
      )
      if (!triggers) continue
      const area = boxArea(b)
      if (area > bestArea || (area === bestArea && bestIndex >= 0 && b.index < bestIndex)) {
        bestArea = area
        bestIndex = b.index
      }
    }
    return bestIndex
  }
  ```
- [ ] **Step 6: Run the test — three suites PASS, `shouldReinitNumHands` still FAILS.** Run:
  ```
  cd /Users/jeffrey/Documents/projects/dac-picture-app && npx vitest run src/__tests__/gesture.test.js
  ```
  Expected: `boxArea`, `selectPrimaryHand`, `selectTriggerHand` suites PASS; the `shouldReinitNumHands` suite FAILS (module created in Task 7). Acceptable at this checkpoint.
- [ ] **Step 7: Wire the selectors into `useHandGesture.js`.** Add imports after line 5 (`import { logger } from "@/lib/logger"`):
  ```js
  import { selectTriggerHand } from "@/lib/gesture/selectTriggerHand"
  import { selectPrimaryHand } from "@/lib/gesture/selectPrimaryHand"
  ```
  Replace the existing arbitration + boxing block. The current code spans lines 234-265 — from `let triggerHandIndex = -1` through the close of the `allLandmarks.forEach(...)` boxing loop (line 265). Replace those lines with:
  ```js
          const boxes = []
          allLandmarks.forEach((landmarks, idx) => {
            if (!landmarks || landmarks.length === 0) return
            const box = computeBox(landmarks, mirrored)
            if (box) {
              boxes.push({ ...box, index: idx })
              lastSeenRef.current.set(idx, now)
            }
          })

          const effectiveTriggerMin = Math.max(
            CONFIDENCE_THRESHOLD,
            triggerMinScoreRef.current ?? TRIGGER_MIN_SCORE,
          )

          // Largest-box arbitration: the closest person (biggest box) wins.
          const primaryIndex = selectPrimaryHand(boxes)
          let triggerHandIndex = -1
          if (actionsEnabled) {
            triggerHandIndex = selectTriggerHand({
              gestures,
              boxes,
              triggerGestures: TRIGGER_GESTURES,
              minScore: effectiveTriggerMin,
            })
            // Fallback: geometric two-finger Victory on the primary hand if the
            // model did not label a trigger gesture.
            if (triggerHandIndex < 0 && primaryIndex >= 0) {
              const primaryLandmarks = allLandmarks[primaryIndex]
              if (isTwoFingerVictory(primaryLandmarks)) triggerHandIndex = primaryIndex
            }
          }

          // Primary hand (largest box) feeds sequences + swipe, NOT hand[0].
          const primaryGesture = primaryIndex >= 0 ? gestures[primaryIndex]?.[0] : null
          rawGestureNameRef.current = primaryGesture?.categoryName ?? "None"
          primaryHandLandmarksRef.current = primaryIndex >= 0 ? allLandmarks[primaryIndex] ?? null : null

          // Tag boxes for the overlay: primary highlight + gesture/score label.
          boxes.forEach((b) => {
            b.isPrimary = b.index === (triggerHandIndex >= 0 ? triggerHandIndex : primaryIndex)
            const top = gestures[b.index]?.[0]
            b.label = top ? `${top.categoryName} ${(top.score * 100).toFixed(0)}%` : null
          })
  ```
  This deletes the old `let triggerHandIndex = -1; let triggerScore = 0; const boxes = []` declarations (234-236), the old `gestures.forEach(...){ gestureList.forEach(...) }` highest-score scan (240-249), the old `gestures[0]`/`landmarks[0]` "primary" lines (251-253), and the old per-hand boxing loop with its inline geometric-Victory branch (255-265) — all replaced above. Leave the subsequent box-hold / unchanged-diff / `setHandBoxes` / `setGestureBoxes` logic (lines 267-298) intact (it consumes `boxes`).
- [ ] **Step 8: Lint + full suite.** Run:
  ```
  cd /Users/jeffrey/Documents/projects/dac-picture-app && npx eslint src/hooks/useHandGesture.js src/lib/gesture && npx vitest run
  ```
  Expected: lint clean; ALL suites pass EXCEPT `shouldReinitNumHands` (created in Task 7). If that is the only failure, the checkpoint is good.
- [ ] **Step 9: Stage** (test files are gitignored — force-add the test):
  ```
  cd /Users/jeffrey/Documents/projects/dac-picture-app && git add src/lib/gesture src/hooks/useHandGesture.js && git add -f src/__tests__/gesture.test.js
  ```

---

### Task 7: numHands re-init (pure decision helper + worker re-create + hook split effect)

**Files:**
- Create `src/lib/gesture/shouldReinitNumHands.js`
- Modify `public/gesture-worker.js` (add `reinit` message branch before the `close` branch)
- Modify `src/hooks/useHandGesture.js` (import after line 5; add `lastNumHandsRef` after line 83; set it in `initWorker`; replace the options effect lines 181-191)

**Interfaces:**
- Produces `shouldReinitNumHands(current, next) -> boolean`: `true` only when `next` is a finite number that differs from `current`; `false` if `next` is null/undefined or equal.
- Worker accepts `{ type:"reinit", numHands, minHandDetectionConfidence, minHandPresenceConfidence, minTrackingConfidence }` → closes + re-creates the recognizer with the new count, reusing the loaded `vision` fileset, then posts the enriched `ready` message.
- Worker continues to accept `{ type:"setOptions", options }` for confidence thresholds only (no re-create).

- [ ] **Step 1: Implement `shouldReinitNumHands`** (its test was authored in Task 6 Step 1). Create `src/lib/gesture/shouldReinitNumHands.js`:
  ```js
  /**
   * Whether a numHands change requires re-creating the recognizer. MediaPipe
   * does not reliably honor a changed numHands via setOptions on a live VIDEO
   * recognizer, so we re-create instead. Returns true only when next is a finite
   * number that differs from current.
   * @param {number|null|undefined} current
   * @param {number|null|undefined} next
   * @returns {boolean}
   */
  export function shouldReinitNumHands(current, next) {
    if (typeof next !== "number" || !Number.isFinite(next)) return false
    return current !== next
  }
  ```
- [ ] **Step 2: Run the test — the `shouldReinitNumHands` suite (and whole gesture file) is green.** Run:
  ```
  cd /Users/jeffrey/Documents/projects/dac-picture-app && npx vitest run src/__tests__/gesture.test.js
  ```
  Expected: all four suites PASS.
- [ ] **Step 3: Add the `reinit` handler to `public/gesture-worker.js`.** In the message listener, add a new branch immediately BEFORE the `if (type === "close")` branch:
  ```js
    if (type === "reinit") {
      try {
        currentOptions = {
          numHands: e.data.numHands ?? currentOptions.numHands ?? 6,
          minHandDetectionConfidence:
            e.data.minHandDetectionConfidence ?? currentOptions.minHandDetectionConfidence ?? 0.5,
          minHandPresenceConfidence:
            e.data.minHandPresenceConfidence ?? currentOptions.minHandPresenceConfidence ?? 0.5,
          minTrackingConfidence:
            e.data.minTrackingConfidence ?? currentOptions.minTrackingConfidence ?? 0.5,
        }
        const old = recognizer
        recognizer = null
        old?.close()
        recognizer = await createRecognizer(currentOptions)
        self.postMessage({
          type: "ready",
          delegate: currentDelegate,
          numHands: currentOptions.numHands,
          modelUrl: modelUrl(),
        })
      } catch (err) {
        self.postMessage({
          type: "error",
          phase: "reinit",
          message: err?.message || "Re-init failed",
        })
      }
      return
    }
  ```
  (Re-create reuses the cached `vision` fileset inside `createRecognizer` → `loadVision()`, so no WASM re-fetch; offline-safe.)
- [ ] **Step 4: Split the hook's options effect (numHands → reinit, confidences → setOptions).** In `src/hooks/useHandGesture.js`, add the import after the Task 6 imports (after line 5):
  ```js
  import { shouldReinitNumHands } from "@/lib/gesture/shouldReinitNumHands"
  ```
  Declare a ref next to the other refs, after `const pendingResultRef = useRef(null)` (line 83):
  ```js
  const lastNumHandsRef = useRef(null)
  ```
  Inside `initWorker`, immediately after the `worker.postMessage({ type:"init", ... })` call (the one edited in Task 2 Step 4), record the spawned count:
  ```js
      lastNumHandsRef.current = nh
  ```
  Replace the entire existing options effect (lines 181-191) with:
  ```js
    useEffect(() => {
      const worker = workerRef.current
      if (!worker) return
      if (shouldReinitNumHands(lastNumHandsRef.current, numHands)) {
        lastNumHandsRef.current = numHands
        worker.postMessage({
          type: "reinit",
          numHands,
          minHandDetectionConfidence: minDetectionConfidence,
          minHandPresenceConfidence: minPresenceConfidence,
          minTrackingConfidence,
        })
      } else {
        worker.postMessage({
          type: "setOptions",
          options: {
            minHandDetectionConfidence: minDetectionConfidence,
            minHandPresenceConfidence: minPresenceConfidence,
            minTrackingConfidence,
          },
        })
      }
    }, [numHands, minDetectionConfidence, minPresenceConfidence, minTrackingConfidence])
  ```
  (numHands is no longer sent via `setOptions` — only via `reinit`. `gestureHealth.activeNumHands` updates from the fresh `ready` message after re-create, so the overlay reflects the new count.)
- [ ] **Step 5: Lint + full suite.** Run:
  ```
  cd /Users/jeffrey/Documents/projects/dac-picture-app && npx eslint src/hooks/useHandGesture.js src/lib/gesture && npx vitest run
  ```
  Expected: lint clean; ALL test suites pass.
- [ ] **Step 6: Build.** Run:
  ```
  cd /Users/jeffrey/Documents/projects/dac-picture-app && npm run build
  ```
  Expected: build succeeds.
- [ ] **Step 7: Stage.** Run:
  ```
  cd /Users/jeffrey/Documents/projects/dac-picture-app && git add src/lib/gesture/shouldReinitNumHands.js public/gesture-worker.js src/hooks/useHandGesture.js && git add -f src/__tests__/gesture.test.js
  ```

---

### Task 8: Cache vendored assets in the service worker (offline PWA)

**Files:**
- Modify `public/sw.js` (the `fetch` handler's MediaPipe cache-first rule, lines 88-105)

**Interfaces:** Consumes: `/mediapipe/**` local URLs served from the static export.

- [ ] **Step 1: Replace the CDN cache-first condition with a local `/mediapipe/` condition.** In `public/sw.js`, the current block opens (lines 88-89) keyed on `cdn.jsdelivr.net` / `storage.googleapis.com`. Replace just that condition:
  ```js
    // Cache-first for self-hosted MediaPipe WASM/model/bundle (immutable)
    if (url.pathname.includes("/mediapipe/")) {
  ```
  Leave the block body (the `getCacheName().then(... caches.match ... fetch ... cache.put ...)` logic, lines 90-104) unchanged — it is cache-first-then-network-and-store, exactly what the local assets need for offline reuse.
- [ ] **Step 2: Confirm the worker script is still served fresh.** The existing skip at line 84 (`url.pathname.endsWith("/gesture-worker.js")`) must stay. Run:
  ```
  cd /Users/jeffrey/Documents/projects/dac-picture-app && grep -n "gesture-worker.js\|/mediapipe/\|cdn.jsdelivr.net\|storage.googleapis.com" public/sw.js
  ```
  Expected: the `gesture-worker.js` skip present; the new `/mediapipe/` cache rule present; no `cdn.jsdelivr.net` / `storage.googleapis.com` reference remaining.
- [ ] **Step 3: Build + verify the SW and assets land in the export.** Run:
  ```
  cd /Users/jeffrey/Documents/projects/dac-picture-app && npm run build && grep -n "/mediapipe/" out/sw.js && ls out/mediapipe/wasm
  ```
  Expected: build succeeds; `out/sw.js` contains the `/mediapipe/` rule; `out/mediapipe/wasm` lists the wasm files.
- [ ] **Step 4: Stage.** Run:
  ```
  cd /Users/jeffrey/Documents/projects/dac-picture-app && git add public/sw.js
  ```

---

### Task 9: Manual screenshot verification (largest-box-wins, low-power profile)

**Files:** none (verification only — do NOT write a report file; record findings inline in the hand-off message).

**Interfaces:** Consumes: the running app + the always-on overlay (Task 5) + largest-box logic (Task 6) + numHands re-init (Task 7).

- [ ] **Step 1: Run the app** (use the `run` skill or `npm run dev`). Open the booth in a browser with camera access. Confirm the camera feed appears and `GestureDebugOverlay` shows `Handdetectie: Actief`, a delegate (GPU/CPU), `Model: geladen`, and `Handen (max)` equal to the configured `numHands` (default 8). Screenshot.
- [ ] **Step 2: Single hand — capture triggers from the gesturing hand.** Hold a Victory gesture; confirm its box is highlighted primary (thicker ring + cyan label), the hold animation runs, and capture fires after the hold duration. Screenshot.
- [ ] **Step 3: Two hands — largest box wins (C1).** One hand close (large box), one far (small box), both Victory. Confirm the CLOSE hand's box is highlighted primary and drives the capture hold (not the far/small hand, not an arbitrary hand[0]). Screenshot.
- [ ] **Step 4: numHands re-init at runtime (C2).** Via Settings → Advanced tab (or /admin), change the hand count (e.g. 8 → 2). Confirm the overlay's `Handen (max)` updates to the new value (worker posts a fresh `ready`) and only two boxes ever appear. Screenshot.
- [ ] **Step 5: Low-power / Pi-bounded profile.** Apply the low-power preset (`applyLowPowerPreset` → `numHands: 2`, `detectionIntervalMs: 400`). Confirm gestures still detect, the overlay shows `Handen (max): 2`, and frame rate stays usable. Screenshot. Confirms the count stays bounded by the low-power profile.
- [ ] **Step 6: Error visibility smoke test (C3).** Temporarily rename `public/mediapipe/gesture_recognizer.task` and reload; confirm the overlay shows `Handdetectie: Fout` with an `init:` message instead of silently dying. Restore the file afterward. Screenshot.
- [ ] **Step 7: Record results inline** in the final hand-off message to the user (NOT a written .md file). If any step fails, stop and debug before declaring the plan complete.
- [ ] **Step 8: Final stage check** (no code changes expected here). Run:
  ```
  cd /Users/jeffrey/Documents/projects/dac-picture-app && git status
  ```
  Expected: only the intended files staged across Tasks 2-8; working tree otherwise clean. Hand off to the user to commit (do NOT commit).