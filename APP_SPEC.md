# DAC Fotobooth — Volledige App Specificatie

## Wat is het

Een offline-first PWA fotobooth voor anime/comic conventions. Bezoekers maken foto's (single of 3-foto strip) die automatisch naar Discord worden gestuurd. Bediening via touchscreen of handgebaren (MediaPipe). Draait op kiosk-hardware (Raspberry Pi) en mobiele devices.

**Stack:** Next.js (static export) · React · Zustand · Tailwind · MediaPipe Vision · IndexedDB · Discord Webhook

**Taal:** UI-teksten zijn Nederlands. Code, comments en logs zijn Engels.

---

## Boot Sequence

De app doorloopt bij opstarten deze states:

```
HYDRATING → DEVICE_CHECK → DEVICE_PROMPT → CAMERA_STARTING → READY
                                                              ↓
                                                            ERROR
```

1. **HYDRATING** — Wacht op client-side hydration (SSR → client).
2. **DEVICE_CHECK** — Leest `dac-picture-app-device-profile-v2` uit localStorage.
3. **DEVICE_PROMPT** — Toont alleen bij eerste bezoek. Twee keuzes:
   - "PC, laptop of mobiel" → slaat `"standard"` op
   - "Raspberry Pi" → slaat `"raspberry-pi"` op en activeert low-power preset
4. **CAMERA_STARTING** — Start de camera stream.
5. **READY** — Camera draait, overlays worden zichtbaar, app is bruikbaar.
6. **ERROR** — Camera geweigerd of niet gevonden. Toont foutmelding met retry-knop.

---

## Hoofdscherm (Camera View)

Het hoofdscherm is een fullscreen camera viewfinder. De video vult het hele scherm. Hieroverheen liggen de volgende lagen:

### Overlays op de camera
Alle overlays zijn DOM-elementen die op de video geprojecteerd worden. Ze worden ook naar het canvas gekopieerd bij het maken van een foto.

- **4 hoek-SVGs** — decoratieve hoeken (top-left, top-right, bottom-left, bottom-right)
- **DAC logo** — SVG, positie afhankelijk van gekozen layout
- **Mascotte** — WebP afbeelding, positie en grootte afhankelijk van layout + mascotte-keuze
- **QR code** — SVG, positie afhankelijk van layout
- **Conventie-banner** — Alleen zichtbaar als er een actieve conventie is (op basis van datum). PNG of SVG.
- **Titel** — "DUTCH ANIME" / "COMMUNITY" (of andere tekst), als DOM spans
- **Datum** — Huidige datum in Nederlands formaat

