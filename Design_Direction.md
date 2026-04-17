# Design Direction --- DAC Fotobooth

> Authored: 2026-04-08
> Target: Anime convention photo booth PWA (kiosk-first, mobile-secondary)

---

## 1. Visual Direction: "Tokyo Game Center After Dark"

Not glassmorphism. Not gradient blobs. Not "clean minimal with an accent color."

The direction is **Japanese game center at 11pm** --- the atmosphere of a Shibuya purikura floor crossed with a high-end camera interface. Dark, warm, deliberate. The kind of place where the lights are low, the screens glow, and every surface has intention.

### Why this works for DAC Fotobooth

- **Camera-first**: The viewfinder IS the app 90% of the time. A dark UI vanishes behind the camera feed --- this is functional, not aesthetic posturing.
- **Convention context**: Anime conventions are sensory-rich environments. The UI needs to hold its own against cosplay, merch walls, and LED-lit booths without competing with them. It should feel like it *belongs* in that world.
- **Purikura lineage**: Japanese photo booths (purikura) pioneered the idea that the *process* of taking a photo should feel like an event. DAC Fotobooth inherits this. The UI should make the 3-second countdown feel theatrical.
- **Kiosk reality**: People approach in dim lighting, often wearing cosplay gloves or carrying bags. The interface needs to read from 1.5 meters away and work with imprecise touch.

### What this is NOT

- Not cyberpunk/neon overload. The gold accent is warm, not electric.
- Not a gaming dashboard. No hexagonal borders, no "HUD" elements, no scan-line overlays.
- Not skeuomorphic. No fake leather, no simulated metal bezels.
- Not the same dark mode every AI tool produces: near-black background, one blue accent, generic sans-serif, rounded cards with `bg-white/5`.

### The feel, specifically

Warm charcoal surfaces that absorb light. Gold that catches it. Typography with weight and presence. Controls that feel physical --- like arcade buttons, not web buttons. Transitions that are swift but never frantic. The confidence of a machine that knows what it does.

---

## 2. Color System

Built on OKLCH for perceptual uniformity. Every neutral carries a trace of warmth so the palette reads as intentional, never as default dark mode.

### Core Palette

```css
:root {
  /* --- Surfaces --- */
  --surface-void:      oklch(6% 0.005 70);     /* #0e0d0c — deepest black, warm */
  --surface-base:      oklch(11% 0.008 70);    /* #1a1816 — primary background */
  --surface-raised:    oklch(15% 0.01 70);     /* #252220 — cards, drawers */
  --surface-elevated:  oklch(19% 0.012 70);    /* #312d2a — hover states, popups */
  --surface-overlay:   oklch(8% 0.005 70 / 0.92); /* drawer/modal backdrop */

  /* --- Gold Accent System --- */
  --accent-gold:       oklch(82% 0.12 80);     /* #e6c189 — primary gold */
  --accent-gold-muted: oklch(72% 0.08 80);     /* softer gold for borders */
  --accent-gold-dim:   oklch(55% 0.06 80);     /* disabled gold, subtle lines */
  --accent-gold-glow:  oklch(85% 0.14 80 / 0.15); /* box-shadow halo */

  /* --- Text --- */
  --text-primary:      oklch(95% 0.005 70);    /* #f2f0ed — warm white */
  --text-secondary:    oklch(70% 0.01 70);     /* #a39e98 — descriptions */
  --text-tertiary:     oklch(50% 0.01 70);     /* #6b6560 — labels, hints */
  --text-on-gold:      oklch(15% 0.03 70);     /* dark text on gold surfaces */

  /* --- Semantic --- */
  --status-success:    oklch(72% 0.18 155);    /* warm emerald */
  --status-warning:    oklch(78% 0.16 85);     /* amber, close to gold family */
  --status-error:      oklch(65% 0.22 25);     /* warm red, not neon */
  --status-info:       oklch(72% 0.12 250);    /* steel blue */

  /* --- Strip Mode --- */
  --mode-strip:        oklch(70% 0.18 290);    /* violet for strip mode toggle */

  /* --- Camera Overlay --- */
  --camera-scrim:      oklch(6% 0.005 70 / 0.35); /* attract screen overlay */
  --camera-control-bg: oklch(11% 0.008 70 / 0.65); /* control pill backgrounds */
}
```

