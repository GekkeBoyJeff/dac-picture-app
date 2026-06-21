# Design — Attract screen & post-capture send animation refactor

**Date:** 2026-06-21
**Status:** Approved (design), pending spec review
**Author:** brainstorming session

## Goal

Two user-facing problems, treated as a fundamental refactor (not an add-on):

1. **Attract / idle screen** is hard to read and too dark. The full-screen dark
   scrim dims the live camera so people can't see themselves, and the
   instruction text reads as black/muddy because its contrast depends on a
   drop-shadow over the video. Replace the centered-text-over-scrim approach
   with a **speech bubble next to a bottom-right mascot**, no full-screen
   dimming, legible on **every screen size**, with **touch-aware copy** (drop
   the "wave with your hand" wording on touchscreen devices).

2. **After capture there is no feedback worth the name.** The photo send is
   fire-and-forget into a tiny corner pill. Add a **smooth, high-quality
   animation that actually shows the photo being sent to Discord**, followed by
   a **hint that the user can join the Discord server to download their photo
   there**.

The Discord webhook send is **kept exactly as-is** (per user: "dat de foto naar
discord word gestuurd is al goed zo, dat wil ik laten"). No backend changes, no
per-photo download link — the photo lands in the shared Discord channel and the
join hint points users there.

## Decisions (locked during brainstorming)

- **Mascot on attract screen:** fixed `public/overlays/mascots/amelia-smile.webp`
  (not the `👋` emoji, not the dynamically-configured mascot).
- **Join-hint QR:** reuse the existing `public/overlays/qr-discord.svg`
  (the same Discord invite QR already printed on photo strips). No new invite
  URL, no live `qrcode` rendering.
- **Send mechanism:** unchanged Discord webhook (`sendToDiscord.js` +
  `sendQueue.js`).
- **Post-capture structure:** one new `result` app state owned by a single
  self-contained `PhotoResultOverlay` component with an internal phase machine,
  driven by the real send result (Approach A below).

## Current-state baseline (what exists today)

Stack: Next.js 16 / React 19 static-export PWA, plain JS+JSX, **Tailwind v4
CSS-first** (`@theme` in `src/app/globals.css`, no `tailwind.config.js`),
Zustand stores, **zero animation libraries** (deliberate). All UI copy is
hardcoded Dutch. `src/components/PhotoBooth.jsx` is the single orchestrator.

- **Attract overlay:** `src/components/camera/AttractOverlay.jsx` (38 lines) — a
  `<div>` layered over the live `<video>`. Dimming = inline
  `rgba(12,11,16,0.35)` scrim at `AttractOverlay.jsx:16-19`. Headline
  `"Kom op de foto!"` (`:28`, `text-ink`), subtitle
  `"Tik op het scherm of zwaai met je hand"` (`:34`, `text-ink-muted`). Mascot =
  literal `👋` emoji (`:21-26`, `animate-wave`). Centered via
  `flex flex-col items-center justify-end pb-[24%]`. Mounted at
  `CameraView.jsx:188` as `<AttractOverlay visible={showAttract && isReady} />`.
  Visibility from `useIdleTimer(60_000)` in `PhotoBooth.jsx:63`;
  `showAttract = isIdle && (!handBoxes || handBoxes.length === 0)`
  (`PhotoBooth.jsx:465`). **No touch detection anywhere in the codebase.**
- **State machine:** single string `appState` in `src/stores/uiStore.js`
  (setter `setAppState`). Values today: `camera → countdown → capturing →
  camera`. No `captured`/`preview`/`sending`/`result` state.
  > NOTE for implementation: confirm whether `appState` is included in the
  > persisted slice of `uiStore` (the two exploration passes disagreed). The new
  > transient state/fields MUST NOT persist — verify and, if needed, exclude
  > them from `partialize` and/or reset to `camera` on rehydrate.
- **Capture:** `doCapture` (`PhotoBooth.jsx:305-329`) →
  `captureOnePhoto` → `compositePhoto(...)` → returns `{ exportBlob }`. Then
  **immediately** `setAppState("camera")` and fire-and-forget
  `sendAndTrack(blob)` (`PhotoBooth.jsx:322`). The blob is never parked as a
  "current photo." Strip mode: `handleStripComplete`
  (`PhotoBooth.jsx:194-207`) → `sendAndTrack(blob, { isStrip: true })`.
- **Send:** `sendAndTrack(blob, { isStrip })` (`PhotoBooth.jsx:154-191`):
  `await addPhoto(blob)` (gallery/IndexedDB), create an `UploadStatus` entry,
  `result = await sendOrQueue(blob)`, update status + analytics
  (`discord_sent` / `discord_queued` / `discord_failed`). `sendOrQueue`
  (`src/lib/discord/sendQueue.js`) sends via webhook if online, else enqueues to
  IndexedDB; drains on `online` event with retry/backoff. Webhook in
  `src/lib/discord/sendToDiscord.js`.
- **Current feedback:** small stacked `UploadStatus` pills
  (`src/components/ui/UploadStatus.jsx`, `fixed bottom-5 right-5`,
  uploading/success/queued/error, auto-dismiss). Plus a permanent non-clickable
  top banner `TopNotice.jsx` ("Download je foto direct in onze Discord!").
- **Assets/config:** mascots `public/overlays/mascots/amelia-*.webp`;
  `public/overlays/qr-discord.svg` (invite QR, currently only composited into
  strips via `stripBranding.js`). `DISCORD_MESSAGE` in `config/index.js:85`
  references channel `<#684064008827174930>`. Dead i18n keys `capture_sending`
  ("Sending to Discord…") and `toast_photo_sent` exist but are unreferenced.
- **Animation conventions:** (1) `@theme --animate-*` tokens + `@keyframes` in
  `globals.css` (preferred); (2) inline `style` animation/transition + JS
  `setTimeout(ANIM_MS)` for enter/exit (canonical: `ui/BottomDrawer.jsx`);
  (3) staggered delays via `src/lib/styles/animations.js`. Rich-composition
  reference: `gestures/GestureCaptureHint.jsx`. A global
  `@media (prefers-reduced-motion: reduce)` rule near-zeroes all animation —
  sequencing MUST be driven by JS timers, not `animationend`, so reduced motion
  cannot stall the flow.

## Approach (post-capture structure)

**Chosen — Approach A:** one new `result` app state + a single self-contained
`PhotoResultOverlay` with an internal phase machine
(`reveal → sending → outcome → joinHint → dismiss`), driven by the real send
result. One owner of the animation timeline; `PhotoBooth` only flips into/out of
`result` and hands over the blob + the send.

Rejected alternatives:
- **B — multiple app states (`sending`, `joinHint`) orchestrated by
  `PhotoBooth.jsx`:** spreads animation timing across the already-large
  orchestrator → timing races, harder to keep smooth.
- **C — keep fire-and-forget, animation as pure decoration:** would show
  "Verzonden ✓" even when the send is queued/failed. Dishonest; rejected.

## Section 1 — Attract screen refactor (`AttractOverlay.jsx`, rewrite)

- **Remove the full-screen scrim.** No `rgba(12,11,16,0.35)` layer; the live
  preview stays bright. Legibility comes from the bubble's own opaque/contrasting
  background, not a drop-shadow over video.
- **Bottom-right cluster:** `amelia-smile.webp` anchored bottom-right; a speech
  bubble floats at her upper-left with a tail pointing toward her head. Sizes use
  `clamp()` for fluid scaling rather than breakpoint steps.
- **Responsive behavior (must be verified on every screen size):**
  - Landscape / wide viewports: bubble sits to the **left** of the mascot (row).
  - Portrait / narrow viewports: bubble stacks **above** the mascot (column) so
    it never clips off-screen.
  - Cluster width capped (`max-w-[min(90vw, …)]`); mascot height `clamp()`-ed
    (≈22vh small → ≈38vh large); cluster kept clear of the bottom-center
    `CaptureButton` (rendered `<1200px`) so they never overlap.
- **Touch-aware copy** via a new SSR-safe `useIsTouch()` hook
  (`matchMedia("(pointer: coarse)")` ∥ `(hover: none)` ∥
  `navigator.maxTouchPoints > 0`; defaults `false` during SSR/first render,
  resolves on mount, updates on `matchMedia` change):
  - Touch → **"Tik op het scherm"**
  - Non-touch → **"Zwaai met je hand of tik op het scherm"**
  - Headline **"Kom op de foto!"** unchanged.
- **Motion:** mascot gentle idle bob; bubble pops/fades in. New `@keyframes` +
  `--animate-*` tokens in `globals.css`; retire `hand-wave` if the emoji is
  fully removed (keep `attract-fade-up` if still used). Respect
  `prefers-reduced-motion`.
- **Unchanged:** the visibility logic (`showAttract`, idle timer, hand-detection
  dismissal) and the decoupling from capture triggers. Only the mount prop shape
  may change at `CameraView.jsx:188` if needed.

## Section 2 — Send animation (`PhotoResultOverlay`, new)

A full-screen overlay shown while `appState === "result"`. Single smooth,
CSS-driven timeline using existing conventions (no animation lib). Phases:

1. **Reveal (~0.4s):** flash clears; the just-captured photo settles in center,
   scaling up softly like a print dropping onto a surface.
2. **Sending (min ~1.6s, or until the webhook resolves — whichever is longer):**
   the photo tilts and glides along a smooth bezier (`--ease-standard`) toward a
   Discord mark that rises into frame, trailing soft motion-blur/sparkle; below
   it, "Versturen naar Discord…" with animated dots. If the real send is still
   pending past the minimum, the Discord mark pulses gently (no early cut, no
   premature success).
3. **Outcome frame (~0.6s) — driven by the real `sendOrQueue` result:**
   - **success** → mark "catches" the photo, tasteful gold ripple/confetti,
     "Verzonden! ✓"
   - **queued / offline** → photo settles into a tray: "Wordt verzonden zodra je
     weer online bent" (honest; the queue will drain it)
   - **error** → "Versturen lukte even niet — we proberen het automatisch
     opnieuw" (honest; the queue retries)

Blob lifecycle: the captured blob is parked as an object URL in the store for
the overlay to display, and **revoked on dismiss** to avoid leaks. The same
overlay handles single-photo and strip captures.

The dead i18n keys `capture_sending` / `toast_photo_sent` are NOT
required — copy stays inline Dutch consistent with the rest of the app.

## Section 3 — Join-Discord-to-download hint (phase 2 of the overlay)

Entered automatically after the outcome frame:
- the photo shrinks to a corner thumbnail;
- `qr-discord.svg` scales into center with **"Word lid van DAC en download je
  foto in Discord"** + community branding;
- a countdown ring auto-returns to idle/`camera` after ~8–10s, and a tap
  dismisses immediately — the kiosk resets itself unattended (no dead-end).

`TopNotice.jsx` stays as-is (now reinforced by the explicit per-photo step
rather than being the only mention).

## Section 4 — State & files

**`src/stores/uiStore.js`**
- Add `result` to the `appState` machine.
- Add transient fields: `capturedPhoto` (`{ url, isStrip }` or `null`) + setter.
- Ensure `result` + `capturedPhoto` are **not persisted** and reset to `camera`
  on rehydrate (verify the persist `partialize`).

**`src/components/PhotoBooth.jsx`**
- `doCapture` (`:305-329`) and `handleStripComplete` (`:194-207`): instead of
  `setAppState("camera")` + fire-and-forget, set `capturedPhoto` (object URL),
  `setAppState("result")`, and start the send so the overlay can reflect its
  outcome. Keep `addPhoto` (gallery) behaviour.
- Render `<PhotoResultOverlay />` when `appState === "result"`.

**New files**
- `src/components/capture/PhotoResultOverlay.jsx` (+ small sub-views if it grows
  large — keep each focused).
- `src/hooks/useIsTouch.js`.

**Rewrite**
- `src/components/camera/AttractOverlay.jsx`.

**`src/app/globals.css`**
- New `@keyframes` + `--animate-*` tokens: bubble entrance, mascot bob,
  send-fly, gold ripple/confetti, QR entrance, countdown ring.

**`src/lib/config/index.js`**
- Join-hint copy (community + invite line). Reuse `QR_CODE`/`qr-discord.svg`.

**`UploadStatus.jsx`**
- Keep for **background** queue-drain events only (e.g. offline photos sending
  later). No double-feedback during the `result` overlay.

## Error handling

- Send outcome (success/queued/error) is read from the existing `sendOrQueue`
  result and analytics events — the overlay's outcome frame mirrors it honestly.
- Offline at capture time → "queued" outcome + join hint still shown (photo will
  arrive once online).
- `prefers-reduced-motion` → all phases still occur and the flow still completes;
  only the decorative motion is reduced. Sequencing uses JS timers so zeroed CSS
  durations cannot stall it.
- Object URLs revoked on overlay dismiss.

## Testing & verification

- **Unit:** `useIsTouch` (matchMedia branches, SSR default); `PhotoResultOverlay`
  phase machine incl. queued/error branches and auto-dismiss timer.
- **Manual (screenshot-verified, per repo convention):**
  - Attract layout across **portrait/landscape × small/large** — bubble never
    clips, mascot never overlaps the capture button, text legible without the
    scrim.
  - Full capture → reveal → sending → outcome → join-hint → idle sequence for
    single and strip, including an offline/queued run.
- **Tooling note:** repo tests run under Vitest; respect existing config
  (jsdom-for-DOM tests) and lint conventions.

## Out of scope

- Per-photo download links / Supabase storage (explicitly not wanted).
- Changing the Discord send mechanism.
- A new invite URL or live-rendered QR.
- Wiring the full `t()` i18n system (copy stays inline Dutch, matching current
  code).

## Non-negotiables / repo conventions

- No animation library; extend `globals.css` `@theme` + `@keyframes`, compose
  with `cn()`, use the inline-`style` + `setTimeout(ANIM_MS)` exit pattern.
- Respect the global `prefers-reduced-motion` rule.
- **Do not auto-commit** — stage changes and hand off to the user
  (per user preference).
