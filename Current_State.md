# Current State — DAC Fotobooth

> Technische autopsie door: UX/UI Designer, Software Architect, Lead Developer, SEO Specialist
> Datum: 2026-04-08

---

## 1. Wat is het?

Een **offline-first PWA fotobooth** voor anime/comic conventions. Bezoekers maken foto's (single of 3-foto strip), die automatisch naar Discord worden gestuurd. Bediening via touchscreen óf handgebaren (MediaPipe). Draait op kiosk-hardware (Raspberry Pi) en mobiele devices.

**Stack:** Next.js 16 (static export) · React 19 · Zustand 5 · Tailwind 4 · MediaPipe Vision · IndexedDB · Discord Webhook

---

## 2. Architectuur

```
┌─────────────────────────────────────────────────────┐
│                    Next.js Shell                     │
│  layout.jsx (metadata, SW registration, fonts)       │
│  page.jsx → bootStage gate → DeviceSetupGate         │
│                     ↓                                │
│              PhotoBooth.jsx (472 LOC)                │
│         ┌──────────┼──────────────┐                  │
│         ▼          ▼              ▼                  │
│   CameraView   Capture Flow   Drawers/Modals        │
│   ├ Overlays   ├ Countdown    ├ SettingsDrawer       │
│   ├ ControlBar ├ FlashEffect  ├ Gallery              │
│   ├ HandBox    ├ StripFrame   ├ LayoutPicker         │
│   └ StatusOvl  └ useStrip..   ├ MascotPicker         │
│                               └ AboutDrawer          │
├─────────────────────────────────────────────────────┤
│                 Zustand Stores (6)                    │
│  bootStore · uiStore · cameraStore                   │
│  galleryStore · overlayStore · sendQueueStore         │
├─────────────────────────────────────────────────────┤
│              Canvas Pipeline (9 files)                │
│  compositePhoto → videoFrame + vignettes +           │
│                   imageOverlays + textOverlays        │
│  compositeStrip → stripBranding (doodles, sparkles,  │
│                   mascot, QR, branding zone)          │
├─────────────────────────────────────────────────────┤
│              Services & Storage                      │
│  sendToDiscord → sendQueue (IndexedDB retry)         │
│  galleryStore → IndexedDB (idb-keyval)               │
│  analytics.js → localStorage event tracking          │
│  gesture-worker.js → MediaPipe Web Worker            │
└─────────────────────────────────────────────────────┘
```

**Codebase:** ~80 bestanden, ~7.850 LOC  
**Dependencies:** 6 runtime (Next, React, React-DOM, Zustand, MediaPipe, idb-keyval)

---

## 3. Data Flow

```
Camera Stream
  → useCamera (enumerate, constraints, mirror detection)
  → <video> element in CameraView
  → useHandGesture (Web Worker → MediaPipe → gesture scores)
  → Trigger: gesture hold OR touch
  → Countdown (3s)
  → Flash effect
  → compositePhoto() OR strip capture loop
  → canvas.toBlob()
  → galleryStore.addPhoto(blob)     → IndexedDB
  → sendOrQueue(blob)               → Discord webhook
       ├ online  → sendToDiscord()   → success/fail
       └ offline → enqueue()         → IndexedDB retry queue
```

---

## 4. Bottlenecks & Kritieke Issues

### 🔴 Kritiek

| # | Locatie | Issue |
|---|---------|-------|
| 1 | `sendQueue.js` + `sendQueueStore.js` | **Dubbele `getBackoffDelay`** — identieke functie op 2 plekken. Store versie is dood. |
| 2 | `sendQueue.js:67-83` | **Discord rate-limit (`retryAfterMs`) wordt compleet genegeerd** — bij 429 response wordt de retry-after waarde berekend maar nooit geconsumeerd. Queue hamert door op Discord. |

### 🟠 Hoog