### Why warm neutrals, not pure gray

Pure gray (`oklch(15% 0 0)`) reads as "no opinion." By seeding every neutral with a hue of 70 (warm amber territory) and minimal chroma, the entire surface stack subtly echoes the gold accent. This is what makes Linear, Raycast, and Vercel feel premium --- their grays are *tinted*, never flat.

### Why not more colors

The viewfinder is already full of color --- whatever the camera sees. The UI overlay must be chromatically restrained so it never fights the live feed. Gold is the only accent that appears in controls and branding. Semantic colors (success/warning/error) appear exclusively in status indicators. Strip mode violet is the sole feature color and only surfaces when strip mode is active.

---

## 3. Typography

### Font Stack

**Display / Headings: Space Grotesk**
- Variable weight (300--700)
- Distinctive geometric letterforms with a slightly technical edge
- The squared-off 'G' and open 'a' give it personality without being novelty
- Reads well at large sizes on kiosk displays
- Communicates "deliberate technology" rather than "generic SaaS"

**Body / UI: DM Sans**
- Variable weight (400--700)
- Optical size axis for better rendering at small sizes
- Slightly warmer and rounder than Inter, avoiding the "every AI project" look
- Pairs naturally with Space Grotesk (geometric family, different personality)
- Excellent legibility on both kiosk (distance viewing) and mobile (small screens)

**Monospace / Technical: Geist Mono** (already loaded)
- Countdown numbers, queue counts, technical readouts
- Retain for continuity with existing codebase

### Type Scale

Built with `clamp()` for fluid scaling between mobile (320px) and kiosk (1080px+).

```css
:root {
  /* --- Countdown (the hero moment) --- */
  --text-countdown:   clamp(5rem, 4rem + 8vw, 12rem);

  /* --- Display --- */
  --text-display:     clamp(2rem, 1.5rem + 3vw, 4rem);

  /* --- Headings --- */
  --text-heading:     clamp(1.25rem, 1rem + 1.5vw, 2rem);
  --text-subheading:  clamp(1rem, 0.875rem + 0.75vw, 1.5rem);

  /* --- Body --- */
  --text-body:        clamp(0.875rem, 0.8rem + 0.4vw, 1.125rem);
  --text-caption:     clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem);
  --text-micro:       clamp(0.625rem, 0.6rem + 0.15vw, 0.75rem);

  /* --- Section Labels (drawer headers, settings) --- */
  --text-label:       clamp(0.625rem, 0.6rem + 0.15vw, 0.75rem);
}
```

### Hierarchy Rules

1. **Countdown numbers**: Space Grotesk, weight 700, `--text-countdown`. This is the theatrical moment. Make it enormous and confident.
2. **Attract screen CTA**: Space Grotesk, weight 600, `--text-display`. Must be readable from 2 meters.
3. **Drawer titles**: Space Grotesk, weight 600, `--text-heading`.
4. **Setting labels**: DM Sans, weight 500, `--text-label`, `letter-spacing: 0.2em`, `text-transform: uppercase`. The existing tracking-wide uppercase pattern is good --- keep it.
5. **Body text**: DM Sans, weight 400, `--text-body`.
6. **Status pills / badges**: DM Sans, weight 600, `--text-micro`.
7. **Countdown / queue counts**: Geist Mono, weight 500, tabular figures.

---

## 4. Component Patterns

### Buttons: Arcade-Physical, Not Web-Flat

The current `BUTTON_STYLES.icon` is too generic: `bg-white/10 border-white/20`. Every dark-mode UI has this exact button.

**Primary action (capture button)**:
- Double-ring design: outer translucent ring + inner solid fill
- The outer ring breathes with `shutter-pulse` --- existing animation is good, keep it
- On press: `scale(0.92)` + slight brightness increase (not just scale, add a flash of gold in the ring)
- Strip mode: violet inner fill, existing pattern is solid

