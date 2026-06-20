# Chrome Redesign — "Refined Midnight + Gold"

**Date:** 2026-06-20
**Status:** Approved (direction), ready for implementation plan
**Scope owner:** Jeffrey Ullers
**Branch:** `redesign/refined-midnight-gold`

## Context

`dac-photobooth-app` is a kiosk PWA for the Dutch Anime Community, run at anime/comic
conventions. It is guest-facing (visitors walk up to a tablet/screen), touch-first, and
also supports MediaPipe hand-gesture control. The official brand color is gold `#e6c189`;
the mascot is "Amelia". Stack: Next.js 16, React 19, Tailwind CSS v4, Zustand.

A design audit across all seven UI subsystems found the current chrome reads as
generic AI-scaffolded dark-mode SaaS. The root cause is **structural, not taste**:

- **No design tokens.** Magic values everywhere — radii (`rounded-lg/xl/2xl/[2rem]/[22px]`),
  type (`text-[0.7rem]`, `[0.65rem]`, `[6rem]`), tracking (`[0.24em]`, `[0.16em]`), spacing
  (`px-3/5/6`, `gap-2/2.5/3`), ad-hoc rgba colors.
- **No brand presence.** Gold appears only in scrollbars + the PWA banner. Everything else
  is monochrome white-on-black glassmorphism (`bg-white/[0.04] border-white/10 backdrop-blur-xl`).
- **No hierarchy.** Primary and secondary controls are visually identical. Accent colors
  (sky-400 focus, violet strip-mode, red delete, emerald success, amber queue) are ad-hoc
  and semantically meaningless.
- **Geist font** — the literal Next.js starter default; the single biggest "scaffolded" tell.
- **Code rot in the styling layer.** `SettingsDrawer.jsx` is a 581-line monolith;
  `drawerStyles.js` exports 9 near-identical card variants; three separate spinner
  implementations; the layout-preview `Block` component is duplicated 3×; analytics is
  duplicated between drawer and full page.
- **Kiosk-UX gaps.** Touch targets too small (`w-10 h-10` = 40px), low-contrast text at
  distance/glare, a weak text-only attract loop, broken gesture onboarding (hint only appears
  from step 2, emoji-only, no intro).

## Goals

1. Replace the ad-hoc styling with **one coherent design system** (tokens + a thin primitive
   layer) so the look is intentional and centrally adjustable.
2. Make the **DAC gold the true primary** and give the UI a clear visual hierarchy and a
   warm, premium "festival-at-night" identity — the "Refined Midnight + Gold" direction.
3. Clean up the styling-layer code: remove duplication, kill magic values, break up the
   `SettingsDrawer` monolith.
4. Improve kiosk/touch/gesture UX: larger targets, higher contrast, a stronger capture
   moment and attract loop, fixed gesture onboarding.
5. Keep the booth shippable throughout — work behind a branch, surface-by-surface, no big-bang.

## Non-goals (explicitly out of scope)

- **The rendered/composited photo is untouched.** `Overlays.jsx`, `StripFrameOverlay.jsx`,
  everything in `src/lib/canvas/`, and the overlay **positioning** config in
  `src/lib/config/presets.js` stay exactly as-is. (User confirmed positions are good and the
  photo look & feel is out of scope for this pass.)
- No new features, no behavior changes to capture/upload/gesture logic, no copy rewrite
  beyond what the redesigned components naturally touch.
- No analytics data-model changes (visual cleanup of the dashboard only, if time permits).

## Visual direction — "Refined Midnight + Gold"

Thesis: **the gold is the light.** A photobooth is about light, lens, and the shutter
moment, so gold is treated as the light source — a soft gold spotlight behind the capture
button and the attract moment — while everything else stays quiet and disciplined. The dark
base is kept so the photo remains the star and to reduce glare in a dark hall.

### Color tokens

