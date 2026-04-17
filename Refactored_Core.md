# Refactored Core — Actieplan

> Prioriteit: Kritiek → Hoog → Medium. Elke sectie bevat het probleem, de oplossing, en concrete code.
> Geschreven als: Lead Full-Stack Developer + Software Architect

---

## Fase 1: Kritieke Fixes (Direct)

### 1.1 Discord Rate-Limit Respecteren

**Probleem:** `retryAfterMs` wordt berekend maar nooit geconsumeerd. Bij een 429 hamert de queue door.

**Fix:** `sendQueue.js` — consumeer `retryAfterMs` en wacht.

```js
// src/lib/discord/sendQueue.js — processNextInQueue
export async function processNextInQueue() {
  const { queue, markAttempt, dequeue, getBlob } = useSendQueueStore.getState()
  const pending = queue.filter((item) => !item.failed)
  if (pending.length === 0) return { done: true }

  const item = pending[0]
  const blob = await getBlob(item.id)
  if (!blob) {
    await dequeue(item.id)
    return { done: false }
  }

  const result = await sendToDiscord(blob)

  if (result.ok) {
    await dequeue(item.id)
    return { done: false, sent: true }
  }

  // NIEUW: respecteer Discord rate-limit
  if (result.retryAfterMs) {
    return { done: false, retryAfterMs: result.retryAfterMs }
  }

  await markAttempt(item.id)
  return { done: false }
}
```

**Caller (PhotoBooth.jsx) moet `retryAfterMs` respecteren:**
```js
const result = await processNextInQueue()
if (result.retryAfterMs) {
  await new Promise((r) => setTimeout(r, result.retryAfterMs))
}
```

### 1.2 Deduplicate Backoff Logic

**Probleem:** `getBackoffDelay` bestaat in zowel `sendQueue.js` als `sendQueueStore.js`.

**Fix:** Verwijder uit `sendQueueStore.js`. Behoud alleen in `sendQueue.js` (waar het daadwerkelijk gebruikt wordt). Verwijder ook de inerte `getRetryDelay` getter uit de store.

---

## Fase 2: Dead Code Opruimen

### 2.1 Verwijder i18n systeem (167 LOC)

```
Verwijder:
  src/lib/i18n/t.js
  src/lib/i18n/en.js
  src/lib/i18n/nl.js
```

Alle UI strings zijn hardcoded in het Nederlands in de componenten. Als i18n later nodig is, wordt het from scratch opgebouwd met een modern systeem.

### 2.2 Verwijder overige dead code

```
Verwijder:
  src/components/camera/SplashOverlay.jsx          (6 LOC — nooit geïmporteerd)
  src/lib/config/validate.js                        (88 LOC — nooit aangeroepen)

Opschonen in bestanden:
  src/lib/deviceCapability.js    → verwijder getGestureDefaults()
  src/stores/overlayStore.js     → verwijder 3 inerte JS getters (get layout, get mascot, get activeConvention)
  src/stores/sendQueueStore.js   → verwijder getRetryDelay getter
  src/lib/storage/localStorage.js → verwijder 7 ongebruikte STORAGE_KEYS
  src/lib/config/index.js        → verwijder IMAGE.GALLERY_QUALITY, GALLERY.STORAGE_KEY
  src/components/ui/drawerStyles.js → verwijder drawerFocusRingClass, drawerInnerCardClass
```

**Totaal opgeruimd: ~323 LOC**

---

## Fase 3: God-Components Opsplitsen

### 3.1 PhotoBooth.jsx (472 → ~180 LOC)

Extract drie custom hooks:

**`useCaptureFlow.js`** — capture orchestratie:
```js
// src/hooks/useCaptureFlow.js
export function useCaptureFlow({ videoRef, overlayRefs, onPhotoSaved }) {
  const [isCapturing, setIsCapturing] = useState(false)
  const { addPhoto } = useStripCapture()

  const captureOnePhoto = useCallback(async ({ forStrip = false } = {}) => {
    setIsCapturing(true)
    try {
      const video = videoRef.current
      if (!video) return

      if (forStrip) {
        // strip cell capture logic (huidige lines 89-120)
        // ...
      } else {
        // single photo composite (huidige lines 122-145)
        const blob = await compositePhoto(video, overlayRefs)
        await onPhotoSaved(blob)
      }
    } finally {
      setIsCapturing(false)
    }
  }, [videoRef, overlayRefs, onPhotoSaved])

  return { captureOnePhoto, isCapturing }
}
```

