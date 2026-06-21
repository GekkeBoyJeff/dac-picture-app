# Remote → /admin redesign

**Datum:** 2026-06-21
**Status:** ontwerp (goedgekeurd) — vervangt de QR/room-code-aanpak uit 2026-06-20
**Component:** de op-afstand-bediening van de DAC photobooth

## Probleem (uit gebruikerstest)
- Sluiten + heropenen van de remote → "bezet", niet meer te verbinden. Oorzaak: de **owner-lock** in `useRemoteHost` weigert een nieuwe client zolang de oude "owner" niet via een (vertraagde/uitblijvende) presence-leave is vrijgegeven — de owner-check short-circuit vóór de token-check.
- De flows zijn niet doordacht: knoppen zonder werkende vervolgactie (gallerij openen zonder kunnen bladeren).
- Te complex: QR + room-code + token + goedkeuring.

## Beslissingen
- **`/admin` + wachtwoord** i.p.v. QR/room-code. Wachtwoord typen (onthouden in `sessionStorage`) → verbonden.
- **Eén vast kanaal** (`FIXED_CHANNEL`), booth **altijd aan** (luistert zodra de app draait). Geen Remote-knop/QR/modal op de booth.
- **Geen owner-lock, geen goedkeuring, geen presence** → sluiten/heropenen werkt altijd.
- **Volledige gallerij-bediening** vanaf `/admin`: openen + vorige/volgende + sluiten; foto's op het booth-scherm; telefoon toont "Foto X / N".
- Beveiliging = wachtwoord (operator-only, zit in de bundle — geaccepteerd). De booth voert alleen commando's uit met het juiste wachtwoord meegestuurd.

## Architectuur
```
 /admin (telefoon)            Supabase Realtime              booth (PhotoBooth)
 useRemoteController  ── broadcast: cmd {pw, cmd} ─────────▶  useRemoteHost (always on)
                      ◀─ broadcast: state {payload} ───────  (uiStore + gallery state)
                      ── broadcast: hello {pw} ────────────▶  (op connect → volledige state terug)
 kanaal: FIXED_CHANNEL (vast); beide praten WSS naar Supabase
```

## Protocol (`src/lib/remote/protocol.js`)
- Toevoegen: `FIXED_CHANNEL` (vaste kanaalnaam).
- Behouden: `PROTOCOL_VERSION`, `tokenMatch` (voor wachtwoordvergelijk), `pickStatePayload`, `mergeRemoteState`, `validateCommand`.
- Verwijderen (niet meer nodig): `channelName`, `generateRoomCode`, `normalizeCode`, `CODE_LEN`, `generateClientId`.
- `validateCommand` uitbreiden met gallerij-commando's: `gallery:open`, `gallery:next`, `gallery:prev`, `gallery:close` (geen params).
- Wire-events: `hello {pw, v}` (controller→booth, vraag om sync), `cmd {pw, cmd, v}` (controller→booth), `state {payload, v}` (booth→controller).

