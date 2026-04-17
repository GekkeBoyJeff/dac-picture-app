# Architecture.md -- DAC Fotobooth v3 (Full Rebuild)

## 0. Design Principles

These principles apply to every decision in this document.

1. **No god-components.** Max 200 LOC per component, max 300 per hook.
2. **One source of truth per concern.** No dual-path state. Store owns state; lib functions are pure helpers.
3. **Canvas code is pure.** Zero store access inside `src/lib/canvas/`. Resolve convention, mascot, layout at the call boundary and pass as parameters.
4. **rem everywhere** except canvas pixel buffers and Web Worker math.
5. **Dutch UI strings, English code/comments.** Function names, variable names, comments, and log tags are English. User-visible text is Dutch.
6. **Feature-based file organization.** Organize by what the feature does, not by file type.
7. **Immutable updates.** Spread operators. Never mutate state objects.
8. **Offline-first.** Every feature must degrade gracefully without network.
9. **Kiosk-safe.** Memory must not grow over hours of continuous use. Object URLs are revoked, IndexedDB is trimmed, listeners are cleaned up.

---

## 1. Directory Structure

```
src/
├── app/
│   ├── globals.css               # Tailwind + custom theme tokens
│   ├── layout.jsx                # Root layout (metadata, fonts, SW registration, JSON-LD)
│   ├── page.jsx                  # Boot gate -> PhotoBooth
│   ├── global-error.jsx
│   ├── not-found.jsx
│   └── loading.jsx
│
├── features/
│   ├── camera/
│   │   ├── components/
│   │   │   ├── CameraView.jsx
│   │   │   ├── CameraIssueOverlay.jsx
│   │   │   ├── StatusOverlay.jsx
│   │   │   └── AttractOverlay.jsx
│   │   ├── hooks/
│   │   │   └── useCamera.js
│   │   └── store.js
│   │
│   ├── capture/
│   │   ├── components/
│   │   │   ├── CaptureButton.jsx
│   │   │   ├── Countdown.jsx
│   │   │   ├── FlashEffect.jsx
│   │   │   └── StripFrameOverlay.jsx
│   │   ├── hooks/
│   │   │   ├── useCaptureFlow.js
│   │   │   └── useStripCapture.js
│   │   └── lib/
│   │       └── captureHelpers.js
│   │
│   ├── gestures/
│   │   ├── components/
│   │   │   ├── GestureIndicator.jsx
│   │   │   ├── GestureSequenceHint.jsx
│   │   │   └── HandBox.jsx
│   │   ├── hooks/
│   │   │   ├── useGestureDetection.js
│   │   │   ├── useGestureHold.js
│   │   │   ├── useGestureSequence.js
│   │   │   └── useGestureSwipe.js
│   │   └── lib/
│   │       ├── gestureWorkerBridge.js
│   │       └── handMath.js
│   │
│   ├── overlay/
│   │   ├── components/
│   │   │   └── Overlays.jsx
│   │   ├── hooks/
│   │   │   └── useBreakpoint.js
│   │   ├── lib/
│   │   │   ├── overlayPosition.js
│   │   │   └── breakpointResolver.js
│   │   └── store.js
│   │
│   ├── discord/
│   │   ├── hooks/
│   │   │   └── useDiscordQueue.js
│   │   ├── lib/
│   │   │   ├── sendToDiscord.js
│   │   │   └── sendQueue.js
│   │   └── store.js
│   │
│   ├── gallery/
│   │   ├── components/
│   │   │   └── Gallery.jsx
│   │   └── store.js
│   │
│   ├── settings/
│   │   ├── components/
│   │   │   ├── SettingsDrawer.jsx
│   │   │   ├── BasisTab.jsx
│   │   │   ├── AdvancedTab.jsx
│   │   │   └── shared.jsx
│   │   └── hooks/
│   │       └── usePowerStatus.js
│   │
│   ├── analytics/
│   │   ├── components/
│   │   │   └── AnalyticsDashboard.jsx
│   │   └── lib/
│   │       └── analytics.js
│   │
│   └── pickers/
│       ├── components/
│       │   ├── MascotPicker.jsx
│       │   ├── LayoutPicker.jsx
│       │   ├── LayoutSlider.jsx
│       │   └── LayoutPreviewBlock.jsx
│       └── hooks/
│           └── usePickerNavigation.js
│
├── components/
│   ├── PhotoBooth.jsx
│   ├── DeviceSetupGate.jsx
│   ├── ErrorBoundary.jsx
│   └── ui/
│       ├── BottomDrawer.jsx
│       ├── ControlBar.jsx
│       ├── ControlBarItem.jsx
│       ├── FullScreenOverlay.jsx
│       ├── OfflineBadge.jsx
│       ├── UploadStatus.jsx
│       ├── Spinner.jsx
│       ├── icons.jsx
│       └── AppLoader.jsx
│
├── hooks/
│   ├── useHydrated.js
│   ├── useIdleTimer.js
│   ├── useInstallPrompt.js
│   ├── useOnlineStatus.js
│   └── useToast.js
│
├── lib/
│   ├── canvas/
│   │   ├── compositePhoto.js
│   │   ├── compositeStrip.js
│   │   ├── videoFrame.js
│   │   ├── vignettes.js
│   │   ├── imageOverlays.js
│   │   ├── textOverlays.js
│   │   ├── overlayMeasurer.js
│   │   ├── stripBranding.js
│   │   └── imageLoader.js
│   ├── config/
│   │   ├── index.js
│   │   ├── presets.js
│   │   ├── overlays.js
│   │   └── basePath.js
│   ├── storage/
│   │   ├── indexedDb.js
│   │   └── localStorage.js
│   ├── audio.js
│   ├── deviceCapability.js
│   ├── logger.js
│   └── random.js
│
├── stores/
│   ├── bootStore.js
│   └── uiStore.js
│
├── pwa/
│   ├── ServiceWorkerRegistrar.jsx
│   └── InstallBanner.jsx
│
└── __tests__/
    ├── canvas/
    ├── discord/
    ├── stores/
    ├── hooks/
    └── e2e/
```

