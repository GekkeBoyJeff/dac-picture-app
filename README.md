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

### Hoe het werkt

De app draait als een **state machine** in `PhotoBooth.tsx` met vier toestanden:

```
camera → countdown → capturing → sending → camera
```

1. **Camera** — Live video feed met overlays. Gebruiker drukt op de capture-knop of toont een peace sign.
2. **Countdown** — 5 seconden aftellen met optionele "kijk naar de camera" prompt.
3. **Capturing** — Flash-effect speelt af, foto wordt gecomposeerd op een canvas.
4. **Sending** — Foto wordt opgeslagen in de gallery en naar Discord gestuurd.

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
sendToDiscord(exportBlob) → Discord webhook
    ↓
Toast notificatie → terug naar camera state
```

---

## Projectstructuur

```
src/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # Rendert PhotoBooth component
│   ├── layout.tsx                # Root layout, PWA metadata, error boundary
│   └── api/send-photo/route.ts   # Server-side Discord webhook endpoint
│
├── components/
│   ├── PhotoBooth.tsx            # Centrale orchestrator (state machine + alle hooks)
│   ├── BottomDrawer.tsx          # Herbruikbare bottom drawer modal
│   ├── Countdown.tsx             # Afteltimer voor foto-capture
│   ├── Gallery.tsx               # Fotogalerij met lightbox viewer
│   ├── FlashEffect.tsx           # Wit flash-effect bij capture
│   ├── InstallBanner.tsx         # PWA installatie-prompt
│   ├── icons.tsx                 # SVG icon componenten
│   │
│   └── camera/
│       ├── CameraView.tsx        # Hoofd layout container (video + overlays + controls)
│       ├── Overlays.tsx          # Alle visuele overlays bovenop video feed
│       ├── ControlBar.tsx        # Verticale control panel (rechts)
│       ├── CaptureButton.tsx     # Shutter knop met pulse-animatie
│       ├── LayoutPicker.tsx      # Layout selectie drawer
│       ├── MascotPicker.tsx      # Mascot selectie drawer
│       ├── AppQrModal.tsx        # QR-code modal
│       └── GestureIndicator.tsx  # Indicator voor herkend handgebaar
│
├── hooks/
│   ├── useCamera.ts              # Camera stream, device enumeration, mirroring
│   ├── useHandGesture.ts         # MediaPipe hand gesture herkenning
│   ├── useOverlaySettings.ts     # Layout/mascot selectie + localStorage persistentie
│   ├── useGallery.ts             # Lokale foto-opslag in localStorage (max 20)
│   ├── useInstallPrompt.ts       # PWA install prompt management
│   └── useToast.ts               # Toast notificatie systeem
│
└── lib/
    ├── compositePhoto.ts         # Video frame + overlays → canvas → data URL
    ├── sendToDiscord.ts          # Foto naar Discord via webhook
    ├── types.ts                  # Gedeelde TypeScript types
    └── config/
        ├── index.ts              # Re-exporteert alle config + app constanten
        ├── overlays.ts           # Asset paden (corners, logo, QR)
        └── presets.ts            # Layouts, mascots, conventies met datumbereiken

public/
└── overlays/
    ├── mascots/                  # Mascot afbeeldingen (Amelia varianten)
    ├── conventions/              # Conventie assets per slug (hmia-2026/, dcc-2026/, etc.)
    ├── logo.png                  # DAC logo
    ├── corner-*.svg              # Hoekdecoraties
    └── qr-*.svg                  # QR codes
```

---

## Kerncomponenten in detail

### `PhotoBooth.tsx` — De orchestrator

Het centrale component dat alle hooks initialiseert en de app-state beheert. Coördineert de flow tussen camera, countdown, capture en sending. Alle user-interacties (knopdrukken, gestures) worden hier afgehandeld.

### `CameraView.tsx` — Camera layout

Geeft het video-element weer met alle overlays en UI-controls eroverheen. Is gememoized om onnodige re-renders te voorkomen terwijl de videostream actief is.

### `Overlays.tsx` — Visuele overlay laag

Rendert alle decoratieve elementen bovenop de video feed:
- **Vignettes** — CSS-gradiënten voor donkere randen
- **Corners** — Decoratieve hoekelementen
- **Mascot** — Geselecteerd mascot-karakter
- **Conventie banner** — Alleen zichtbaar als vandaag binnen de conventiedatums valt
- **Logo, titel, QR-code, datum** — Gepositioneerd volgens het actieve layout-preset

Gebruikt responsive breakpoints (sm/md/lg) gebaseerd op de kleinste viewport-dimensie.

### `compositePhoto.ts` — Foto-compositing

Leest de posities van DOM-elementen en tekent alles op een canvas:
1. Video frame (gecropped met object-cover logica)
2. Vignettes (procedurele gradiënten)
3. Alle overlay-afbeeldingen (met caching)
4. Titel en datum tekst met schaduwen
5. Exporteert als data URL (max 1920×1080 op mobiel)

### `useCamera.ts` — Camera management

Beheert camera-stream, permissies en device-enumeratie. Detecteert automatisch front/back camera's en externe apparaten. Schakelt mirroring uit voor externe/back camera's. Handelt oriëntatie-wisselingen af.

### `useHandGesture.ts` — Gesture herkenning

Gebruikt MediaPipe Vision voor continu hand gesture detectie:
- **Peace sign (Victory)** — 3 opeenvolgende detecties nodig → start countdown
- Elke 500ms een check, met confidence threshold van 0.3

### `useOverlaySettings.ts` — Overlay voorkeuren

Beheert layout- en mascotselectie. Slaat keuzes op in localStorage zodat ze bewaard blijven. Bepaalt ook welke conventie actief is op basis van de huidige datum.

### Config (`presets.ts`)

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
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
```

### Production Build

```bash
npm run build
```

## Nieuwe conventie toevoegen

1. Maak een map: `public/overlays/conventions/<slug>/`
2. Voeg de conventie-banner afbeelding toe
3. Voeg een entry toe aan `src/lib/config/presets.ts` met datumbereik en asset-pad

De conventie-overlay verschijnt automatisch tijdens de opgegeven datums.

## Nieuwe mascot toevoegen

1. Voeg de afbeelding toe aan `public/overlays/mascots/`
2. Voeg een entry toe aan `src/lib/config/presets.ts`

Gebruikers kunnen de mascot selecteren via de mascot picker in de camera UI.

## Conventie setup

Voor gebruik op een conventie (HMIA, Anime Con, DCC, etc.):

1. Sluit een externe camera aan (Elgato, Logitech, etc.)
2. Open de app in Chrome/Edge fullscreen (F11)
3. De app detecteert automatisch externe camera's en schakelt mirroring uit
4. Bezoekers drukken op de shutter-knop of tonen een peace sign

## Environment Variables

| Variable | Beschrijving |
|----------|-------------|
| `DISCORD_WEBHOOK_URL` | Discord webhook URL voor foto-uploads |
| `NEXT_PUBLIC_BASE_PATH` | Base path voor deployment (optioneel, bijv. `/dac-picture-app`) |

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
