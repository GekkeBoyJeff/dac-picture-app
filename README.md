# DAC Photo Booth

Photo booth applicatie voor **Dutch Anime Community (DAC)** — gebouwd voor gebruik op conventies zoals HMIA (Heroes Made in Asia), Anime Con, en andere evenementen.

## Features

- **Live camera feed** met 16:9 aspect ratio en DAC branding overlays
- **Countdown timer** (3 seconden) met animatie
- **Flash effect** bij het maken van een foto
- **Photo compositing** — overlay graphics, tekst en branding worden in de foto verwerkt
- **Discord integratie** — foto's worden automatisch naar een Discord kanaal gestuurd
- **Lokale galerij** — foto's worden lokaal opgeslagen in de browser (max 20)
- **Multi-camera support** — schakel tussen aangesloten camera's
- **Automatische mirror detectie** — externe cameras worden niet gespiegeld

## Tech Stack

- [Next.js](https://nextjs.org/) 16
- [React](https://react.dev/) 19
- [TypeScript](https://www.typescriptlang.org/) 5
- [Tailwind CSS](https://tailwindcss.com/) 4

## Aan de slag

### Vereisten

- Node.js 20+
- npm

### Installatie

```bash
git clone https://github.com/GekkeBoyJeff/dac-picture-app.git
cd dac-picture-app
npm install
```

### Ontwikkeling

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in je browser. Sta cameratoegang toe wanneer gevraagd.

### Discord Webhook (optioneel)

Maak een `.env.local` bestand aan om foto's naar Discord te sturen:

```env
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
```

> Op GitHub Pages is de Discord functie niet beschikbaar (static hosting). Gebruik een eigen server of Vercel voor Discord integratie.

### Productie build

```bash
npm run build
```

## Deployment

### GitHub Pages

De app wordt automatisch gedeployed naar GitHub Pages via GitHub Actions bij elke push naar `main`.

**Setup:**
1. Ga naar repository **Settings** > **Pages**
2. Zet **Source** op **GitHub Actions**
3. Push naar `main` — de workflow bouwt en deployt automatisch

Live op: `https://gekkeboyjeff.github.io/dac-picture-app/`

### Conventie setup

Voor gebruik op een conventie (HMIA, Anime Con, etc.):

1. Sluit een externe camera aan (Elgato, Logitech, etc.)
2. Open de app in Chrome/Edge op volledig scherm (F11)
3. De app detecteert automatisch externe cameras en schakelt mirroring uit
4. Bezoekers drukken op de shutter knop om een foto te maken

## DAC Kleuren

| Kleur | Hex |
|-------|-----|
| Goud | `#e6c189` |
| Creme | `#F0EAD2` |
| Paars | `#6d41e7` |

## Licentie

Intern project van Dutch Anime Community.
