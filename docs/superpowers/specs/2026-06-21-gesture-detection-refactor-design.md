# Design — Hand-gesture detection refactor (reliability, multi-person, largest-box priority, always-on debug)

**Date:** 2026-06-21
**Status:** Approved (design), pending spec review
**Author:** systematic-debugging + brainstorming session

## Goal

Three reported problems with the gesture-driven photo booth, treated as a
fundamental refactor:

1. **Regression** — "handgebaren werken niet meer allemaal" (the gestures don't
   all work anymore).
2. **Multi-person** — "zorg ervoor dat iedereen z'n gebaren worden gemeten"
   (everyone's gestures should be measured/detected, not just one person).
3. **Recognition + priority** — "hij begrijpt handgebaren vaak niet" and the
   hand with the **largest bounding box** (the person closest to the camera)
   must have **priority** to trigger; plus a **debug mode that is always on**
   showing the boxes.

## Decisions (locked during investigation + clarification)

- **Multi-person semantics:** *measure everyone independently, largest box
  triggers.* Detect / box / recognize **every** hand in frame (stop collapsing
  to MediaPipe's arbitrary `gestures[0]`), but because the booth has one camera
  and takes **one photo at a time**, the single global action (capture / menu /
  swipe) is driven by the **largest-bounding-box hand** (closest person). NOT a
  parallel per-person state-machine architecture (explicitly rejected as
  overkill for one camera).
- **Offline robustness:** the booth runs on variable / sometimes-offline venue
  wifi, so **self-host the MediaPipe assets** (ESM bundle + WASM fileset +
  `.task` model) instead of fetching them from CDNs at runtime.
- **Always-on hand overlay:** keep the per-hand bounding-box visualization
  always visible (it doubles as "the booth sees you" feedback *and* the live
  diagnostic), enriched with the gesture label/score/box-size and a
  gesture-system health indicator. (Open review point: exact level of
  guest-facing detail vs an admin/diagnostic-only detailed mode — see Open
  questions.)
- **numHands:** make the configured hand count actually take effect at runtime
  (today it silently doesn't).

## Root-cause status (Phase 1 complete)

Pipeline: `useHandGesture.js` runs a `requestAnimationFrame` loop
(`:218-343`) → `createImageBitmap(video)` → posts frames (transferable) to a
Web Worker `public/gesture-worker.js`, gated by a `busyRef` single-in-flight
guard + optional `detectionIntervalMs` throttle (`:327-337`). The worker runs
MediaPipe Tasks-Vision **`GestureRecognizer`** v0.10.33 (CDN-loaded,
`gesture-worker.js:16-26`), `runningMode:"VIDEO"`, GPU delegate w/ CPU fallback
(`:36-49`), `numHands` (`:30`). Results (`gestures`+`landmarks` per hand) return
to the hook, which boxes every hand (`:255-265`), selects a single trigger hand
by **highest gesture score** (`:240-249`), and a Victory hold timer
(`:301-322`) fires `onVictory` → `PhotoBooth.jsx:348-354` → `appState` countdown.

**Confirmed from code:**

- **C1 — Wrong hand wins.** Trigger selection compares `g.score > triggerScore`
  (`useHandGesture.js:243`), and the "primary" hand feeding sequences/swipe is
  MediaPipe's arbitrary `gestures[0]` / `allLandmarks[0]`
  (`useHandGesture.js:251-253`). A distant or spurious hand can hijack the booth
  over the person standing in front. Boxes are already computed
  (`computeBox`, `:21-44`; per-hand at `:255-265`) — so largest-box selection is
  cheap and local. This is the direct fix for problem 3's "priority."
- **C2 — `numHands` never re-applies at runtime.** The hook posts `setOptions`
  on every count change (`useHandGesture.js:181-191`); the worker calls
  `recognizer.setOptions(...)` inside a `catch {}` that silently swallows
  failures (`gesture-worker.js:88-95`). MediaPipe does not reliably honor a
  changed `numHands` on a live recognizer, so the effective count is **frozen at
  spawn time**. Low-power / Raspberry-Pi presets spawn at `numHands: 2`
  (`uiStore.js:95`), which silently kills multi-hand scenarios and blocks the
  multi-person goal.
- **C3 — Failures are invisible.** Worker/model errors are only `logger.warn`
  (`useHandGesture.js:152,158`; worker posts `{type:"error"}` `:47,59`) — no
  on-screen signal. This is *why* the operator can't tell what broke.

**Prime regression suspect (architectural fragility):**

- **C4 — Runtime CDN dependency.** The worker fetches the MediaPipe ESM bundle
  + WASM from `cdn.jsdelivr.net` and the model from `storage.googleapis.com` on
  every launch (`gesture-worker.js:16-26`), via a hand-rolled
  `self.import = fetch + eval` shim (`:7-11`). On variable/offline venue wifi
  (confirmed by the user), any network hiccup, CSP block, or stale GitHub-Pages
  `NEXT_PUBLIC_BASE_PATH` makes the worker throw and gestures silently die —
  matching "werken niet meer allemaal." A bundled `import` was the *previous*
  implementation before the worker rewrite (commit `e811e02`, Mar 29).

**Evidence gap (honest):** which of C2/C4 (or a `NEXT_PUBLIC_BASE_PATH`/404
issue) is THE live regression cannot be proven from the source alone — it needs
runtime evidence from the actual booth. **The always-on health overlay (below)
is the instrument that settles it**, and C1–C4 are all worth fixing on their own
merits. PR #4 (remote-control/Supabase) is **ruled out** — empty diff against
all gesture files.

## Approach

Four coordinated changes. Order matters: **C4 (self-host) and C3 (visibility)
first**, because together they likely fix the regression *and* give us the live
evidence; then C1 (largest-box) and the per-hand measurement; then C2.

### Section 1 — Self-host MediaPipe assets (C4, regression)

- Vendor the three runtime dependencies into the app's static assets
  (`public/`): the `@mediapipe/tasks-vision@0.10.33` `vision_bundle.mjs`, the
  WASM fileset (the `wasm/` directory `FilesetResolver.forVisionTasks` needs),
  and `gesture_recognizer.task` (float16).
- Change `gesture-worker.js:16-26` to load all three from
  **`BASE_PATH`-relative local paths** (e.g. `${base}/mediapipe/vision_bundle.mjs`,
  `${base}/mediapipe/wasm`, `${base}/mediapipe/gesture_recognizer.task`) instead
  of CDN URLs. The worker must resolve `BASE_PATH` correctly (it has no access to
  `process.env`; pass it in the `init` message from the hook, which already knows
  `BASE_PATH`).
- Verify the `self.import = fetch+eval` shim still works against local URLs
  (it should — same fetch path).
- Tradeoff: adds the model (~8 MB) + WASM to the bundle/static export. Accepted
  for offline reliability on a kiosk. Confirm the service worker / PWA cache
  includes them so they survive offline.

### Section 2 — Always-on hand + health overlay (C3, problem 3 "debug mode")

- Keep the per-hand bounding boxes always rendered (today via
  `CameraView.jsx:116,127` from `handBoxes`); **highlight the largest box** as
  the active/priority hand.
- Enrich each box with its recognized gesture label + score + box-size
  (debug detail), and add a small **gesture-system health indicator**: worker
  ready? delegate (GPU/CPU)? model loaded? active `numHands`? hands-detected
  count? detection rate. Surface worker/model **errors visibly** instead of
  only `logger.warn` — this is the diagnostic that localizes C2 vs C4 on the
  live booth.
- This overlay is the instrument required by systematic-debugging to confirm the
  regression in production.

### Section 3 — Largest-box priority + per-hand measurement (C1, problems 2 & 3)

- **Measure all hands independently:** stop using `gestures[0]`/`landmarks[0]`
  as "primary" (`useHandGesture.js:251-253`). Recognize each hand's gesture
  independently and expose per-hand data (gesture, score, box) for the overlay.
- **Largest-box arbitration:** replace the highest-*score* trigger selection
  (`:240-249`) with: among hands showing a valid trigger gesture above
  threshold, pick the one with the **largest box area**; that hand drives the
  capture hold. The "primary" hand feeding `useGestureSequence`
  (`useGestureSequence.js:37` reads `rawGestureNameRef`) and `useGestureSwipe`
  (`useGestureSwipe.js:30,46` reads `rawGestureNameRef` + `primaryHandLandmarksRef`)
  becomes the **largest-box hand**, not hand[0].
- Single global action preserved (one capture/menu/swipe at a time) — the
  largest box simply wins. No parallel state machines.

### Section 4 — Make `numHands` actually apply (C2)

- Because runtime `setOptions({numHands})` is unreliable and silently caught,
  **re-create the recognizer in the worker when `numHands` changes** (tear down
  + `createFromOptions` with the new count), rather than relying on `setOptions`.
  Keep `setOptions` for the confidence thresholds if it works for those; verify.
- After self-hosting (Section 1), re-verify whether `setOptions(numHands)` is
  honored at all in v0.10.33; prefer the explicit re-create regardless
  (defense-in-depth — don't depend on a silently-caught path).
- Keep the count tied to device-capability/power presets (`uiStore.js:95,107`,
  `settingsPresets.js`, `deviceCapability.js:118`) — raising hands on a Pi must
  stay bounded by the low-power profile to avoid frame-rate collapse. The
  selectable ceiling lives in two places that must stay in sync:
  `settingsPresets.js:66` and `protocol.js:51` (enforced `:75-76`).

## Files touched

- `public/gesture-worker.js` — local asset URLs (C4); receive `BASE_PATH` via
  `init`; per-hand result shape if needed; re-create on `numHands` change (C2);
  surface init/runtime errors with detail (C3).
- `public/mediapipe/**` (new) — vendored `vision_bundle.mjs`, `wasm/`,
  `gesture_recognizer.task`.
- `src/hooks/useHandGesture.js` — largest-box trigger selection (replace
  `:240-249`); largest-box "primary" for sequences/swipe (replace `:251-253`);
  per-hand data exposure; pass `BASE_PATH` to worker init; numHands re-init
  wiring (`:181-191`); expose health/state for the overlay.
- `src/components/camera/CameraView.jsx` — enriched/always-on box rendering
  (`:116,127`) + highlight largest box.
- **New** debug/health overlay component (likely `src/components/camera/` or a
  `GestureDebugOverlay.jsx`) + wiring in `PhotoBooth.jsx`.
- `src/hooks/useGestureSequence.js` / `src/hooks/useGestureSwipe.js` — consume
  the largest-box hand instead of hand[0] (via the refs the hook exposes).
- `src/stores/uiStore.js`, `src/lib/config/settingsPresets.js`,
  `src/lib/remote/protocol.js`, `src/lib/deviceCapability.js` — only if the
  hand-count ceiling/defaults need adjustment (keep the two option sets in sync).
- PWA/service-worker config — ensure vendored MediaPipe assets are cached for
  offline use.

## Error handling

- Worker init failure (model/WASM/bundle) → visible health state (not just a
  warn), with delegate-fallback (GPU→CPU) preserved.
- Offline → because assets are self-hosted, the recognizer still initializes;
  the overlay confirms "model loaded" without network.
- No hands / low confidence → overlay shows zero hands; no spurious triggers.

## Testing & verification

- **Unit:** largest-box selection (given N hands with boxes+gestures, the
  largest-box trigger hand wins; ties handled deterministically); numHands
  re-init logic; box-area computation.
- **Offline test:** load the booth with the network disabled (after
  self-hosting) and confirm the worker reaches `ready` and detects hands — this
  is the regression-fix proof.
- **Manual (screenshot-verified):** always-on overlay shows all hands + health;
  largest box highlighted/wins when two hands gesture; capture triggers from the
  closest hand. Test on a low-power profile too (Pi/`numHands` bounded).
- **Live diagnostic:** the health overlay on the actual booth confirms whether
  the original regression was C4 (now fixed) or something else.

## Open questions for spec review

- **Debug overlay detail level:** "debug mode die altijd aan staat" — should the
  *enriched* detail (gesture labels, scores, box sizes, health readout) be
  visible to **guests at all times**, or should guests see only the clean
  bounding-box highlight while the full diagnostic detail sits behind an
  admin/long-press toggle (still effectively always available)? Default
  assumption: always-on boxes + largest-box highlight for guests; full
  diagnostic detail available but visually restrained. Confirm at review.

## Out of scope

- Parallel/simultaneous multi-person capture (explicitly rejected).
- Changing the gesture set or the hold-duration UX.
- Per-hand identity tracking across frames beyond what largest-box arbitration
  needs.

## Non-negotiables / repo conventions

- Keep detection in the worker; respect the `busyRef` single-in-flight guard and
  `detectionIntervalMs` throttle; keep hand-count tied to device-capability
  presets.
- No new heavy dependencies; vendoring MediaPipe assets is asset-hosting, not a
  new npm runtime lib.
- **Do not auto-commit** — stage changes and hand off to the user.

## Relationship to the other spec

This is independent of
`2026-06-21-attract-and-send-animation-refactor-design.md` (attract screen +
send animation + Discord-join hint). They touch different subsystems and can be
implemented as separate plans, though both are part of the same "make the booth
fundamentally solid" effort.
