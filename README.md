# DAC Photo Booth

Photo booth PWA voor de **Dutch Anime Community**. Maakt foto's met live camera overlays (mascots, logo, QR-code, conventie-banners) en stuurt ze naar Discord zodat bezoekers lid worden van de community.

## Features

- **Live camera** met device-selectie, mirroring en zoom-reset
- **Overlay systeem** — corners, logo, mascot, QR-code, titel, datum, vignetten met responsive breakpoints
- **Canvas compositing** — foto = video + overlays via DOM-meting
- **Discord webhook** — automatisch verzenden met offline queue, exponential backoff en 429 rate limit handling
- **Hand gesture herkenning** — MediaPipe peace sign, gesture sequences, palm swipe navigatie
- **Gallerij** — tot 20 foto's in IndexedDB met lightbox
- **PWA** — installeerbaar, service worker, offline support
- **Conventies** — datum-gebaseerde banners (HMIA, AnimeCon, DCC)
- **Analytics** — lokale KPI tracking met CSV export
- **i18n** — Nederlands / Engels

## Tech Stack

| | |
|---|---|
| Framework | Next.js 16 (App Router, static export) |
| UI | React 19, Tailwind CSS 4 |
| State | Zustand (5 stores) |
| Storage | IndexedDB (idb-keyval) + localStorage |
| AI/Vision | MediaPipe Tasks Vision (lazy loaded) |
| Tests | Vitest + Testing Library |
| Linting | ESLint 9 + Prettier |

## Quickstart

```bash
npm install
npm run dev
```

Maak een `.env.local` aan:

```
NEXT_PUBLIC_DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
```

## Scripts

| Script | Beschrijving |
|--------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Static export naar `out/` |
| `npm run lint` | ESLint check |
| `npm run format` | Prettier formatting |
| `npm test` | Unit tests (Vitest) |

## Projectstructuur

```
src/
├── app/                    # Next.js App Router
├── components/
│   ├── camera/             # CameraView, Overlays, CaptureButton, ControlBar
│   ├── capture/            # Countdown, FlashEffect
│   ├── gallery/            # Gallery + Lightbox (IndexedDB)
│   ├── gestures/           # GestureIndicator, SequenceHint, HandBox
│   ├── pickers/            # MascotPicker, LayoutPicker, LayoutSlider
│   ├── drawers/            # SettingsDrawer, AboutDrawer, AnalyticsDashboard
│   ├── pwa/                # InstallBanner, ServiceWorkerRegistrar
│   └── ui/                 # BottomDrawer, Spinner, icons
├── stores/                 # Zustand (camera, overlay, ui, gallery, sendQueue)
├── hooks/                  # useCamera, useHandGesture, useGestureSequence, etc.
└── lib/
    ├── canvas/             # compositePhoto pipeline
    ├── config/             # presets, overlays, constants
    ├── discord/            # sendToDiscord, sendQueue
    ├── storage/            # localStorage, indexedDb, analytics
    └── i18n/               # t(), nl/en
```

## Deployment

Automatisch via GitHub Actions naar GitHub Pages bij push naar `main`.

## Auteur

**Jeffrey Ullers** — [jeffreyullers.nl](https://www.jeffreyullers.nl)

## Licentie

All rights reserved. Zie [LICENSE](LICENSE).