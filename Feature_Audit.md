# Feature Audit — DAC Fotobooth

> Complete behavioral specification of the app as it exists today.
> This is the source of truth for the rebuild.

---

## 1. Camera System

### Initialization
On first render, `useCamera` calls `startCamera()` via useEffect. A request sequence number prevents race conditions from React Strict Mode double-effects.

### Device Selection
- Mobile (user-agent check): defaults to `facingMode: "user"`
- Desktop with no explicit deviceId: no facingMode specified, browser picks
- Explicit deviceId: `{ exact: deviceId }`
- After stream starts, actual deviceId read from `track.getSettings()`

### Mirror Detection
- `facingMode === "user"` → mirrored
- No facingMode from browser → track label inspected: "elgato", "logitech", "external", "usb", "capture" → not mirrored
- `isMirrored` drives CSS `-scale-x-100` on video and canvas compositing

### Resolution — `getCameraIdeal(mode, isPortrait, lowPower)`
| Mode | Device | Ideal |
|------|--------|-------|
| Strip | Normal | 1920×1080 |
| Strip | Low-power | 1280×720 |
| Single | Low-power | 1920×1080 |
| Single | Full-power | 4096×4096 (uncapped) |

### Post-Start Tuning
`track.applyConstraints({ advanced })`:
- `zoom: caps.zoom.min` (widest angle)
- `imageStabilization: "on"` (if supported)

### Orientation Change
`resize` + `orientationchange` events → `startCamera()` with 500ms debounce.

### Error Messages (Dutch)
- `NotAllowedError` → "Camera toegang geweigerd. Sta camera toe in je browser."
- `NotFoundError` → "Geen camera gevonden op dit apparaat."
- Other → "Onbekende camera fout."

---

## 2. Capture Flow

### Touch Trigger
Tap capture button. If `appState === "countdown"`, cancel. Otherwise if camera ready and no strip active → `setAppState("countdown")`.

### Gesture Trigger
Victory gesture held for `gestureHoldMs` (default 1500ms) → `onVictory()`. Same guards as touch. `captureTriggeredByRef = "gesture"`.

### Countdown
3 seconds. Each tick: beep (660Hz, 80ms, 0.2 gain). Final tick: higher pitch (1200Hz, 150ms, 0.35 gain). Optional "Kijk naar de webcam" prompt at 18% from top. Tapping again cancels.

### Flash
If enabled:
1. Full-screen white div
2. Device vibration (100ms) + synthetic shutter sound (white noise, highpass 2000Hz)
3. Brightness detection: 8×8 canvas samples camera, fires capture when brightness jump > 0.12
4. Safety: bright environment (>0.7 baseline) → 150ms fixed delay. No detection within 300ms → fire anyway
5. Fade out via CSS animation

### Single Photo Capture
`compositePhoto(video, container, mirrored)`:
1. `getVideoCrop()` — center crop to container aspect
2. `getCanvasSize()` — clamp to maxPixels
3. Draw video frame (mirrored if needed)
4. Vignettes: radial (40% black corners), bottom gradient (45% height, 50% black), top gradient (20% height, 40% black)
5. Image overlays from DOM: corners, logo, mascot, QR, convention banner
6. Text overlays: title spans, date
7. Export WebP at 0.9 quality

### Strip Cell Capture
Canvas at 1000×460px. Center-crop video. No DOM overlays. Mirror applied. WebP 0.9.

---

## 3. Strip Mode

### Activation
ControlBar toggle. Capture button turns violet, shows "3".

### Strip Frame Overlay
- Portrait: three stacked frames (1000/460 aspect), 0.8% gap
- Landscape: horizontal carousel, one frame at full screen, translateX transition
- States per frame: empty (transparent), active (live camera preview), captured (blob)
- Progress dots: amber = captured, dim = pending

### Capture Loop
1. `strip.start()` → reset photos, `isActive = true`, countdown
2. After each capture: append blob
3. If < 3 photos: immediately start next countdown
4. If 3 photos: 550ms pause → `compositeStrip()` → `onStripComplete(stripBlob)`
5. Each individual photo also saved to gallery separately
6. Strip mode auto-toggles off on completion

### Strip Composite (1080×1920)
1. Background: `#0a0a0a`
2. 3 photos: 1000×460px each, y starts at 36, gap 16px, radius 12px, center-cropped
3. QR code: 140×140px top-right of first photo, 85% opacity. Below: "Word lid\nvan DAC"
4. 14 doodles (stars, hearts, circles, dots) in branding zone, accent color `#e6c189`
5. Branding zone (y=1460):
   - DAC logo 100×100px, gold shadow glow
   - "Dutch Anime Community" 700 56px Geist, 94% white
   - Convention name (if active) 500 38px Geist, gold, 75%
   - Date nl-NL format, 400 32px Geist, gold, 50%
   - Convention banner (if active) max 420×140px, 92%
6. Mascot: right-aligned, bottom-anchored, max 340×520px, 92%, overlaps bottom photo
7. 5 sparkles at edges
8. Outer border: 1px gold at 12%, 6px inset, 10px radius