| Token | Hex | Role |
|---|---|---|
| `--color-ground` | `#0C0B10` | app background (warm near-black) |
| `--color-surface` | `#16141C` | cards, control buttons |
| `--color-raised` | `#201D29` | raised surfaces, drawers |
| `--color-hairline` | `rgba(245,241,232,.09)` | default border |
| `--color-hairline-strong` | `rgba(245,241,232,.16)` | emphasized border |
| `--color-text` | `#F5F1E8` | primary text (porcelain) |
| `--color-text-muted` | `#A39C92` | secondary text |
| `--color-text-dim` | `#6E685F` | tertiary/labels |
| `--color-gold` | `#E6C189` | **primary accent** (brand) |
| `--color-gold-strong` | `#F2D6A4` | hover / highlight |
| `--color-gold-deep` | `#B8945A` | pressed / gradient end |
| `--color-success` | `#7FC8A0` | uploaded |
| `--color-warning` | `#E3A75C` | queued |
| `--color-danger` | `#E8836C` | offline / error / destructive |

Semantic colors are muted so gold stays the star. The sky-400 focus ring is replaced by a
gold focus ring. Ad-hoc violet/emerald/sky/red usages are mapped onto the semantic tokens.

### Typography

- **Display:** Space Grotesk (characterful, premium). Self-hosted via `next/font/google`
  so it works offline in the PWA. Swappable (Sora / Cabinet Grotesk / Bricolage) — colors
  and proportions are fixed, font is the one remaining open knob.
- **Body / UI:** Inter, self-hosted via `next/font/google`. Legible at distance for kiosk.
- **Type scale** (size / line-height): display 96–72, title 28, body-L 18, body 15,
  label 11 (uppercase, `.2em` tracking). Replaces all `text-[…]`/`tracking-[…]` magic values.
- Geist is removed.

### Shape, depth, motion

- **Radius scale:** `--radius-xs 8` · `sm 12` · `md 16` · `lg 24` · `pill 999`. Replaces the
  `lg/xl/2xl/[2rem]/[22px]` chaos.
- **Spacing scale:** 4px base — 4/8/12/16/24/32/48/64.
- **Depth:** three explicit elevation levels (flat / raised / overlay) using warm surfaces +
  hairline + soft shadow. `backdrop-blur` reserved for genuine overlays (drawer scrim), not
  every card.
- **Motion:** durations 120/200/320ms, one standard easing `cubic-bezier(.2,.8,.2,1)`,
  `prefers-reduced-motion` respected. One orchestrated moment: the gold capture-button
  spotlight "breathe". Remove scattered/mechanical staggered delays.

## Architecture — tokens + thin primitives

Two-layer approach (clean code, minimal new abstraction):

1. **Token layer** — Tailwind v4 `@theme` in `globals.css` defines all color/radius/spacing/
   font/motion tokens as CSS custom properties + Tailwind utilities. Optionally a small
   `src/lib/styles/tokens.js` for values needed in JS (canvas, inline). The existing scattered
   token files (`drawerStyles.js`, `buttons.js`, `animations.js`) are replaced/consolidated.

2. **Primitive layer** — a small set of reusable components under `src/components/ui/`, each
   with a clear API and variants, replacing the duplicated class strings:
   - `Button` — variants `primary` (gold) / `secondary` / `ghost` / `danger`; sizes; disabled.
   - `IconButton` — kiosk-sized (≥48px), `active` state (gold).
   - `Card` / `Surface` — one component with `compact`/`raised` modifiers (collapses the 9
     `drawerStyles` variants).
   - `Drawer` (refactor of `BottomDrawer`) + `Sheet` header/section/handle subparts.
   - `Switch` (gold-on toggle), `SegmentedControl` (Basis/Geavanceerd tabs).
   - `StatusPill` — semantic `ok`/`queued`/`offline`.
   - `Spinner` — single shared implementation (replaces the 3 copies).
   - `SectionLabel` / type helpers.