### Besturingselementen
- **Capture button** — Groot (80px), midden-onder. Wit in normale modus, paars in strip-modus (toont "3" erin). Tappen start de countdown. Nogmaals tappen tijdens countdown annuleert.
- **Control bar** — Verticale balk rechts met icoon-knoppen (elk 48px):
  - Settings (tandwiel)
  - Galerij
  - Camera wisselen (alleen als er meerdere camera's zijn)
  - Layout kiezen (opent LayoutSlider)
  - Mascotte kiezen (opent MascotPicker)
  - Strip mode toggle (paars als actief)
  - Installeer (alleen als PWA installeerbaar is)
- **Offline badge** — Klein label linksboven als er geen internet is. Toont ook het aantal foto's in de wachtrij.
- **Upload status** — Gestapelde pill-indicatoren die verschijnen na elke foto. States per entry: "loading" (spinner), "success" (check), "queued" (wachtrij), "error" (kruis). Verdwijnen automatisch na 3 seconden.
- **Wachtrij-waarschuwing** — Verschijnt als er 5+ foto's in de wachtrij staan. Toont: "Wachtrij actief (N) — Foto's worden verstuurd zodra er verbinding is."
- **Toast** — Tijdelijke melding onderin. Kan een actie-knop hebben (bijv. "Ongedaan maken").

### Gesture-indicatoren (alleen als gebaren actief)
- **Hold progress ring** — Cirkel die vult terwijl je het victory-gebaar vasthoudt. Als de cirkel vol is, wordt de foto genomen.
- **Sequence hint** — Toont emoji's (👋✊) als je bezig bent met een gebarenreeks.
- **Hand bounding boxes** — Alleen in debug mode. Groen kader = tracking, blauw kader = gesture detection interval.

### Attract mode
Na 60 seconden zonder interactie (en geen handen zichtbaar) verschijnt een attract overlay:
- Grote tekst: "KOM OP DE FOTO"
- Subtitle: "PHOTO BOOTH"
- Camera feed blijft zichtbaar eronder
- Elke touch/pointer/key interactie reset de timer

---

## Capture Flow

### Single Photo
```
Trigger (touch of gesture hold)
  → App state: "countdown"
  → Countdown: 3, 2, 1 (met audio beeps)
  → App state: "capturing"
  → Als flash aan: wit scherm + shutter geluid → wacht op brightness detection → capture
  → Als flash uit: directe capture
  → compositePhoto(): video + vignettes + overlays → WebP blob
  → Sla op in galerij (IndexedDB)
  → Stuur naar Discord (of queue als offline)
  → App state: "camera"
```

### Strip Mode (3 foto's)
```
Strip mode inschakelen via control bar toggle
  → Capture button wordt paars met "3"
  → Strip frame overlay verschijnt (3 lege frames)

Trigger
  → Countdown → Capture foto 1 → frame 1 gevuld
  → Automatisch countdown → Capture foto 2 → frame 2 gevuld
  → Automatisch countdown → Capture foto 3 → frame 3 gevuld
  → 550ms pauze
  → compositeStrip(): 3 foto's + branding + mascotte + decoraties → strip blob
  → Sla strip + 3 individuele foto's op in galerij
  → Stuur strip naar Discord
  → Strip mode wordt automatisch uitgeschakeld
  → App state: "camera"
```

### Countdown
- 3 seconden aftellen. Elke seconde: audio beep (660Hz, 80ms).
- Laatste tel: hogere toon (1200Hz, 150ms).
- Optioneel: tekst "Kijk naar de webcam ↑" verschijnt.
- Tappen op capture button tijdens countdown annuleert alles.

### Flash
- Optioneel (toggle in settings, default: aan).
- Wit scherm, device vibratie (100ms), synthetisch sluitergeluid.
- Slim: meet camera-helderheid via 8×8 canvas. Zodra brightness jump > 0.12 → capture.
- Fallback: als de omgeving al helder is (baseline > 0.7) → vaste vertraging van 150ms.
- Noodstop: als er geen brightness change is binnen 300ms → capture toch.

---

## Foto Compositing

### Single Photo (canvas)
1. Video frame getekend op canvas (center-crop naar container aspect)
2. Canvas grootte gelimiteerd op basis van power mode (full: 2560×1440, low: 1920×1080)
3. Als camera mirrored: horizontale flip
4. Vignettes: radial (40% zwart in hoeken), gradient onder (45% hoogte, 50% zwart), gradient boven (20% hoogte, 40% zwart)
5. Overlay-elementen van DOM naar canvas gekopieerd (positie via getBoundingClientRect, geschaald)
6. Titel tekst uit DOM gelezen (niet hardcoded)
7. Datum tekst uit DOM gelezen
8. Export: WebP, 0.9 kwaliteit

### Strip (canvas, 1080×1920)
1. Achtergrond: #0a0a0a
2. 3 foto's gestapeld: elk 1000×460px, start y=36, gap 16px, border-radius 12px, center-cropped
3. QR code: 140×140px rechtsboven op eerste foto, 85% opacity. Tekst eronder: "Word lid\nvan DAC"
4. Decoraties in branding zone: 14 doodles (sterren, hartjes, cirkels, stippen) in accent kleur #e6c189
5. Branding zone (vanaf y=1460):
   - DAC logo: 100×100px
   - "Dutch Anime Community" — vet, 56px
   - Conventie naam (als actief) — medium, 38px, goud
   - Datum — regular, 32px, goud
   - Conventie banner (als actief) — max 420×140px
6. Mascotte: rechts uitgelijnd, onderaan, max 340×520px, 92% opacity, overlapt onderste foto
7. 5 sparkles op hoeken
8. Buitenste rand: 1px goud op 12%, 6px inset

---

## Conventie Systeem

Drie conventie's geconfigureerd met datum-ranges:

| Naam | Datums |
|------|--------|
| Heroes Made in Asia | 19-21 maart 2026 |
| AnimeCon | 17-19 april 2026 |
| Dutch Comic Con | 20-21 juni 2026 |

Elke conventie heeft een banner-afbeelding en positie-instellingen per breakpoint (sm/md/lg).

Detectie: vergelijk vandaag met start/end datums. Eerste match wint. Als geen match: geen conventie-specifieke elementen.

Wanneer actief:
- Banner verschijnt op camera overlay (positie per layout)
- Strip toont conventie-naam in branding zone + banner onder de datum

---

## Layout Systeem

Drie layouts bepalen waar alle overlay-elementen staan:

| Layout | Logo | Mascotte | QR | Conventie |
|--------|------|----------|-----|-----------|
| Classic | linksboven | rechtsonder | rechtsboven | linksonder |
| Flipped | rechtsboven | linksonder | linksboven | rechtsonder |
| Hero | linksboven | rechtsonder (groot) | rechtsboven | linksonder |

Elke layout definieert per element: positie, offset, grootte per breakpoint (sm/md/lg).

Breakpoints:
- sm: kleinste scherm-dimensie < 600px
- md: 600–1023px
- lg: ≥1024px
- Extra orientatie-suffix voor mascotte: "sm-landscape", "md-landscape"

Mascotte grootte-cascade: `layout.mascotOverrides[mascotId]` → `mascot.defaults` → `layout.mascot`

Gebruiker kiest layout via:
- **LayoutSlider** — horizontale carousel onderin, swipeable (touch + pointer + gesture)
- **LayoutPicker** — grid in een drawer

Keuze wordt opgeslagen in localStorage.

---

## Mascotte Systeem

Zes mascotte-varianten (allemaal WebP):

| ID | Naam | Sizing |
|----|------|--------|
| amelia | Amelia | op hoogte |
| amelia-v2 | Amelia v2 | op hoogte |
| amelia-beer | Amelia (Beer) | op hoogte |
| amelia-hug | Amelia (Hug) | op breedte |
| amelia-smile | Amelia (Smile) | op hoogte |
| amelia-beer-alt | Amelia (Beer Alt) | op hoogte |

Default: amelia.

Op de camera overlay: gepositioneerd via CSS, `object-fit: contain`, `pointer-events: none`.
Op de strip: geschaald naar max 340×520px (contain), rechts uitgelijnd, onderaan, 92% opacity.

Gebruiker kiest via MascotPicker (grid in drawer). Keuze opgeslagen in localStorage.

---

## Gesture Systeem

### Technologie
MediaPipe GestureRecognizer in een Web Worker. Probeert eerst GPU, fallback naar CPU.

### Detectie-loop
`requestAnimationFrame` loop op de main thread. Elk frame:
1. `createImageBitmap(video)` 
2. Transfer naar worker
3. Worker draait MediaPipe
4. Resultaten terug: gesture naam, landmarks, confidence

Configureerbaar interval (0–1200ms). "Busy" flag voorkomt overlap.

### Trigger-gebaren
`Victory`, `ILoveYou`, `Deuces` — boven triggerMinScore (default 0.25).
Extra geometrische check: alleen index + middelvinger uitgestoken.

### Hold-mechanisme
- Gebaar gedetecteerd → timer start
- Elke frame: check of gebaar nog zichtbaar (300ms grace period voor dropped frames)
- Progress ring vult zich
- Volledig vastgehouden → `onVictory()` → start capture

### Gebarenreeksen
- **Open layout slider:** Open_Palm → Closed_Fist → Open_Palm → Closed_Fist (200ms per stap, 5s timeout)
- **Sluit layout slider:** Open_Palm → Closed_Fist

### Gesture swipe (in layout slider)
- Open_Palm 500ms vasthouden → anker-positie palm X
- Hand naar links/rechts bewegen → delta
- 3% dead zone
- Loslaten: als delta > 25% van kaartbreedte → snap naar volgende/vorige layout

### Acties uitgeschakeld wanneer:
- App state niet "camera"
- Layout slider is open
- Strip capture is actief

---

## Discord Integratie

### Configuratie
Webhook URL via environment variable `NEXT_PUBLIC_DISCORD_WEBHOOK_URL`. Als niet gezet: stil overgeslagen.

### Bericht
```
📸 Nieuwe foto uit de photobooth! Welkom bij Dutch Anime Community! 🎉
Ga naar <#684064008827174930> om je te laten verifiëren en praat mee met de grootste anime community van de Benelux! 🚀
```
Foto als bijlage: `photobooth-{timestamp}.webp`

### Verzendflow
1. Als offline → direct naar wachtrij
2. POST multipart/form-data naar webhook
3. HTTP 429 (rate limit) → lees Retry-After header → wacht die tijd
4. HTTP 200 → klaar
5. Andere fout → naar wachtrij

### Wachtrij
Opgeslagen in IndexedDB. Elk item: `{ id, attempts, failed, lastAttempt }`.

Drain loop draait:
- Bij app start
- Bij `window.online` event
- Verwerkt één item tegelijk
- Respecteert retryAfterMs van rate-limit responses
- Exponential backoff: `min(1200 + attempts × 1200, 15000) + random(0–600)ms`
- Maximum 10 pogingen per item, daarna `failed = true`

---

## Galerij

- Foto's opgeslagen als blobs in IndexedDB, index als metadata-array
- Maximum 20 foto's. Oudste wordt eerst verwijderd.
- Thumbnails: laden on-demand, gecached als Object URLs, opgeruimd bij verwijdering/unmount
- Grid: 2 kolommen (sm), 3 (md), 4 (lg), 5 (xl)
- Lightbox: toon foto op volledige resolutie, verwijder-knop, sluiten-knop
- Verwijderen met undo: 5 seconden window, toast met "Ongedaan maken" knop. Als de timer afloopt wordt de foto definitief verwijderd.

---

## Settings

Alle instellingen worden opgeslagen via Zustand persist (localStorage).

### Basis tab
- **Flits** — Toggle (default: aan). Schermflits bij foto.
- **Handgebaren** — Toggle (default: uit). Geblokkeerd in low-power modus tenzij override actief.
- **Vasthoudtijd** — Hoe lang het gebaar vastgehouden moet worden: 0.5s / 1s / 1.5s / 2s / 3s (default: 1.5s)

### Geavanceerd tab — Power
- **Raspberry Pi mode** — Toggle. Activeert low-power preset.
- **Low-power override** — Ontgrendelt gebareninstellingen in low-power modus.
- **Debug mode** — Toont hand tracking bounding boxes en gesture info.

### Geavanceerd tab — Opstellingspresets
Batch-instellingen voor handen + confidence:

| Preset | Handen | Detectie | Presence | Tracking |
|--------|--------|----------|----------|----------|
| Conventie | 8 | 0.40 | 0.40 | 0.40 |
| Photobooth | 4 | 0.50 | 0.50 | 0.50 |
| Mobiel | 2 | 0.60 | 0.60 | 0.50 |
| Zuinig | 2 | 0.65 | 0.65 | 0.60 |

Handmatig: numHands (2/4/6/8/10/12), detectie/presence/tracking confidence sliders (0.2–0.9, stap 0.01)

### Geavanceerd tab — Gebarenpresets
| Preset | Interval | Score |
|--------|----------|-------|
| Realtime | 0ms | 0.25 |
| Gebalanceerd | 120ms | 0.35 |
| Spaarstand | 400ms | 0.50 |

Handmatig: interval slider (0–1200ms, stap 60), trigger score slider (0–1, stap 0.01)

### Geavanceerd tab — Info
- Debug kleur-legenda (groen/blauw kaders uitleg)
- Analytics dashboard (lazy loaded)

---

## Low-Power Mode

### Detectie
Automatisch als:
- ARM in user-agent of platform (Raspberry Pi, etc.)
- OF: deviceMemory ≤ 2 EN hardwareConcurrency ≤ 4
- OF: Battery API meldt ≤ 20% en niet aan het laden
- OF: WebGL renderer bevat "V3D" (Raspberry Pi GPU)

Handmatig: via "Raspberry Pi mode" toggle in settings.

### Wat verandert
- Camera resolutie: strip → 1280×720, single → 1920×1080 (niet ongelimiteerd)
- Canvas pixel budget: strip → 720p max, single → 1080p max
- Gesture interval: 400ms (niet realtime)
- Max handen: 2
- Confidence drempels: 0.65/0.65/0.60
- Gebaren toggle: geblokkeerd in UI (grayed out), tenzij low-power override aan
- Strip mode: uitgeschakeld
- Debug mode: uitgeschakeld

---

## Analytics

### Getrackte events
| Event | Data |
|-------|------|
| session_start | userAgent, screen afmetingen |
| photo_captured | trigger (touch/gesture), mode (single/strip), mascotId, layoutId |
| strip_completed | mascotId, layoutId |
| discord_sent | isStrip |
| discord_queued | isStrip |
| discord_failed | isStrip |

Opgeslagen in IndexedDB als `{ type, timestamp, ...data }`.

### Dashboard
Toont (lazy loaded in geavanceerde settings tab):
- Totaal aantal foto's (single vs strip uitsplitsing)
- Aantal strips
- Discord success rate (verstuurd/in wachtrij/mislukt)
- Gesture ratio (% gesture vs touch)
- Populairste mascotte en layout
- Piekuur
- Sessie-telling
- Verdeling per uur (24 bars)

### Export
CSV download met dynamische headers, ISO timestamps. Bestandsnaam: `dac-analytics-{datum}.csv`.

### Wissen
Alle analytics data verwijderen met één knop.

---

## PWA

### Manifest
Gegenereerd tijdens build (dynamisch op basis van basePath):
- name: "DAC Fotobooth"
- short_name: "Fotobooth"
- display: standalone
- orientation: any
- theme_color: #e6c189

### Service Worker
Hand-geschreven (geen Workbox). Version-keyed cache.

| Resource | Strategie |
|----------|-----------|
| App shell (HTML, JS, CSS) | Stale-while-revalidate |
| Overlay assets (SVG, WebP, PNG) | Cache-first |
| MediaPipe model + WASM | Cache-first |
| Geist font files | Precache bij install |
| version.json | Network-only, cache: no-store |
| gesture-worker.js | Altijd vers fetchen |
| Discord webhook | Network-only |

Install: precache alle overlay assets + root pagina. `skipWaiting()` pas NADAT cache compleet is.
Activate: verwijder oude caches.
Update check: bij laden + elke 30 minuten. Bij nieuwe versie: banner "Nieuwe versie beschikbaar — Tik om te updaten".

### Install prompt
- Android/desktop Chrome: vangt `beforeinstallprompt` event af, toont installeer-knop in control bar
- iOS: detecteert via user-agent, toont handmatige instructies
- Wegklikken wordt 7 dagen onthouden in localStorage
- Als al geïnstalleerd (standalone): nooit tonen

### Offline gedrag
- App laadt volledig uit cache
- Camera werkt gewoon
- Foto's worden opgeslagen in IndexedDB
- Discord verzending gaat naar de wachtrij
- Bij terugkeer van verbinding: wachtrij wordt automatisch leeggemaakt

---

## App States Overzicht

### appState (UI state machine)
```
"camera" → "countdown" → "capturing" → "camera"
                ↑               |
                |               ↓
              cancel        (strip: terug naar "countdown" als < 3 foto's)
```

### Modals (elk onafhankelijk open/dicht)
- gallery
- mascotPicker
- layoutPicker
- layoutSlider
- settings
- about

### Persisted state (overleeft pagina-herlaad)
- layoutId
- mascotId
- debugEnabled
- gesturesEnabled
- flashEnabled
- stripModeEnabled
- forceLowPower
- lowPowerOverride
- detectionIntervalMs
- triggerMinScore
- gestureHoldMs
- numHands
- minDetectionConfidence
- minPresenceConfidence
- minTrackingConfidence

### Niet-persisted state (reset bij herlaad)
- appState (reset naar "camera")
- modals (reset naar alles dicht)
- camera ready/error/mirrored/devices
- gallery photo index (hergeladen uit IndexedDB)
- send queue (hergeladen uit IndexedDB)
- idle timer
- gesture detection state

---

## Constanten

| Constante | Waarde |
|-----------|--------|
| Countdown seconden | 3 |
| Gesture hold duur (default) | 1500ms |
| Strip foto's | 3 |
| Strip canvas | 1080×1920 |
| Strip foto hoogte | 460px |
| Strip foto gap | 16px |
| Strip branding start Y | 1460px |
| Strip accent kleur | #e6c189 |
| Strip achtergrond | #0a0a0a |
| Strip logo grootte | 100px |
| Strip QR grootte | 140px |
| Strip mascotte max | 340×520px |
| Strip conventie banner max | 420×140px |
| Max galerij foto's | 20 |
| Export kwaliteit | 0.9 (WebP) |
| Toast duur | 1500ms |
| Toast met actie duur | 5000ms |
| Gesture sequence stap duur | 200ms |
| Gesture sequence timeout | 5000ms |
| Gesture swipe engage | 500ms |
| Gesture swipe dead zone | 3% |
| Gesture swipe snap drempel | 25% |
| Discord max retry | 10 |
| Discord backoff basis | 1200ms |
| Discord backoff maximum | 15000ms |
| Galerij undo window | 5000ms |
| Idle timeout | 60000ms |
| SW update check interval | 30 minuten |
| Install prompt dismiss | 7 dagen |

---

## Deployment

- Static export via `next build` → `/out/` directory
- Deploy naar GitHub Pages via GitHub Actions
- `basePath = "/dac-picture-app"` in CI, `""` lokaal
- Manifest en version.json gegenereerd tijdens build
- Enige environment variable: `NEXT_PUBLIC_DISCORD_WEBHOOK_URL`