---

## 2. Module Boundaries

### 2.1 Ownership Table

| Module | Owns | Exposes |
|--------|------|---------|
| features/camera | Video stream lifecycle, device list, mirror detection | `useCamera`, `cameraStore` |
| features/capture | Countdown, flash, single-photo composite call, strip FSM | `useCaptureFlow`, `useStripCapture` |
| features/gestures | Worker lifecycle, rAF loop, hold-to-trigger, sequences, swipe | `useGestureDetection`, `useGestureHold`, `useGestureSequence`, `useGestureSwipe` |
| features/overlay | DOM overlay rendering, breakpoint resolution | `<Overlays>`, `overlayStore`, `useBreakpoint` |
| features/discord | Queue state, drain loop, immediate send, retry | `useDiscordQueue`, `sendQueueStore` |
| features/gallery | Photo IndexedDB persistence, thumbnail lifecycle | `<Gallery>`, `galleryStore` |
| features/settings | Settings UI (drawer + tabs) | `<SettingsDrawer>` |
| features/analytics | Event tracking, summary, CSV export | `trackEvent`, `<AnalyticsDashboard>` (lazy) |
| features/pickers | Layout/mascot selection UI | `<MascotPicker>`, `<LayoutPicker>`, `<LayoutSlider>` |
| lib/canvas | All canvas drawing (pure functions only) | `compositePhoto`, `compositeStrip` |
| lib/config | Constants, presets, asset paths | Everything via barrel |
| lib/storage | IndexedDB + localStorage wrappers | CRUD functions |
| stores/uiStore | App phase, modals, all persisted settings | Zustand store + selectors |
| stores/bootStore | Boot stage FSM | `BOOT_STAGES`, `useBootStore` |

### 2.2 Import Rules