**`useDiscordQueue.js`** — queue processing loop:
```js
// src/hooks/useDiscordQueue.js
export function useDiscordQueue() {
  const online = useOnlineStatus()

  useEffect(() => {
    if (!online) return

    let active = true
    const drain = async () => {
      while (active) {
        const result = await processNextInQueue()
        if (result.done) break
        if (result.retryAfterMs) {
          await new Promise((r) => setTimeout(r, result.retryAfterMs))
        }
      }
    }
    drain()
    return () => { active = false }
  }, [online])
}
```

**`useGestureSetup.js`** — gesture config & sequence binding:
```js
// src/hooks/useGestureSetup.js
export function useGestureSetup({ onTrigger, onSequence }) {
  const gesturesEnabled = useUiStore((s) => s.gesturesEnabled)
  // gesture detection setup (huidige lines 300-370)
  // sequence detection (open/close modals)
  // swipe detection (layout slider)
}
```

### 3.2 SettingsDrawer.jsx (581 → ~200 LOC)

Split in tab-componenten:

```
src/components/drawers/
  SettingsDrawer.jsx          (~200 LOC — shell + tab navigation)
  settings/
    GeneralTab.jsx            (~80 LOC — debug, flash, strip mode toggles)
    GestureTab.jsx            (~120 LOC — detection interval, confidence, hold time)
    AdvancedTab.jsx           (~100 LOC — power presets, device info)
    AnalyticsDashboard.jsx    (bestaand, ~121 LOC — lazy loaded)
```

AnalyticsDashboard lazy loaden:
```js
const AnalyticsDashboard = lazy(() => import("./settings/AnalyticsDashboard"))

// In AdvancedTab:
{activeTab === "advanced" && (
  <Suspense fallback={<Spinner />}>
    <AnalyticsDashboard />
  </Suspense>
)}
```

### 3.3 useHandGesture.js (360 → ~150 LOC)

Extract:
```
src/hooks/
  useHandGesture.js     (~150 LOC — orchestratie + state)
  useGestureWorker.js   (~80 LOC — worker lifecycle, init/terminate)
  useGestureHold.js     (~60 LOC — hold progress tracking + trigger)
```

---

## Fase 4: Canvas Pipeline Fixes

### 4.1 Fix Hardcoded Title Strings

```js
// src/lib/canvas/textOverlays.js — drawTitle
export function drawTitle(ctx, canvasW, canvasH) {
  const el = document.querySelector("[data-overlay='title']")
  if (!el) return

  const spans = el.querySelectorAll("span")
  if (spans.length === 0) return

  // Lees content uit DOM ipv hardcoded strings
  spans.forEach((span, i) => {
    const text = span.textContent
    const style = getComputedStyle(span)
    // ... render met style uit DOM
  })
}
```

### 4.2 Fix Convention Race Condition

```js
// src/lib/canvas/stripBranding.js
// Resolve convention EENMAAL en pass als parameter

export async function loadStripAssets() {
  const convention = getActiveConvention()
  const mascot = useOverlayStore.getState().mascotId
  // load assets...
  return { logo, qr, mascotImg, conventionBanner, convention }
}

export function drawBrandingZone(ctx, assets) {
  // Gebruik assets.convention ipv opnieuw getActiveConvention() aan te roepen
  if (assets.convention) {
    // draw convention banner + name
  }
}
```

### 4.3 Fix Missing ctx.save/restore in Strip Capture

```js
// PhotoBooth.jsx (of useCaptureFlow.js na refactor)
// Bij strip frame capture:
if (mirrored) {
  ctx.save()
  ctx.translate(cellW, 0)
  ctx.scale(-1, 1)
}
ctx.drawImage(video, srcX, srcY, srcW, srcH, 0, 0, cellW, cellH)
if (mirrored) {
  ctx.restore()
}
```

### 4.4 Derive Sparkle/Doodle Coords van Constants

```js
// src/lib/canvas/stripBranding.js
// Vervang hardcoded coords:
// VOOR: { x: 1056, y: 22 }
// NA:
const { WIDTH, HEIGHT, MARGIN } = STRIP_CANVAS
const sparkles = [
  { x: WIDTH - MARGIN, y: MARGIN },
  { x: MARGIN, y: HEIGHT * 0.75 },
  { x: WIDTH - MARGIN, y: HEIGHT * 0.75 - 4 },
]
```

---

## Fase 5: Memory Leak & State Fixes

### 5.1 Fix Gallery Thumbnail Leak