## State (`uiStore`)
- Toevoegen: `galleryLightboxIndex` (`null` = grid/dicht, getal = lightbox op die index) + acties `openGalleryLightbox(i=0)`, `setGalleryLightboxIndex(i)`, `galleryNext(count)`, `galleryPrev()`, `closeGallery()`.
- Verwijderen: `remoteActive` / `setRemoteActive` (geen Remote-knop meer). `remoteConnected` blijft optioneel (booth toont 'm niet meer).
- Booth-state payload = `pickStatePayload(ui)` + `{ galleryOpen: modals.gallery, galleryIndex: galleryLightboxIndex, galleryCount: galleryStore.photos.length }`.

## Booth host (`useRemoteHost`) — vereenvoudigd
- Altijd verbonden met `FIXED_CHANNEL` (geen `enabled`-gating nodig; draait zolang geconfigureerd).
- Op `hello`/`cmd`: verifieer `pw` (constant-time) tegen `NEXT_PUBLIC_REMOTE_PASSWORD`; negeer anders. Geen owner/approval.
- `hello` → stuur direct een volledige state-snapshot.
- `cmd` → `validateCommand` → `applyCommand` (incl. gallerij-acties).
- Broadcast state gedebounced bij elke `uiStore`- én `galleryStore`-wijziging.
- Geen presence, geen `occupied`/`granted`/`denied`/`awaiting`.

## Controller (`useRemoteController`) — vereenvoudigd
- Verbind met `FIXED_CHANNEL`; op `SUBSCRIBED` → stuur `hello {pw}`.
- Statussen: `connecting` → `connected` (bij eerste `state`), `reconnecting` (CHANNEL_ERROR/TIMED_OUT), `error-config` (env mist), `error-timeout` (geen state binnen 10s). Retry-knop.
- `send(cmd)` → broadcast `cmd {pw, cmd}`; echo-guard via `mergeRemoteState` blijft.
- Geen token/clientId/owner-states.

## Commands (`applyCommand`)
- Toevoegen: `gallery:open` → `openModal("gallery")` + `openGalleryLightbox(0)`; `gallery:next` → `galleryNext(count)`; `gallery:prev` → `galleryPrev()`; `gallery:close` → `closeGallery()` + `closeModal("gallery")`.

## Gallery (`Gallery.jsx`)
- Lightbox wordt **index-gestuurd** uit `uiStore.galleryLightboxIndex` (i.p.v. interne `lightboxPhoto`): toont `photos[index]`, laadt blob bij index-wijziging, met ◀ ▶ knoppen (lokaal) die `galleryPrev/galleryNext` aanroepen. Thumbnail-klik → `setGalleryLightboxIndex(i)`. Verwijderen-flow blijft.

## /admin pagina (`src/app/admin/page.jsx`, vervangt `/remote`)
- Wachtwoordpoort (sessionStorage `dac_admin_auth`), dan `AdminPanel`. Geen room-code-invoer.
- "Niet geconfigureerd"-scherm als Supabase-env mist.

## AdminPanel (`RemotePanel` herzien)
- Header: verbindingsstatus + retry + **live booth-status** ("Klaar / Aftellen… / Vastleggen…").
- Primair: grote **📸 Foto nemen** — alleen actief bij appState "camera" (idle/klaar); toont anders de bezig-status.
- Snelle toggles: flits, strip, handgebaren.
- Scène-preset + energiepreset.
- **Gallerij-sectie**: Openen → ◀ Vorige / Volgende ▶ → Sluiten; toont "Foto X / N" uit de booth-state.
- Geavanceerd (ingeklapt): debug, low-power, gevoeligheids-sliders.
- Mobile-first, geverifieerd met screenshot.

## Te verwijderen
- `src/components/camera/RemoteConnectModal.jsx`, de Remote-knop in `ControlBar.jsx`, `remoteActive`-bedrading in `PhotoBooth.jsx`, `src/app/remote/`.

## Config
- `NEXT_PUBLIC_REMOTE_PASSWORD` terug in `.env.example` + `deploy.yml` (als repo Variable; publiek/operator-only). Supabase-vars blijven.

## Tests
- Unit: `validateCommand` (gallerij-commando's erbij, junk geweigerd), `pickStatePayload`, `mergeRemoteState`, `tokenMatch`. Protocol-test bijwerken (verwijderde functies eruit).
- Verificatie: lint, vitest, build, + Playwright-screenshot van `/admin` (responsive + layout).

## Succescriteria
1. `/admin` → wachtwoord → verbonden; sluiten/heropenen verbindt altijd opnieuw (geen "bezet").
2. Foto nemen werkt en blokkeert tijdens aftellen/vastleggen.
3. Gallerij: openen + bladeren (booth-scherm) + sluiten, met "Foto X / N" op de telefoon.
4. Toggles/presets sturen de booth en koppelen terug.
5. Responsive (screenshot-geverifieerd). Geen QR/room-code/owner-lock meer.
