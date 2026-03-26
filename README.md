# DAC Photo Booth

Photo booth web app voor **Dutch Anime Community (DAC)**, gebouwd om onboarding bij conventies te verbeteren. Bezoekers kunnen een foto maken met mascot overlays, conventie-branding, en deze direct delen naar Discord — allemaal vanuit de browser op hun telefoon.

## Features

- **Live camera preview** met real-time overlay rendering
- **Conventie-aware** — toont automatisch de actieve conventie-banner op basis van datumbereiken
- **Mascot picker** — kies uit meerdere mascot-karakters via een bottom drawer
- **Layout picker** — wissel tussen overlay-layouts (classic, minimal, centered mascot)
- **Pixel-perfecte foto's** — captured foto's matchen exact de live preview via DOM-meting
- **Hand gesture detection** — peace sign start countdown
- **Discord integratie** — foto's worden automatisch naar een Discord-kanaal gestuurd
- **Send-queue** — mislukt versturen wordt lokaal in de wachtrij gezet met retries
- **PWA** — installeerbaar als standalone app op elk apparaat
- **Responsive** — werkt op telefoons, tablets, desktops en elk schermformaat
- **Multi-camera support** — wissel tussen camera's, detecteert automatisch externe apparaten

## Tech Stack

- [Next.js](https://nextjs.org/) 16 met App Router
- [React](https://react.dev/) 19
- [Tailwind CSS](https://tailwindcss.com/) v4
- [MediaPipe](https://developers.google.com/mediapipe) voor hand gesture recognition
- Canvas API voor foto-compositing

---

## Architectuur

### Beslissingen (waarom)

- **Static export + basePath**: `next.config.mjs` gebruikt `output: "export"` en `basePath` via `NEXT_PUBLIC_BASE_PATH` (voor GitHub Pages: `/dac-picture-app`). Geen server-side API; Discord upload gaat direct via webhook.
- **CSS als bron van waarheid**: overlay-posities komen uit de DOM; geen dubbele layout-logica in JS.
- **Lokale opslag als enige persistentie**: gallery (20 items), overlay-keuzes en send-queue zitten in localStorage; geen backend.
- **Contexten per domein**: Camera/UI/Overlay/Modal splitsen re-render oppervlak; barrel export in `src/context/index.js` houdt imports kort.
- **PWA first**: manifest + service worker (cache-first static, stale-while-revalidate voor navigatie); install-banner voor Android/iOS.

### Hoe het werkt

De app draait als een state machine in PhotoBooth.jsx met vier toestanden:

```
camera → countdown → capturing → sending → camera
```

1. **Camera** — Live video feed met overlays. Gebruiker drukt op de capture-knop of toont een peace sign.
2. **Countdown** — 5 seconden aftellen met optionele "kijk naar de camera" prompt.
3. **Capturing** — Flash-effect speelt af, foto wordt gecomposeerd op een canvas.
4. **Sending** — Foto wordt opgeslagen in de gallery en naar Discord gestuurd; bij falen gaat hij de wachtrij in met retries.

### Overlay systeem

CSS is de **single source of truth** voor alle overlay-posities. Tijdens het vastleggen leest `compositePhoto` de werkelijke DOM-posities van elk overlay-element via `getBoundingClientRect()` en tekent ze op een high-resolution canvas. Dit garandeert dat de foto exact overeenkomt met de on-screen preview, ongeacht apparaat of schermgrootte.

### Data flow

```
Gebruiker drukt op knop / toont peace sign
    ↓
PhotoBooth.handleCapture()
    ↓
Countdown (5 sec) → handleCountdownComplete()
    ↓
FlashEffect + compositePhoto()
    ├─ Leest overlay posities uit DOM
    ├─ Tekent video frame op canvas (gecropped naar container aspect ratio)
    ├─ Tekent vignettes, corners, mascot, banner, QR, logo, titel, datum
    └─ Retourneert exportBlob (WebP, hoge kwaliteit) + galleryDataUrl (display)
    ↓
addPhoto(galleryDataUrl) → localStorage
    ↓
sendWithQueue(exportBlob) → Discord webhook (met retries + fallback queue)
    ↓
Toast notificatie → terug naar camera state

```

### Send queue & retries

`useSendQueue` probeert eerst direct te posten naar Discord. Bij falen wordt de foto (WebP data URL) lokaal in de queue opgeslagen (`photobooth-send-queue`) en automatisch opnieuw verstuurd met oplopende backoff tot maximaal 3 pogingen. De UI toont een korte "Foto versturen..." overlay tijdens de directe poging; queued retries lopen op de achtergrond.
```

---

## Projectstructuur

```
src/
├── app/                          # Next.js App Router
│   ├── page.jsx                  # Rendert PhotoBooth component
│   ├── layout.jsx                # Root layout, metadata en globale providers
│   ├── loading.jsx               # App loading state
│   ├── global-error.jsx          # Globale foutpagina
│   └── not-found.jsx             # 404 pagina
│
├── components/
│   ├── PhotoBooth.jsx            # Centrale orchestrator (state machine + hook compositie)
│   ├── BottomDrawer.jsx          # Herbruikbare bottom drawer modal
│   ├── Countdown.jsx             # Afteltimer voor foto-capture
│   ├── Gallery.jsx               # Fotogalerij met lightbox viewer
│   ├── FlashEffect.jsx           # Wit flash-effect bij capture
│   ├── InstallBanner.jsx         # PWA installatie-prompt
│   ├── ServiceWorkerRegistrar.jsx# Registreert de service worker
│   ├── Spinner.jsx               # Kleine loading indicator
│   ├── icons.jsx                 # SVG icon componenten
│   └── camera/                   # Camera-specifieke UI laag
│       ├── CameraView.jsx
│       ├── Overlays.jsx
│       ├── ControlBar.jsx
│       ├── CaptureButton.jsx
│       ├── LayoutPicker.jsx
│       ├── MascotPicker.jsx
│       ├── PickerDrawer.jsx      # Generieke picker basiscomponent
│       ├── SplashOverlay.jsx
│       ├── StatusOverlay.jsx
│       ├── AboutDrawer.jsx
│       ├── GestureIndicator.jsx
│       └── index.js              # Barrel exports voor camera submodule
│
├── context/                      # React Context providers/consumers (app-brede state)
│   ├── CameraContext.jsx
│   ├── UIContext.jsx
│   ├── OverlayContext.jsx
│   ├── ModalContext.jsx
│   └── index.js
│
├── hooks/
│   ├── useCamera.js              # Camera stream, device enumeration, mirroring
│   ├── useHandGesture.js         # MediaPipe hand gesture herkenning
│   ├── useOverlaySettings.js     # Layout/mascot selectie + localStorage persistentie
│   ├── useGallery.js             # Lokale foto-opslag in localStorage (max 20)
│   ├── useInstallPrompt.js       # PWA install prompt management
│   ├── useModalState.js          # Centrale modal state helper
│   ├── useSendQueue.js           # Queue + retries voor Discord uploads
│   └── useToast.js               # Toast notificatie systeem
│
└── lib/
    ├── compositePhoto.js         # Video frame + overlays -> canvas -> data URL
    ├── canvas/                   # Canvas rendering helpers (video/frame/overlay/text/vignette)
    │   ├── videoFrame.js
    │   ├── imageLoader.js
    │   ├── imageOverlays.js
    │   ├── textOverlays.js
    │   └── vignettes.js
    ├── sendToDiscord.js          # Foto naar Discord via webhook
    ├── random.js                 # Kleine utility helpers
    ├── storage/
    │   └── localStorage.js       # Centrale localStorage helpers + keys
    ├── styles/
    │   ├── buttons.js            # Herbruikbare button class constants
    │   └── animations.js         # Gedeelde animation delays
    └── config/
        ├── index.js              # Re-exporteert alle config + app constanten
        ├── validate.js           # Development runtime config shape checks
        ├── overlays.js           # Asset paden (corners, logo, QR)
        └── presets.js            # Layouts, mascots, conventies met datumbereiken

public/
└── overlays/
    ├── mascots/                  # Mascot afbeeldingen (Amelia varianten)
    ├── conventions/              # Conventie assets per slug (hmia-2026/, dcc-2026/, etc.)
    ├── logo.png                  # DAC logo
    ├── corner-*.svg              # Hoekdecoraties
    └── qr-*.svg                  # QR codes
```

---

## Code Standaarden

- Tailwind blijft de primaire stylinglaag; herhaalde class strings gaan naar lib/styles.
- JavaScript blijft de taal voor nu; code wordt modulair gehouden met kleine hooks/helpers.
- CSS hoort in globals.css of utility-lagen voor statische styling; alleen runtime-afhankelijke waarden blijven inline.
- Persistentie loopt via lib/storage/localStorage.js voor consistente key- en error-handling.
- Domeincomponenten krijgen barrel exports om imports eenvoudig en consistent te houden.
- Context is opgesplitst per domein (Camera/UI/Overlay/Modal) om coupling te verlagen en re-renders beter te isoleren.
- Picker/drawer varianten delen een generieke basiscomponent om duplicatie te verminderen.

## Kerncomponenten in detail

### PhotoBooth.jsx - De orchestrator

Het centrale component dat alle hooks initialiseert en de app-state beheert. Coördineert de flow tussen camera, countdown, capture en sending. Alle user-interacties (knopdrukken, gestures) worden hier afgehandeld.

### CameraView.jsx - Camera layout

Geeft het video-element weer met alle overlays en UI-controls eroverheen. Is gememoized om onnodige re-renders te voorkomen terwijl de videostream actief is.

### Overlays.jsx - Visuele overlay laag

Rendert alle decoratieve elementen bovenop de video feed:
- **Vignettes** — CSS-gradiënten voor donkere randen
- **Corners** — Decoratieve hoekelementen
- **Mascot** — Geselecteerd mascot-karakter
- **Conventie banner** — Alleen zichtbaar als vandaag binnen de conventiedatums valt
- **Logo, titel, QR-code, datum** — Gepositioneerd volgens het actieve layout-preset

Gebruikt responsive breakpoints (sm/md/lg) gebaseerd op de kleinste viewport-dimensie.

### compositePhoto.js - Foto-compositing

Leest de posities van DOM-elementen en tekent alles op een canvas:
1. Video frame (gecropped met object-cover logica)
2. Vignettes (procedurele gradiënten)
3. Alle overlay-afbeeldingen (met caching)
4. Titel en datum tekst met schaduwen
5. Exporteert als data URL (max 1920×1080 op mobiel)

### useCamera.js - Camera management

Beheert camera-stream, permissies en device-enumeratie. Detecteert automatisch front/back camera's en externe apparaten. Schakelt mirroring uit voor externe/back camera's. Handelt oriëntatie-wisselingen af.

### useHandGesture.js - Gesture herkenning

Gebruikt MediaPipe Vision voor continu hand gesture detectie:
- **Peace sign (Victory)** — 3 opeenvolgende detecties nodig → start countdown
- Elke 500ms een check, met confidence threshold van 0.3

### useOverlaySettings.js - Overlay voorkeuren

Beheert layout- en mascotselectie. Slaat keuzes op in localStorage zodat ze bewaard blijven. Bepaalt ook welke conventie actief is op basis van de huidige datum.

### Config (presets.js)

Definieert alle beschikbare layouts, mascots en conventies:
- **Layouts** — Elk layout bevat responsive posities (sm/md/lg) voor logo, mascot, conventie-banner, QR en datum
- **Mascots** — Amelia-varianten met naam en afbeeldingspad
- **Conventies** — Naam, datumbereik, en banner-asset per conventie

---

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) en sta cameratoegang toe.

### Discord Webhook (optioneel)

Maak een `.env.local` bestand om foto-uploads naar Discord in te schakelen:

```env
NEXT_PUBLIC_DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
NEXT_PUBLIC_BASE_PATH=/dac-picture-app   # nodig voor GitHub Pages deployments
```

### Production Build

```bash
npm run build
```

### Deployment (GitHub Pages)

1. Zet `NEXT_PUBLIC_BASE_PATH=/dac-picture-app` in de build (of `.env.local` bij export).
2. Run `npm run build` → static export in `out/`.
3. Deploy `out/` naar Pages. Optioneel: zet `manifest.json` `start_url` op `/dac-picture-app/` voor striktere PWA start.

## Nieuwe conventie toevoegen

1. Maak een map: `public/overlays/conventions/<slug>/`
2. Voeg de conventie-banner afbeelding toe
3. Voeg een entry toe aan `src/lib/config/presets.js` met datumbereik en asset-pad

De conventie-overlay verschijnt automatisch tijdens de opgegeven datums.

## Nieuwe mascot toevoegen

1. Voeg de afbeelding toe aan `public/overlays/mascots/`
2. Voeg een entry toe aan `src/lib/config/presets.js`

Gebruikers kunnen de mascot selecteren via de mascot picker in de camera UI.

## Conventie setup

Voor gebruik op een conventie (HMIA, Anime Con, DCC, etc.):

1. Sluit een externe camera aan (Elgato, Logitech, etc.)
2. Open de app in Chrome/Edge fullscreen (F11)
3. De app detecteert automatisch externe camera's en schakelt mirroring uit
4. Bezoekers drukken op de shutter-knop of tonen een peace sign

## Environment Variables

Zie ook .env.example voor een complete template.

| Variable | Beschrijving |
|----------|-------------|
| `NEXT_PUBLIC_DISCORD_WEBHOOK_URL` | Discord webhook URL voor foto-uploads |
| `NEXT_PUBLIC_BASE_PATH` | Base path voor deployment (optioneel, bijv. /dac-picture-app) |
| `GITHUB_ACTIONS` | CI indicator gebruikt in deployment context |

## Deployment

### GitHub Pages

Automatisch gedeployed via GitHub Actions bij push naar `main`.

**Setup:**
1. Ga naar repository **Settings** > **Pages**
2. Zet **Source** op **GitHub Actions**
3. Push naar `main`

## DAC Kleuren

| Kleur | Hex |
|-------|-----|
| Gold | `#e6c189` |
| Cream | `#F0EAD2` |
| Purple | `#6d41e7` |

## License

Intern project van Dutch Anime Community.