| # | Locatie | Issue |
|---|---------|-------|
| 3 | `lib/i18n/` (3 bestanden) | **Volledig dood i18n systeem** — `t()`, `setLocale()`, `getLocale()` worden nergens geïmporteerd. ~120 LOC waste. |
| 4 | `Gallery.jsx:22-41` | **Memory leak** — Object URLs van thumbnails worden niet correct opgeruimd bij `photos` wijzigingen. Oude URLs accumuleren. |
| 5 | `textOverlays.js:26-27` | **Hardcoded title strings** — "DUTCH ANIME" / "COMMUNITY" staan hardcoded ipv DOM content te lezen. Canvas output matcht niet bij titelwijziging. |
| 6 | `stripBranding.js` | **`getActiveConvention()` 2x onafhankelijk aangeroepen** — race condition bij middernacht: assets laden convention A, tekenen probeert convention B. |
| 7 | `overlayStore.js:15-28` | **3 inerte Zustand getters** — JS getters in `create()` zijn niet reactief. Consumers gebruiken ze niet maar ze misleiden developers. |
| 8 | `config/validate.js` | **72 LOC validatie die nooit draait** — `validateConfigShapes` wordt nergens aangeroepen. |
| 9 | `deviceCapability.js:114-120` | **`getGestureDefaults` is dood** — 3e kopie van dezelfde constanten (ook in `uiStore` en `sendQueueStore`). |
| 10 | `PhotoBooth.jsx` | **472 LOC** — ver boven de 300-regel grens. Orkestreert camera, capture, gestures, upload, strip, idle en install prompt in één bestand. |
| 11 | `SettingsDrawer.jsx` | **581 LOC** — grootste component. Bevat analytics dashboard, alle settings, power management. |

### 🟡 Medium

| # | Locatie | Issue |
|---|---------|-------|
| 12 | `LayoutPicker` + `LayoutSlider` | **Gedupliceerde `Block` component** — identieke layout preview op 2 plekken. |
| 13 | `sendQueue.js` vs `sendQueueStore` | **Dual-path queueing** — lib functies en store acties doen hetzelfde werk. Store state altijd stale tot `loadQueue()`. |
| 14 | `localStorage.js:1-11` | **7 van 8 `STORAGE_KEYS` zijn dood** — overblijfsel van pre-Zustand architectuur. |
| 15 | `LayoutSlider.jsx:23` | **Raw `px` in inline styles** — `CARD_W = 160` en `padding: "0 8px"` in non-canvas DOM. |
| 16 | `manifest.json` | **Hardcoded `start_url`/`scope`** — matcht niet met lokale dev (basePath = ""). Geen 192x192 icon. Eén icon voor `any` + `maskable`. |
| 17 | `sw.js` | **`skipWaiting()` buiten `waitUntil`** — activatie kan racen vóór cache compleet is. Geen cache-bust op `version.json`. |
| 18 | `globals.css` | **`--font-geist-mono` referentie maar geen mono font geladen** — `font-mono` fallback naar browser default. |
| 19 | `stripBranding.js` | **Hardcoded pixel coördinaten** — sparkles/doodles refereren absolute px die breken als STRIP_CANVAS dimensies wijzigen. |
| 20 | `PhotoBooth.jsx:103-107` | **Missing `ctx.save/restore`** rond mirror transform in strip capture. |

### 🔵 Laag

| # | Issue |
|---|-------|
| 21 | `SplashOverlay.jsx` — dood component, nergens geïmporteerd |
| 22 | `drawerStyles.js` — 2 exports (`drawerFocusRingClass`, `drawerInnerCardClass`) nergens gebruikt; keyboard-focus styles ontbreken |
| 23 | `IMAGE.GALLERY_QUALITY` en `GALLERY.STORAGE_KEY` config constanten ongebruikt |
| 24 | `page.jsx` — `export default` met `const` ipv `export default function` |
| 25 | `useHandGesture.js` — 360 LOC met 14 refs, boven splitgrens |
| 26 | `LayoutSlider.jsx` — `eslint-disable react-hooks/refs` is geen bestaande ESLint rule |
| 27 | Twee verschillende drawer close-animatie patronen (BottomDrawer vs SettingsDrawer) |
| 28 | `not-found.jsx` — `href="/"` resolvet niet naar `/dac-picture-app/` |

