# DAC Photo Booth

Photo booth webapp voor **Dutch Anime Community (DAC)**. Bezoekers maken foto’s met mascotte- en conventie-overlays en delen ze direct naar Discord — volledig in de browser op telefoon, tablet of desktop.

## Features

- Live camera preview met pixel-perfecte overlays (DOM-meting → canvas)
- Conventie-aware banners op datum, layouts en mascotte picker
- Handgesture capture (peace/ILoveYou/Deuces) met verstelbaar tempo/threshold
- Installable PWA met basePath-aware manifest en service worker
- Discord upload met robuuste send-queue en offline retries
- Multi-camera switching, mirrored frontcam, externe cams automatisch niet-mirrored
- Debug overlay + settings drawer voor gesture tuning en toggles
- Persistent storage: gallery (20), overlay-keuzes, gesture settings, send-queue

## Tech Stack

- [Next.js](https://nextjs.org/) 16 (App Router, static export)
- [React](https://react.dev/) 19
- [Tailwind CSS](https://tailwindcss.com/) v4
- [MediaPipe Tasks Vision](https://developers.google.com/mediapipe) voor gesture herkenning
- Canvas API voor compositing

---

## Architectuur

### Beslissingen

- **Static export + basePath**: `next.config.mjs` gebruikt `output: "export"`; `assetPath()` in `src/lib/config/basePath.js` zorgt dat manifest/icons/service worker op elk basePath werken (Pages).
- **CSS als bron van waarheid**: overlays meten de echte DOM (geen dubbele layout data); canvas volgt de on-screen preview.
- **Lokale opslag als enige persistentie**: gallery, overlay-keuzes, UI/gesture settings en send-queue leven in `lib/storage/localStorage.js` keys.
- **Contexten per domein**: Camera/UI/Overlay/Modal gescheiden providers (`src/context`) om re-renders te beperken.
- **PWA first**: manifest + service worker; install-banner voor iOS/Android.

### Hoe het werkt

State machine in `PhotoBooth.jsx`:

```
camera → countdown → capturing → sending → camera
```

1. **Camera** — live feed + overlays; capture-knop of gesture triggert countdown.
2. **Countdown** — 5s aftellen (optioneel “kijk naar camera” prompt).
3. **Capturing** — flash-effect; `compositePhoto` maakt canvas export + gallery data URL.
4. **Sending** — directe Discord upload; bij falen/geen netwerk gaat de foto in de queue met retries op de achtergrond.

### Overlay systeem

`compositePhoto` leest `getBoundingClientRect()` van overlay- elementen, tekent video (object-cover crop), vignettes, corners, mascotte, conventie, logo, titel, datum op een begrensd canvas (max ~1080p). Afbeeldingen worden gecachet; text overlays gebruiken gemeten fonts/letterspacing.

### Data flow (vereenvoudigd)

```
Capture/gesture → Countdown → compositePhoto()
  ├─ Video crop & vignettes
  ├─ Overlays (corners/mascot/QR/logo/title/date)
  └─ exportBlob + galleryDataUrl
Gallery ← addPhoto()
Discord ← sendWithQueue(exportBlob) (direct + queue fallback)
UI toasts/overlays tonen status
```

### Send queue & retries

`useSendQueue` stuurt eerst direct. Bij falen of offline wordt de foto als data URL in `photobooth-send-queue` gezet. Retries lopen met oplopende backoff (1.2s → 15s max) en gaan door zolang de queue items heeft; online events boosten retries. UI toont een “Foto versturen…” overlay tijdens directe poging en een wachtrij-chip bij veel pending items.

### Gestures & instellingen

`useHandGesture` (MediaPipe) detecteert victory/ILoveYou/Deuces. Default: detectie elke frame (interval 0ms), trigger threshold 0.35, 2 opeenvolgende hits nodig; bounding boxes (tracking + gesture) blijven even staan om flicker te voorkomen. `SettingsDrawer` laat toggles toe voor gestures aan/uit, debug overlay, interval (0–1200ms), threshold (0–1). Instellingen worden bewaard in localStorage.

---

## Projectstructuur

```
src/
├── app/
│   ├── page.jsx                # Rendert PhotoBooth
│   ├── layout.jsx              # Metadata, basePath manifest/icons, SW register
│   ├── loading.jsx, not-found.jsx, global-error.jsx
│
├── components/
│   ├── PhotoBooth.jsx          # Centrale orchestrator (state machine)
│   ├── BottomDrawer.jsx, InstallBanner.jsx, Gallery.jsx, Countdown.jsx, FlashEffect.jsx
│   ├── ServiceWorkerRegistrar.jsx, Spinner.jsx, icons.jsx
│   └── camera/
│       ├── CameraView.jsx, ControlBar.jsx, CaptureButton.jsx
│       ├── Overlays.jsx, GestureIndicator.jsx, HandBox.jsx
│       ├── LayoutPicker.jsx, MascotPicker.jsx, PickerDrawer.jsx
│       ├── SplashOverlay.jsx, StatusOverlay.jsx, AboutDrawer.jsx, SettingsDrawer.jsx
│       └── index.js
│
├── context/                    # Camera/UI/Overlay/Modal providers + hooks
│   ├── CameraContext.jsx, UIContext.jsx, OverlayContext.jsx, ModalContext.jsx
│   └── index.js
│
├── hooks/
│   ├── useCamera.js            # Stream, devices, mirroring, orientation recalibration
│   ├── useHandGesture.js       # MediaPipe gestures + boxes + configurable timing
│   ├── useOverlaySettings.js   # Layout/mascot selectie + persist
│   ├── useGallery.js           # Gallery (20) met migratie en persist
│   ├── useInstallPrompt.js     # PWA prompt (Android/iOS) + dismiss timer
│   ├── useModalState.js        # Kleine modal state helper
│   ├── useSendQueue.js         # Discord queue/backoff + offline retries
│   └── useToast.js             # Toasts met auto-dismiss
│
└── lib/
    ├── compositePhoto.js       # Canvas orchestration
    ├── canvas/                 # Rendering helpers
    │   ├── videoFrame.js, vignettes.js
    │   ├── imageLoader.js, imageOverlays.js, overlayMeasurer.js
    │   └── textOverlays.js
    ├── config/
    │   ├── index.js, overlays.js, presets.js, validate.js, basePath.js
    ├── storage/localStorage.js # Storage helpers + keys
    ├── styles/buttons.js, styles/animations.js
    ├── sendToDiscord.js
    └── random.js

public/
└── overlays/
    ├── mascots/, conventions/, logo.png, corner-*.svg, qr-*.svg
```

---

## Code standaarden

- Tailwind als primaire styling; herhaalde utility strings wonen in `lib/styles/*`.
- Contexten per domein; barrel exports houden imports kort.
- Persistente data via `lib/storage/localStorage.js` voor uniforme keys/fallbacks.
- Overlay-posities altijd uit de DOM meten; geen hardcoded duplicaten in JS.
- Gestures instelbaar via SettingsDrawer; debug overlay alleen aan bij noodzaak.

## Kerncomponenten

- **PhotoBooth.jsx** — coördineert states, toasts, modals, gestures, queue status.
- **CameraView.jsx** — rendert video/overlays/controls; gebruikt context voor minimale re-renders.
- **Overlays.jsx** — vertaalt layout preset naar DOM overlays; responsive via kleinste viewport-dimensie (sm/md/lg).
- **compositePhoto.js** — object-cover video crop, vignettes, overlays, tekst; begrenst canvasresolutie; gebruikt gecachete assets.
- **useHandGesture.js** — MediaPipe video mode, interval clamp 0–1200ms, min score clamp 0–1, 2x confirm; hand/gesture boxes met hold om flicker te vermijden.
- **useSendQueue.js** — directe post + fallback queue, data URL opslag, backoff 1.2s→15s, online-listener, UI signalering.
- **useOverlaySettings.js** — bewaart layout/mascot keuzes en bepaalt actieve conventie op datum.
- **config/validate.js** — runtime shape checks in dev voor layouts/mascots/conventies.

---

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) en sta cameratoegang toe.

### Discord Webhook (optioneel)

`.env.local` voorbeeld:

```env
NEXT_PUBLIC_DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
NEXT_PUBLIC_BASE_PATH=/dac-picture-app   # voor GitHub Pages of andere subpath deploys
```

### Production build

```bash
npm run build
```

### Deployment (GitHub Pages)

1. Zet `NEXT_PUBLIC_BASE_PATH=/dac-picture-app` (of relevant subpad).
2. `npm run build` → static export in `out/`.
3. Deploy `out/` naar Pages. Tip: `manifest.json` start_url op hetzelfde basePath voor striktere PWA start.

## Nieuwe conventie toevoegen

1. Map: `public/overlays/conventions/<slug>/`
2. Banner erin
3. Entry in `src/lib/config/presets.js` met slug, datums, banner pad, sizes

## Nieuwe mascotte toevoegen

1. Voeg bestand toe in `public/overlays/mascots/`
2. Entry in `src/lib/config/presets.js` met id, naam, path, thumbnail

## Conventie setup (on-site)

1. Sluit externe camera (Logitech/Elgato) aan
2. Open in Chrome/Edge fullscreen (F11)
3. Kies layout/mascot; bezoekers drukken op de shutter of tonen een peace sign

## Environment variables

| Variable | Beschrijving |
|----------|--------------|
| `NEXT_PUBLIC_DISCORD_WEBHOOK_URL` | Discord webhook voor uploads |
| `NEXT_PUBLIC_BASE_PATH` | Base path voor deployment (bijv. /dac-picture-app) |
| `GITHUB_ACTIONS` | CI indicator (Pages build) |

## Deployment

- GitHub Pages via Actions; push naar `main` triggert static export.

## DAC Kleuren

| Kleur | Hex |
|-------|-----|
| Gold  | `#e6c189` |
| Cream | `#F0EAD2` |
| Purple| `#6d41e7` |

## License

Intern project van Dutch Anime Community.