```
features/* --> lib/*        OK
features/* --> stores/*     OK
features/* --> components/* OK
features/* --> hooks/*      OK
features/A --> features/B   RESTRICTED (via stores or re-exports only)
lib/*      --> stores/*     FORBIDDEN (lib is pure)
```

**Critical: `lib/canvas/*` never imports from `stores/`.**

---

## 3. State Architecture

### 3.1 Stores

| Store | Persistence | Owns |
|-------|-------------|------|
| bootStore | None | `bootStage` FSM |
| uiStore | zustand/persist (partialize) | `appState`, `modals`, all settings |
| cameraStore | None | `isReady`, `isMirrored`, `error`, `devices` |
| overlayStore | zustand/persist (partialize) | `layoutId`, `mascotId` |
| galleryStore | None (IndexedDB is truth) | `photos` index array |
| sendQueueStore | None (IndexedDB is truth) | `queue` index array |

### 3.2 Selector Pattern

```js
// Colocated with store, exported by name
export const selectPendingCount = (state) =>
  state.queue.filter((q) => !q.failed).length

// Consumer
const pendingCount = useSendQueueStore(selectPendingCount)
```

No inline `.filter()` in components. No `getState()` inside render.

---

## 4. Canvas Pipeline

All pure. Convention resolved ONCE at call boundary.

```
compositePhoto(video, container, mirror, options)
├── getVideoCrop() → crop coords
├── getCanvasSize(srcW, srcH, maxPixels) → scaled dims
├── drawVideoFrame(ctx, video, crop, size, mirror)
├── drawVignettes(ctx, w, h)
├── drawImageOverlays(ctx, container, ...) → DOM positions
├── drawTitle(ctx, titleEl, ...) → DOM content
└── drawDate(ctx, dateEl, ...) → DOM content

compositeStrip(photoBlobs, assets)
├── loadStripAssets(mascotId, convention) → loaded images
├── draw photos (object-cover crop)
├── drawQrTopRight, drawDoodles, drawBrandingZone
├── drawMascot, drawSparkles
└── outer border
```

---

## 5. Discord Queue (Single Path)

Store owns state. Lib functions are pure helpers.

```
capture → sendAndTrack(blob)
  → galleryStore.addPhoto(blob)
  → sendOrQueue(blob)
    ├── online: sendToDiscord(blob)
    │   ├── success → done
    │   └── fail → sendQueueStore.enqueue(blob)
    └── offline → sendQueueStore.enqueue(blob)
```

Drain loop in `useDiscordQueue`: processes queue, respects `retryAfterMs`, exponential backoff.

---

## 6. Gesture System (Decomposed)

```
useGestureDetection (~150 LOC) — worker + rAF
useGestureHold (~80 LOC) — victory hold-to-trigger
useGestureSequence (~100 LOC) — step sequence FSM
useGestureSwipe (~65 LOC) — palm swipe

Pure helpers:
  gestureWorkerBridge.js — worker init/terminate
  handMath.js — computeBox, isTwoFingerVictory
```

---

## 7. PhotoBooth Orchestrator (<200 LOC)

Wires hooks, passes props, lazy-loads drawers. Contains NO:
- Capture logic (in useCaptureFlow)
- Queue logic (in useDiscordQueue)
- Gesture config (in gesture hooks)
- Strip state (in useStripCapture)
- Settings UI (lazy SettingsDrawer)
- Gallery UI (lazy Gallery)

---

## 8. PWA Strategy

| Resource | Strategy |
|----------|----------|
| App shell | Cache-first, update in background |
| Overlay assets | Cache-first |
| Fonts | Precached on install |
| version.json | Network-only, no-store |
| MediaPipe models | Cache-first |
| Discord webhook | Network-only |

Manifest generated at build time with correct basePath.
skipWaiting() after cache completion.

---

## 9. Coding Standards

- Max 200 LOC components, 300 LOC hooks, 200 LOC lib files
- No semicolons, double quotes, trailing commas (Prettier)
- rem everywhere except canvas pixel buffers
- Dutch UI strings, English code/comments
- Feature-based file organization