Components keep using Tailwind classes that reference the tokens, so there's no heavy
CSS-in-JS layer — just tokens + composable primitives.

### Per-surface changes (chrome only)

| Surface | Files | Change |
|---|---|---|
| App shell / fonts | `layout.jsx`, `globals.css` | Swap Geist → Space Grotesk + Inter; install token layer; gold focus ring; warm ground. |
| Capture button | `camera/CaptureButton.jsx` | Gold hero button + breathing spotlight; clear primary affordance; reduced-motion safe. |
| Control bar | `camera/ControlBar.jsx`, `ui/ControlBarItem.jsx` | Larger touch targets (≥48px), gold `active` state, use `IconButton`. |
| Camera overlays | `camera/StatusOverlay/AttractOverlay/SplashOverlay/OfflineBadge/CameraIssueOverlay` | Stronger attract loop (wave + gesture hint), unified status language, consistent gold. |
| Capture FX | `capture/Countdown.jsx`, `capture/FlashEffect.jsx` | Gold-glow countdown; keep flash behavior, tighten styling. |
| Drawers | `ui/BottomDrawer.jsx`, `ui/FullScreenOverlay.jsx`, `drawers/*`, `ui/drawerStyles.js` | Rebuild on `Drawer`/`Card`; gold active toggles; consistent spacing/radii. |
| Settings | `drawers/SettingsDrawer.jsx` | Break the 581-line monolith into focused parts (panel, basic/advanced tabs, preset grid, range control); extract preset data. |
| Pickers | `pickers/LayoutPicker/LayoutSlider/MascotPicker/PickerDrawer.jsx` | Gold selected-state, larger previews, dedupe the `Block` component, unify selection feedback. |
| Gallery / upload / loaders | `gallery/Gallery.jsx`, `ui/UploadStatus.jsx`, `ui/AppLoader.jsx`, `ui/Spinner.jsx` | `StatusPill` + shared `Spinner`; stronger empty state; brandable loading. |
| Gestures | `gestures/GestureIndicator/GestureSequenceHint/HandBox.jsx` | Gold "now"-state, hint visible from step 1, tokenized positioning. |
| Onboarding | `DeviceSetupGate.jsx`, `pwa/InstallBanner.jsx` | Balanced choice cards, gold recommended option. |
| Analytics (operator) | `drawers/AnalyticsDashboard.jsx`, `app/analytics/page.jsx` | Visual cleanup + dedupe shared card/stat components (lower priority; operator-facing). |

## Accessibility & kiosk

- Min touch target 48px for interactive controls.
- Gold focus-visible ring with a subtle glow; keyboard-operable.
- Contrast: primary text and key labels readable at ~1–2m and under glare; avoid relying on
  very low white-opacity text for meaningful content.
- `prefers-reduced-motion` disables the spotlight breathe and non-essential motion.
- ARIA labels preserved/added on icon-only controls.

## Risks & constraints

- **Live event (DCC 2026, today).** Work on the branch; do not merge to `main` until verified.
  Surface-by-surface so partial progress never breaks the booth.
- **Offline PWA.** Fonts must be self-hosted (`next/font` self-hosts at build) — no runtime
  CDN. No external assets that break offline.
- **Don't touch the photo pipeline.** Keep `lib/canvas`, `Overlays`, `presets` positioning
  intact; verify rendered photos are byte-for-byte unaffected.
- Existing tests (Vitest) and lint must stay green.

## Success criteria

- A single token layer; zero `text-[…]`/`tracking-[…]`/`rounded-[…px]` magic values remaining
  in chrome components (verified by grep).
- Gold is the primary accent across chrome; one clear primary action per screen.
- `SettingsDrawer.jsx` and `drawerStyles.js` no longer monolithic/duplicated; one `Spinner`;
  one `Block` preview component.
- `npm run lint` and `npm test` pass; `npm run build` succeeds.
- The rendered photo output is unchanged.
- Visual result matches the approved direction board.