**Control bar icons**:
- Background: `--surface-raised` with 65% opacity, not `bg-white/10`
- Border: 1px `--accent-gold-dim` at 25% opacity (warm, not white)
- Hover: border brightens to `--accent-gold-muted`, background shifts to `--surface-elevated`
- Active/pressed: `scale(0.95)` + border pulses gold briefly
- Size: minimum `3rem x 3rem` (48px) with `0.5rem` padding between --- kiosk accessible

**Drawer action buttons**:
- Filled: `--accent-gold` background, `--text-on-gold` text. No gradient.
- Ghost: transparent background, gold border, gold text
- Hover on filled: lighten 5% (bump L channel in OKLCH)
- Hover on ghost: fill with `--accent-gold-glow`

### Cards: Layered, Not Flat

Replace the current `bg-white/[0.04] border-white/10` pattern --- it reads as "no design decision."

**Standard card (settings rows, gallery items)**:
- Background: `--surface-raised`
- Border: 1px solid at `oklch(22% 0.01 70)`
- Top inset highlight: `box-shadow: inset 0 1px 0 oklch(100% 0 0 / 0.04)` (keep existing pattern, it's good)
- Bottom: `box-shadow: 0 1px 3px oklch(0% 0 0 / 0.3)`
- This creates a subtle but real sense of physical layering

**Active/selected card**:
- Border shifts to `--accent-gold-muted` at 45% opacity
- Faint gold glow: `box-shadow: 0 0 0 1px var(--accent-gold-glow)`
- Background stays the same --- the border change alone signals selection

**Toggle rows (settings)**:
- The existing `ToggleRow` pattern with color-coded tones is well-designed
- Swap the multi-color tones (sky, emerald, violet, amber) for a simpler system: gold for "on", neutral for "off"
- Exception: strip mode stays violet (feature identity)
- The status dot + "Aan/Uit" pill pattern is clear --- keep it, but style the pill with the gold system

### Drawers: Surfaces That Emerge

The current `BottomDrawer` shell (`bg-black/[0.92] backdrop-blur-xl rounded-t-4xl`) is decent but needs refinement.

- Background: `--surface-overlay` (warm-tinted, not pure black)
- The `rounded-t-4xl` (2rem) is generous --- pull back to `rounded-t-2xl` (1rem) for a tighter, more precise feel
- Handle bar: gold tinted at low opacity (`--accent-gold-dim` at 30%) instead of `bg-white/25`
- Header divider: `--accent-gold-dim` at 15% instead of `border-white/10`
- Backdrop: keep `bg-black/55 backdrop-blur-[2px]` --- light blur is correct for camera context (heavy blur obscures the viewfinder, which is disorienting)

### Overlays: Theatrical, Not Utilitarian

**Countdown overlay**:
- The number is the star. Space Grotesk 700, `--text-countdown`, `--text-primary`.
- Each number enters with `scale(0.5) -> scale(1.1) -> scale(1)` (existing `countdown` keyframe is perfect).
- Add a subtle gold ring pulse behind the number: a circle that expands and fades with each count.
- Background: no scrim. The number floats directly over the viewfinder with a heavy `text-shadow` for legibility.

**Flash effect**:
- Keep the existing pure white flash. It's correct --- simulates a real camera flash.
- Duration: 400ms is fine. The `ease-out` curve makes it feel like a real strobe decay.

**Attract screen**:
- Current design is too minimal. "Kom op de foto!" floating on a 30% black scrim is forgettable.
- Redesign: animated mascot or event branding at center, CTA text below with a gentle `translateY` bob animation.
- The camera feed MUST remain visible through the scrim --- people need to see themselves to be drawn in. Keep scrim at 30-40% max.
- Add a subtle animated border or corner accents in gold that frame the viewfinder, giving the attract state a "photo frame" feel.
- Pulsing "Touch to start" / "Tik om te beginnen" in gold, not white.

---

## 5. Animation Philosophy

### What Moves and Why

| Element | Animation | Reason |
|---------|-----------|--------|
| Countdown numbers | `scale` + `opacity` | Theatrical emphasis, the core UX moment |
| Flash | `opacity` | Simulates real camera strobe |
| Drawer enter/exit | `translateY` + `opacity` | Spatial metaphor (rises from below) |
| Button press | `scale(0.95)` | Physical feedback, arcade feel |
| Button hover | `border-color` transition | Discovery, not distraction |
| Card selection | `box-shadow` transition | Subtle state change |
| Attract CTA | `translateY` bob (looping) | Draws attention without aggression |
| Attract gold frame | `opacity` pulse (looping) | Ambient presence |
| Upload status | `opacity` + `translateY` | Appears/disappears without jarring |
| Gallery thumbnail enter | `scale(1.05) -> scale(1)` + `opacity` | The existing `strip-photo-land` pattern |
| Shutter button pulse | `box-shadow` expansion | Idle affordance, "I'm ready" |

### What Does NOT Move

- **Viewfinder feed**: Never. No filters, no AR overlays on the live feed itself.
- **Control bar icons at rest**: Static. Movement would compete with the camera feed.
- **Settings controls**: No entrance animations in drawers. Content appears instantly when the drawer finishes sliding.
- **Typography**: No animated text reveals inside settings or galleries. Reserve motion for the camera experience.

### Technical Constraints

All animations use **compositor-friendly properties only**:
- `transform` (translate, scale, rotate)
- `opacity`
- `box-shadow` (paint, but acceptable for non-continuous animations)
- `filter` (sparingly, only for blur on backdrop)

Never animate:
- `width`, `height`, `padding`, `margin` (layout thrash)
- `border-width` (layout)
- `background-color` on large surfaces (paint across entire area)
- `clip-path` with complex shapes on Raspberry Pi (GPU-limited)

### Duration Scale

```css
:root {
  --duration-instant:  100ms;   /* button press feedback */
  --duration-fast:     150ms;   /* hover states, border transitions */
  --duration-normal:   250ms;   /* drawer slide, overlays */
  --duration-slow:     400ms;   /* flash decay, countdown number entry */
  --duration-attract:  800ms;   /* attract screen entrance */

  --ease-out-expo:     cubic-bezier(0.16, 1, 0.3, 1);     /* snappy deceleration */
  --ease-out-quad:     cubic-bezier(0.25, 0.46, 0.45, 0.94); /* gentle settle */
  --ease-in-out-sine:  cubic-bezier(0.37, 0, 0.63, 1);    /* breathing/looping */
}
```

### Reduced Motion

When `prefers-reduced-motion: reduce`:
- All `transform` animations become instant (duration: 0)
- Opacity fades remain but at `--duration-fast` (accessibility: state changes must still be perceivable)
- Looping animations (shutter pulse, attract bob) stop completely
- Countdown numbers still appear, but without scale --- just opacity

---

## 6. Dark Mode Rationale

This is not "we added a dark mode." The app IS dark. The reasoning:

### Functional Necessity

1. **Camera viewfinder**: A bright UI flanking a camera feed creates contrast fatigue and makes the viewfinder harder to read. Dark UI = the feed is the brightest thing on screen. This is how every professional camera app works (Halide, ProCamera, Blackmagic Camera).
2. **Convention environment**: Anime convention halls are dimly lit. A bright kiosk screen would be blinding and create screen glare visible in photos.
3. **Kiosk screen longevity**: OLED kiosk screens benefit from dark UI. For LCD kiosks, dark UI reduces the backlight's contribution to ambient glare.

### Making It Intentional, Not Default

The trap of dark mode: `background: #0a0a0a; color: #fafafa; accent: #3b82f6`. This is what 90% of dark UIs look like.

**What makes DAC Fotobooth's dark mode intentional:**

1. **Warm-tinted neutrals**: Every surface carries hue 70 (amber family). Blacks feel like charcoal, not void. This is the single biggest differentiator from default dark mode.
2. **Gold accent, not blue**: Blue is the default "safe" accent. Gold is opinionated. It connects to anime convention culture (ornate, gilded, ceremonial) and creates warmth against the dark surfaces.
3. **Surface hierarchy through lightness steps**: Four distinct surface levels (`void -> base -> raised -> elevated`) create depth. Most dark UIs use two levels at best (background + card).
4. **Selective luminosity**: The capture button is the brightest element on screen. Gold accents glow against dark surfaces. The UI has a clear light hierarchy rather than uniform dimness.
5. **The scrim is the lightest touch**: Camera overlays use `--camera-scrim` at 35% opacity --- barely there. The UI gets out of the camera's way instead of asserting itself over it.

---

## 7. Accessibility

### Touch Targets for Kiosk Reality

WCAG 2.5.8 requires 24x24px minimum (Level AA). That is far too small for a convention kiosk.

**DAC Fotobooth targets:**

| Element | Minimum Size | Reasoning |
|---------|-------------|-----------|
| Capture button | `5rem x 5rem` (80px) | Primary action, must be hittable with cosplay gloves, from arm's reach |
| Control bar icons | `3rem x 3rem` (48px) | Secondary actions, still needs glove-friendly targets |
| Drawer buttons/rows | `3rem` height minimum | Full-width rows are already touch-friendly by width |
| Gallery thumbnails | `4rem x 4rem` minimum | Needs to be tappable, not just viewable |
| Spacing between controls | `0.5rem` (8px) minimum | Prevents accidental adjacent taps |

### Contrast Ratios

With the OKLCH palette, contrast ratios are predictable by lightness delta:

| Combination | L delta | Approx ratio | WCAG |
|-------------|---------|---------------|------|
| `--text-primary` on `--surface-base` | 84% | ~15:1 | AAA |
| `--text-secondary` on `--surface-base` | 59% | ~7:1 | AA (normal), AAA (large) |
| `--text-tertiary` on `--surface-base` | 39% | ~4:1 | AA (large only) |
| `--accent-gold` on `--surface-base` | 71% | ~10:1 | AAA |
| `--text-on-gold` on `--accent-gold` | 67% | ~9:1 | AAA |

`--text-tertiary` is reserved for non-essential labels and hints only --- never for actionable or informational text.

### Keyboard and Focus

- Focus ring: 2px solid `--status-info` (steel blue), offset 2px. The existing `focus-visible` styles are correct --- keep the blue ring, it needs to be distinct from the gold accent to be visible.
- All interactive elements reachable via Tab.
- Escape closes any open drawer or overlay (already implemented).
- Countdown can be cancelled via capture button (already implemented).

### Screen Reader

- `aria-label` on all icon-only buttons (already implemented in ControlBar).
- `aria-modal="true"` on drawers (already implemented).
- `aria-pressed` on toggle buttons (already implemented in ToggleRow).
- Live region for upload status changes (`aria-live="polite"`).
- Live region for countdown numbers (`aria-live="assertive"`).

---

## 8. Design References

Real products and sites that embody aspects of the target direction.

### Camera / Viewfinder UI

- **Halide Camera (iOS)** --- Best-in-class dark camera interface. Controls float over the viewfinder without competing. The capture button has physicality. Gold/amber accent for manual focus. The app proves that camera UI should be dark, warm, and minimal.
- **Blackmagic Camera (iOS)** --- Professional video camera UI. Dark surfaces with warm orange/amber accents. Information density done right. Proves that dark + warm accent works for camera contexts.

### Dark Luxury / Gold Accent

- **Linear (linear.app)** --- Near-black surfaces with tinted neutrals. Every gray carries the brand temperature. Proves that dark mode feels premium when neutrals aren't pure gray. Their 2025 redesign stripped back to near-monochrome, which is instructive --- confidence in restraint.
- **Raycast (raycast.com)** --- Dark interface with a single bold accent. Clean but not sterile. Their command palette UI is relevant for overlay/drawer interaction patterns. Noisy texture overlays in 2025 added physicality without skeuomorphism.
- **Vercel Dashboard** --- Dark surfaces that feel layered, not flat. Their card system uses subtle elevation through shadow rather than border, creating depth.

### Arcade / Convention Atmosphere

- **Japanese purikura machines (modern)** --- The workflow is the reference: selection screen -> countdown -> flash -> edit -> print. The screens use dark backgrounds with bright, warm accents. Interface elements are LARGE (designed for groups of teenagers). The frame/border decoration tradition is directly applicable to the attract screen and strip frame design.
- **Teenage Engineering OP-1 Field** --- Hardware product, but the screen UI is instructive. Uses a constrained color palette on dark backgrounds with deliberate, characterful typography. Every pixel feels considered. The antithesis of "generated."

### Anti-Template References

- **Stripe.com** --- Bespoke serif for headlines paired with clean sans for body. Typography as brand differentiator. Proves that font choice is the fastest way to escape generic UI.
- **Figma (editor interface)** --- Dark mode that uses warm grays, not cool. Their surface hierarchy (canvas -> panel -> overlay) maps directly to our viewfinder -> drawer -> modal stack.

### What NOT to reference

- Any Dribbble shot with "dark mode dashboard" in the title
- Shadcn/ui default dark theme without modification
- Any UI that uses Inter + blue accent + pure #0a0a0a background
- iOS Control Center clones (rounded rectangles on blurred background)

---

## 9. Anti-Patterns: Things That Will Make This Look Like AI Slop

### Explicitly Banned

1. **Gradient blob backgrounds**: No `radial-gradient` decorative elements behind content. The camera feed IS the background.

2. **`bg-white/5` as the only surface color**: The current codebase uses this everywhere (`drawerCardClass`, `inactiveStyles`, `drawerSoftPillClass`). It reads as "I didn't choose a color." Replace with the named surface tokens.

3. **`border-white/10` as the universal border**: Same problem. Every card, every drawer, every pill uses this identical border. Replace with surface-aware borders that shift with elevation.

4. **The Inter/Geist-only font stack**: Geist Sans is good, but it's the default Next.js font. Every AI-generated Next.js app ships with it. Adding Space Grotesk for display and DM Sans for body creates immediate visual distinction.

5. **Uniform border-radius everywhere**: The current codebase uses `rounded-xl`, `rounded-2xl`, `rounded-full`, `rounded-4xl` somewhat arbitrarily. Define a strict radius scale: `0.25rem` (tight, badges) / `0.5rem` (standard, cards) / `0.75rem` (drawers) / `50%` (circular, capture button only).

6. **Blue as accent color**: `accent-sky-400` appears in range controls, toggle rows, stat pills, and focus rings. The app's accent is gold. Use gold for all interactive accents. Reserve blue strictly for focus rings (accessibility) and info-status indicators.

7. **Backdrop blur on everything**: `backdrop-blur-xl` / `backdrop-blur-sm` on every surface. Blur is expensive (especially on Raspberry Pi). Use it only on the drawer backdrop scrim and the camera control pill backgrounds. Cards and buttons should use opaque `--surface-raised`, not transparent + blur.

8. **Arbitrary Tailwind values without tokens**: `text-[0.65rem]`, `bg-white/[0.04]`, `tracking-[0.24em]`, `shadow-[0_0_0_1px_...]`. These scattered magic values create inconsistency. Extract to CSS custom properties and reference them.

9. **Equal spacing everywhere**: `gap-2` or `gap-3` between everything. Vary rhythm: tighter spacing within related groups, more breathing room between sections.

10. **Multi-color state system when one color suffices**: The ToggleRow supports amber, sky, emerald, and violet tones. Unless these colors carry distinct semantic meaning (they currently don't --- they're purely decorative differentiation), consolidate to gold-on / neutral-off.

### Design Gut Checks

Before shipping any component, ask:

- If I showed this to someone who designs purikura machines, would they recognize the vibe?
- Could this screenshot belong to a generic SaaS settings panel? If yes, redesign.
- Is the gold accent doing work, or is it just "there"?
- Would this component look identical if I swapped the font back to Inter and the accent back to blue? If yes, the design is not opinionated enough.
- On a convention floor at 2 meters, can I tell what the primary action is?

---

## 10. Implementation Priority

The design system should be built incrementally, not as a big-bang rewrite.

### Phase 1: Foundation (tokens + typography)

1. Define CSS custom properties for the full color system in `globals.css`
2. Load Space Grotesk and DM Sans via `next/font`
3. Define the type scale as custom properties
4. Define the radius scale and duration scale
5. Replace `--background` / `--foreground` with the named surface and text tokens

### Phase 2: Surface System

1. Replace `bg-white/[0.04]` and `border-white/10` patterns in `drawerStyles.js` with token references
2. Update `BUTTON_STYLES` to use the new surface and accent tokens
3. Migrate `BottomDrawer` shell to warm-tinted surfaces
4. Update `ControlBarItem` to use the gold accent system

### Phase 3: Component Refinement

1. Restyle `CaptureButton` with gold ring accent on press
2. Consolidate `ToggleRow` color tones to gold/neutral (keep violet for strip mode)
3. Update `AttractOverlay` with gold-framed design and improved CTA
4. Restyle `Countdown` numbers with Space Grotesk and gold ring pulse

### Phase 4: Polish

1. Audit all `backdrop-blur` usage --- remove from cards, keep on scrim/controls
2. Replace arbitrary Tailwind values with token references
3. Add `prefers-reduced-motion` media queries
4. Test on Raspberry Pi kiosk hardware for performance
5. Test touch targets with actual cosplay gloves at a convention

---

## Sources

- [Purikura: Japan's Photo Booth Phenomenon](https://kokorocares.com/blogs/blog/purikura-capturing-japans-photobooth-phenomenon)
- [Purikura: The Japanese Trend Transforming Photo Booths](https://www.digital-centre.com/2026/01/19/purikura/)
- [Purikura 30th Anniversary (2025)](https://www.gov-online.go.jp/hlj/en/october_2025/october_2025-04.html)
- [Kiosk UI Design Tips](https://kiosk.com/kiosk-ui/)
- [UI Design for Touchscreen Kiosk Software](https://welcm.uk/blog/ui-design-for-touchscreen-kiosk-software)
- [Kiosk UX/UI Design Checklist](https://kioskindustry.org/kiosk-ux-ui-how-to-design-checklist/)
- [OKLCH in CSS: Why We Moved from RGB and HSL](https://evilmartians.com/chronicles/oklch-in-css-why-quit-rgb-hsl)
- [OKLCH Explained for Designers](https://uxdesign.cc/oklch-explained-for-designers-dc6af4433611)
- [Design Tokens Color Module 2025.10](https://www.designtokens.org/tr/drafts/color/)
- [9 Luxury Color Palettes for 2025](https://brandlic.studio/9-luxury-color-palettes-that-define-high-end-design-in-2025/)
- [Dark Mode Color Palettes for Modern Websites](https://colorhero.io/blog/dark-mode-color-palettes-2025)
- [The Color Decision That Makes UI Look Expensive](https://developersjourney.substack.com/p/color-decision-premium-ui-design-system)
- [Linear Design: The SaaS Trend](https://blog.logrocket.com/ux-design/linear-design/)
- [Space Grotesk (Google Fonts)](https://fonts.google.com/specimen/Space+Grotesk)
- [Best Google Font Pairings for UI Design in 2025](https://medium.com/design-bootcamp/best-google-font-pairings-for-ui-design-in-2025-ba8d006aa03d)
- [WCAG 2.5.5 Target Size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html)
- [WCAG 2.5.8 Target Size Minimum Guide](https://testparty.ai/blog/wcag-target-size-guide)
- [AI Slop Web Design Guide (2026)](https://www.925studios.co/blog/ai-slop-web-design-guide)
- [Aesthetics in the AI Era: Design Trends for 2026](https://aigoodies.beehiiv.com/p/aesthetics-2026)
- [Anti-AI Design Trends 2026](https://crea8ivesolution.net/anti-ai-design-trends-2026/)
- [Motion UI Trends 2025: Micro-Interactions](https://www.betasofttechnology.com/motion-ui-trends-and-micro-interactions/)
- [Designing an Arcade: UI Design Case Study](https://medium.com/@Hunterwinterhalt/designing-an-arcade-a-ui-design-case-study-7a233878280c)
- [Arcadecore Aesthetic](https://aesthetics.fandom.com/wiki/Arcadecore)
- [How to Create an Attract Loop for Kiosks](https://sitekiosk.us/attract-kiosk-users/)
- [Attract Screen Design for Kiosks](https://support.optisigns.com/hc/en-us/articles/29232460955539-How-to-Create-an-Attract-Screen-for-Your-Kiosk)
- [Trade Show Booth Lighting Design](https://www.boothvision.com/blogs/exhibition-booth-lighting-design-brand-value/)
- [Camera App UI on Dribbble](https://dribbble.com/tags/camera-ui)
- [Camera App UI on Behance](https://www.behance.net/search/projects/camera%20app%20ui)