---

## 4. Convention System

### Configuration (presets.js)
| Slug | Name | Dates | Banner |
|------|------|-------|--------|
| hmia-2026 | Heroes Made in Asia | 2026-03-19 to 2026-03-21 | PNG |
| animecon-2026 | AnimeCon | 2026-04-17 to 2026-04-19 | PNG |
| dcc-2026 | Dutch Comic Con | 2026-06-20 to 2026-06-21 | SVG |

### Active Detection
`getActiveConvention()` compares today's ISO date string against start/end ranges. Returns first match or `null`.

### What Changes When Active
- Live overlay: convention banner appears (bottom-left, sized per breakpoint)
- Strip: convention name in branding zone + banner image below date

---

## 5. Layout System

### What Layouts Control
Position and sizing of: logo, mascot, QR code, convention banner, title font size, date, corners.

### Breakpoints
- sm: minDim < 600px
- md: 600–1023px
- lg: ≥1024px
- Additional orientation suffix for mascot: `"sm-landscape"` etc.

### Three Layouts
| Layout | Logo | Mascot | QR | Convention |
|--------|------|--------|-----|------------|
| classic | top-left | bottom-right, 85% | top-right, 80% | bottom-left |
| flipped | top-right | bottom-left, 85% | top-left, 80% | bottom-right |
| hero | top-left | bottom-right, 90% (large) | top-right, 80% | bottom-left |

### Mascot Override Cascade
Check order: `layout.mascotOverrides[mascotId]` → `mascot.defaults` → `layout.mascot`.

---

## 6. Mascot System

### Six Mascots (all .webp)
1. `amelia` — default, sizingAxis: height
2. `amelia-v2` — height
3. `amelia-beer` — height
4. `amelia-hug` — **width** (only width-first mascot)
5. `amelia-smile` — height
6. `amelia-beer-alt` — height

### Live Overlay (CSS)
Sized via max-height/max-width based on sizingAxis. `object-fit: contain`. Position from layout.

### Strip (Canvas)
Scaled to fit within 340×520px (contain). Right-aligned, bottom-anchored, 92% opacity.

---

## 7. Discord Integration

### Webhook
`NEXT_PUBLIC_DISCORD_WEBHOOK_URL` env var. Silently skipped if not set.

### Message
"📸 Nieuwe foto uit de photobooth! Welkom bij Dutch Anime Community! 🎉\nGa naar <#684064008827174930>..."

### Send Flow
1. If offline → queue directly
2. POST multipart/form-data to webhook
3. HTTP 429 → read Retry-After header → return retryAfterMs
4. Success → done
5. Failure → enqueue to IndexedDB

### Queue
IndexedDB: `queue-{id}` (blob), `send-queue-index` (metadata).
Each item: `{ id, attempts, failed, lastAttempt }`.

### Retry
Drain loop on mount + on `window.online`. One at a time.
Respects retryAfterMs. Max 10 attempts.
Backoff: `min(1200 + attempts * 1200, 15000) + random(0, 600)ms`.

---

## 8. Gesture System

### Model
MediaPipe GestureRecognizer v0.10.33 in Web Worker. GPU delegate first, CPU fallback.

### Detection
rAF loop → `createImageBitmap(video)` → transfer to worker → results posted back.
Configurable interval (0–1200ms). Busy flag prevents frame overlap.

### Trigger Gestures
`Victory`, `ILoveYou`, `Deuces` above triggerMinScore (default 0.25).
Additional geometric check: `isTwoFingerVictory` verifies only index + middle extended.

### Hold Mechanism
Gesture start → hold timer. Grace period 300ms for dropped frames. Full hold → `onVictory()`.
Progress ring driven by holdProgressRef (zero re-renders).

### Sequences
- Open slider: `[Open_Palm, Closed_Fist, Open_Palm, Closed_Fist]` — 200ms per step, 5s timeout
- Close slider: `[Open_Palm, Closed_Fist]`
- Ref-based state machine, no re-renders

### Swipe
Open_Palm held 500ms → anchor palm X. Move left/right → swipeDelta. 3% dead zone. Release: if delta > 25% of card width → snap next/prev.

---

## 9. Settings (all persisted via zustand/persist)

### Basis Tab
- Flash toggle (default: on)
- Gesture toggle (default: off, locked in low-power)
- Hold duration: 0.5s / 1s / 1.5s / 2s / 3s (default 1.5s)

### Advanced — Power
- Raspberry Pi mode toggle
- Low-power override (unlocks gesture controls)
- Debug mode (hand tracking boxes)

### Advanced — Scene Presets
| Preset | Hands | Detection | Presence | Tracking |
|--------|-------|-----------|----------|----------|
| Convention | 8 | 0.40 | 0.40 | 0.40 |
| Photobooth | 4 | 0.50 | 0.50 | 0.50 |
| Mobile | 2 | 0.60 | 0.60 | 0.50 |
| Zuinig | 2 | 0.65 | 0.65 | 0.60 |

Manual: numHands (2/4/6/8/10/12), detection/presence/tracking sliders (0.2–0.9)