---

## 5. Dead Code Inventaris

| Bestand/Export | LOC | Status |
|----------------|-----|--------|
| `lib/i18n/t.js` + `en.js` + `nl.js` | 167 | Volledig dood |
| `config/validate.js` | 88 | Nooit aangeroepen |
| `SplashOverlay.jsx` | 6 | Nooit geïmporteerd |
| `deviceCapability.js → getGestureDefaults` | 7 | Nooit aangeroepen |
| `localStorage.js → 7 STORAGE_KEYS` | ~20 | Legacy, ongebruikt |
| `drawerStyles.js → 2 exports` | ~10 | Ongebruikt |
| `config/index.js → GALLERY_QUALITY, STORAGE_KEY` | ~5 | Ongebruikt |
| `overlayStore.js → 3 JS getters` | ~15 | Inert (niet reactief) |
| `sendQueueStore.js → getRetryDelay` | ~5 | Duplicate, ongebruikt |
| **Totaal dood** | **~323 LOC** | **~4% van codebase** |

---

## 6. Performance Profiel

### Goed
- Canvas pipeline draait buiten React render cycle
- `loadImage` cache voorkomt duplicate fetches
- Strip assets laden parallel via `Promise.all`
- Web Worker voor MediaPipe isoleert main thread
- Low-power detection schaalt canvas pixels terug

### Aandachtspunten
- `SettingsDrawer` + `AnalyticsDashboard` zijn altijd gemount (ook wanneer gesloten) — IndexedDB reads bij elke mount
- Alle drawers eager geïmporteerd in `PhotoBooth.jsx` — geen code splitting
- `useStripCapture` dual ref+state veroorzaakt extra renders tijdens strip capture
- Arbitraire Tailwind values (`text-[0.65rem]`, `bg-white/[0.04]`) herhalen zich over 6+ componenten zonder theme tokens
- `@mediapipe/tasks-vision` npm package potentieel in main bundle naast worker

---

## 7. PWA & SEO Status

### PWA ✅ Werkend
- Service worker met cache-first voor assets, stale-while-revalidate voor shell
- IndexedDB voor offline photo storage
- Discord send queue met exponential backoff
- Install prompt handling (iOS + Android)

### PWA ⚠️ Verbeterpunten
- Manifest mist 192x192 icon, screenshots array, en apart maskable icon
- `start_url`/`scope` hardcoded (breekt lokale dev)
- Font files niet geprecached (offline first-load zonder Geist font)
- `version.json` fetch zonder `cache: "no-store"`

### SEO ✅ Basis aanwezig
- OpenGraph en Twitter card metadata
- `lang="nl"` op html element
- Theme color en apple-web-app config

### SEO ⚠️ Ontbreekt
- `metadataBase` niet gezet (Next.js build warning)
- `openGraph.images` ontbreekt (geen preview bij link-unfurl)
- Geen structured data / JSON-LD
- Geen `robots.txt` of `sitemap.xml` (relevant als de app publiek toegankelijk is)

---

## 8. Samenvatting

| Categorie | Score | Toelichting |
|-----------|-------|-------------|
| **Functionaliteit** | 8/10 | Alle core features werken. Gesture detection, strip mode, offline queue, gallery. |
| **Code Kwaliteit** | 5/10 | ~4% dead code, 2 god-components (472 + 581 LOC), DRY violations, dual-path state. |
| **Performance** | 6/10 | Canvas pipeline is solide. Maar eager loading, geen code splitting, extra renders. |
| **Architectuur** | 6/10 | Zustand stores zijn clean. Maar PhotoBooth.jsx is een god-component en de send queue heeft twee onafhankelijke paden. |
| **PWA** | 7/10 | Werkt offline. Maar manifest incompleet, font niet geprecached, skipWaiting race. |
| **SEO** | 4/10 | Basis metadata aanwezig. Geen OG image, geen metadataBase, geen structured data. |
| **Schaalbaarheid** | 5/10 | Config systeem (presets) is goed opgezet. Maar hardcoded strings in canvas, geen i18n, god-components blokkeren feature-groei. |