```js
// src/components/gallery/Gallery.jsx
export function Gallery() {
  const urlMapRef = useRef(new Map())

  useEffect(() => {
    const currentMap = urlMapRef.current
    const newMap = new Map()

    for (const photo of photos) {
      if (currentMap.has(photo.id)) {
        // Hergebruik bestaande URL
        newMap.set(photo.id, currentMap.get(photo.id))
      } else {
        // Maak nieuwe URL
        getPhotoBlob(photo.id).then((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob)
            newMap.set(photo.id, url)
            setThumbnails((prev) => ({ ...prev, [photo.id]: url }))
          }
        })
      }
    }

    // Revoke URLs die niet meer nodig zijn
    for (const [id, url] of currentMap) {
      if (!newMap.has(id)) {
        URL.revokeObjectURL(url)
      }
    }

    urlMapRef.current = newMap

    return () => {
      // Cleanup ALL bij unmount
      for (const url of urlMapRef.current.values()) {
        URL.revokeObjectURL(url)
      }
    }
  }, [photos])
}
```

### 5.2 Unify Send Queue Pad

```
Keuze: één pad. De store BEZIT de queue state, de lib functies zijn pure helpers.

sendQueueStore.js:
  - enqueue(blob) → schrijft naar IDB + update in-memory queue
  - dequeue(id) → verwijdert uit IDB + update in-memory queue
  - markAttempt(id) → increment + update in-memory queue

sendQueue.js:
  - sendOrQueue(blob) → roept store.enqueue() aan als offline
  - processNextInQueue() → leest store.queue, roept store.dequeue/markAttempt aan

Verwijder: duplicate ID generatie in sendQueue.js (gebruik store.enqueue)
Verwijder: losse loadQueue() calls — store is altijd in sync
```

### 5.3 Fix pendingCount Selector

```js
// src/stores/sendQueueStore.js
// Verwijder de inerte `get pendingCount()` getter.
// Exporteer een selector:
export const selectPendingCount = (state) =>
  state.queue.filter((q) => !q.failed).length

// Consumers:
const pendingCount = useSendQueueStore(selectPendingCount)
```

---

## Fase 6: DRY & Consistentie

### 6.1 Shared Block Component

```js
// src/components/pickers/LayoutPreviewBlock.jsx
export function LayoutPreviewBlock({ position, size = "sm" }) {
  const offsets = { sm: "0.25rem", md: "0.375rem" }
  const offset = offsets[size] ?? offsets.sm
  const style = {
    position: "absolute",
    ...(position.includes("top") && { top: offset }),
    ...(position.includes("bottom") && { bottom: offset }),
    ...(position.includes("left") && { left: offset }),
    ...(position.includes("right") && { right: offset }),
  }
  return <div style={style} className="..." />
}
```

Gebruik in zowel `LayoutPicker.jsx` als `LayoutSlider.jsx`.

### 6.2 Tailwind Theme Tokens

```css
/* src/app/globals.css — @theme inline */
@theme inline {
  --text-label: 0.65rem;
  --text-caption: 0.6875rem;
  --tracking-caps: 0.18em;
  --surface-subtle: rgba(255, 255, 255, 0.04);
  --surface-hover: rgba(255, 255, 255, 0.07);
}
```

Vervang alle `text-[0.65rem]` → `text-label`, `tracking-[0.18em]` → `tracking-caps`, etc.

### 6.3 LayoutSlider px → rem

```js
// Vervang: const CARD_W = 160
const CARD_W_REM = 10 // 10rem = 160px at default font-size
// Alle inline styles in rem
style={{ width: `${CARD_W_REM}rem`, padding: "0 0.5rem" }}
```

---

## Fase 7: PWA & Service Worker

### 7.1 Fix Manifest

```json
{
  "icons": [
    { "src": "overlays/logo.png", "sizes": "512x512", "purpose": "any" },
    { "src": "overlays/logo-maskable.png", "sizes": "512x512", "purpose": "maskable" },
    { "src": "overlays/logo-192.png", "sizes": "192x192", "purpose": "any" }
  ],
  "screenshots": [
    { "src": "screenshots/booth.webp", "sizes": "1080x1920", "type": "image/webp" }
  ]
}
```

Genereer `manifest.json` in de build stap (naast `version.json`) zodat `start_url` en `scope` de correcte `basePath` gebruiken.

### 7.2 Fix Service Worker Race

```js
// public/sw.js — install event
self.addEventListener("install", (event) => {
  event.waitUntil(
    getCacheName()
      .then((name) => caches.open(name))
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()) // NA cache compleet
  )
})
```

### 7.3 Cache-bust version.json

```js
const resp = await fetch("version.json", { cache: "no-store" })
```

---

## Implementatie Volgorde

```
Week 1: Fase 1 (kritiek) + Fase 2 (dead code) + Fase 5.1 (memory leak)
Week 2: Fase 3 (god-components splitsen)
Week 3: Fase 4 (canvas fixes) + Fase 5.2-5.3 (state unificatie)
Week 4: Fase 6 (DRY) + Fase 7 (PWA)
```

Elke fase is onafhankelijk deploybaar. Geen breaking changes. Tests schrijven voor elke fix.