### Advanced — Gesture Presets
| Preset | Interval | Score |
|--------|----------|-------|
| Realtime | 0ms | 0.25 |
| Gebalanceerd | 120ms | 0.35 |
| Spaarstand | 400ms | 0.50 |

---

## 10. Gallery

- IndexedDB: blobs at `photo-{id}`, index at `gallery-index`
- Max 20 photos. Oldest trimmed first.
- No separate thumbnails — blobs loaded on demand, cached as Object URLs in Map ref
- URLs revoked on photo removal and component unmount
- Grid: 2 cols (sm) / 3 (md) / 4 (lg) / 5 (xl)
- Lightbox: full-resolution, delete button, close button
- Delete with undo: 5s window, toast with "Ongedaan maken"

---

## 11. Analytics

### Events
- `session_start`: userAgent, screen
- `photo_captured`: trigger, mode, mascotId, layoutId
- `strip_completed`: mascotId, layoutId
- `discord_sent/queued/failed`: isStrip

### Dashboard
Total photos, strip count, Discord success rate, gesture ratio, most popular mascot/layout, peak hour, hourly bar chart.

### Export
CSV with dynamic headers, ISO timestamps, downloaded as `dac-analytics-{date}.csv`.

---

## 12. PWA

### Manifest
Generated at build time. standalone, orientation any, theme #e6c189.

### Service Worker
Version-keyed cache. Precache overlays + root on install. skipWaiting after cache.
- Assets: cache-first
- App shell: stale-while-revalidate
- Default: network-first
- gesture-worker.js: always fresh

### Install Prompt
Captures beforeinstallprompt. iOS: manual instructions. Dismissed for 7 days.

### Update
Check on mount + every 30 minutes. "Nieuwe versie beschikbaar" banner.

---

## 13. Low-Power Mode

### Detection
ARM in UA/platform, OR (deviceMemory ≤ 2 AND hardwareConcurrency ≤ 4).

### Battery
Battery API: ≤ 20% and not charging → "low".

### Changes
- Camera: 1280×720 for strip, 1920×1080 for single
- Canvas: 720p max for strip, 1080p for single
- Gesture interval: 400ms, numHands: 2, confidences: 0.65/0.65/0.60
- Gestures locked (unless override enabled)
- Strip mode disabled, debug disabled

### Device Setup Gate
First visit: "PC, laptop of mobiel" or "Raspberry Pi" choice. Stored in localStorage.

---

## 14. Key Constants

| Constant | Value |
|----------|-------|
| COUNTDOWN_SECONDS | 3 |
| DEFAULT_GESTURE_HOLD_MS | 1500ms |
| STRIP_PHOTO_COUNT | 3 |
| STRIP_CANVAS.WIDTH | 1080 |
| STRIP_CANVAS.HEIGHT | 1920 |
| STRIP_CANVAS.MARGIN_X | 40 |
| STRIP_CANVAS.PHOTO_TOP | 36 |
| STRIP_CANVAS.PHOTO_HEIGHT | 460 |
| STRIP_CANVAS.PHOTO_GAP | 16 |
| STRIP_CANVAS.BORDER_RADIUS | 12 |
| STRIP_CANVAS.BRANDING_Y | 1460 |
| STRIP_CANVAS.ACCENT_COLOR | #e6c189 |
| STRIP_CANVAS.BG_COLOR | #0a0a0a |
| STRIP_CANVAS.LOGO_SIZE | 100 |
| STRIP_CANVAS.QR_SIZE | 140 |
| STRIP_CANVAS.MASCOT_MAX_HEIGHT | 520 |
| STRIP_CANVAS.MASCOT_MAX_WIDTH | 340 |
| GALLERY.MAX_PHOTOS | 20 |
| IMAGE.EXPORT_QUALITY | 0.9 |
| IMAGE.FORMAT | image/webp |
| TOAST_DURATION_MS | 1500 |
| TOAST_ACTION_DURATION_MS | 5000 |
| GESTURE_SEQUENCE_STEP_HOLD_MS | 200 |
| GESTURE_SEQUENCE_TIMEOUT_MS | 5000 |
| GESTURE_SWIPE_ENGAGE_MS | 500 |
| GESTURE_SWIPE_DEAD_ZONE | 0.03 |
| GESTURE_SWIPE_SNAP_THRESHOLD | 0.25 |
| Discord max retry | 10 |
| Gallery undo window | 5000ms |
| Idle timeout | 60000ms |
| SW update check | 30 min |
| Install dismiss | 7 days |

---

## 15. Boot Sequence

States: `HYDRATING → DEVICE_CHECK → DEVICE_PROMPT → CAMERA_STARTING → READY → ERROR`

1. `useHydrated` waits for client hydration
2. `DeviceSetupGate` reads device profile from localStorage
3. No profile → device prompt screen
4. Profile exists → camera start
5. Camera ready → overlays animate in

---

## 16. Idle Timer

60s without pointer/key/touch → `isIdle = true`. AttractOverlay shows "Kom op de foto!" if no hands visible. Any interaction resets.
