# Remote control rebuild — Supabase Realtime

**Datum:** 2026-06-20
**Status:** ontwerp (te reviewen)
**Component:** de "op afstand bestuurbare pagina" (`/remote`) van de DAC photobooth

---

## 1. Context & probleem

De photobooth is een Next.js 16 app, **statisch geëxporteerd** (`output: "export"`) en gehost op **GitHub Pages** (`basePath /dac-picture-app`). Er is dus **geen server-runtime**.

De huidige remote-feature gebruikt **PeerJS/WebRTC**: de booth registreert een vaste peer-id op de gratis publieke PeerJS-broker, toont een QR, en stuurt na auth de camera-stream + commando's peer-to-peer naar een telefoon. Een audit (zie sessie) bevestigde dat dit structureel onbetrouwbaar is:

1. **Cross-network video valt stil** — de enige TURN-relay (`openrelay.metered.ca`, publieke creds) is opgeheven; precies in het event-scenario (telefoon op 4G, booth op venue-wifi = symmetrische NAT) is TURN verplicht voor media.
2. **Camera-stream bevriest** na elke camera-herstart (stream wordt by-value één keer doorgegeven).
3. **Geen echte reconnect** — één wifi-hapering = sessie dood; `connecting` kan oneindig hangen.
4. **Auth effectief uitgeschakeld** — commit `c1eff4c` maakte het token optioneel; iedereen die de 4-char code raadt krijgt volledige controle.
5. Plus: elke nieuwe verbinding gooit de actieve telefoon eruit; protocol is op 4 plekken handmatig gedupliceerd; fragiele routing.

**Grondoorzaak:** een statische app zonder server leunde op gratis publieke infra (PeerJS-broker + publieke TURN) alsof die betrouwbaar was.

## 2. Eisen & beslissingen (door de eigenaar bevestigd)

| Eis | Beslissing |
|---|---|
| Hosting | Frontend blijft 100% static op GitHub Pages |
| Live video op telefoon | **Vervalt volledig** — alleen bediening |
| Netwerk | Telefoon en booth zitten op **verschillende netwerken** (cross-network is kerneis) |
| Wie bedient | **Alleen operator/staff** |
| Transport | **Supabase Realtime** (Broadcast + Presence) |

**Kernredenering:** zonder video vervalt de bestaansreden van WebRTC (lage-latency P2P media). Voor kleine JSON-commando's levert P2P niets op en kost het alleen de onbetrouwbare broker + TURN. Maar omdat de apparaten op verschillende netwerken zitten en er geen eigen server is, is *een* extern doorgeefpunt onvermijdelijk. Supabase Realtime is precies dat doorgeefpunt en **vervangt zowel de PeerJS-broker als TURN** door één betrouwbare dienst. Beide apparaten praten enkel WSS naar Supabase → geen NAT/STUN/TURN meer.

## 3. Architectuur

```
 ┌─────────────┐         Supabase Realtime          ┌─────────────┐
 │   BOOTH      │   kanaal: dac-remote-<CODE>        │  TELEFOON   │
 │ useRemoteHost│ ───────── broadcast/presence ───── │useRemoteCtrl│
 │              │   (WSS naar *.supabase.co)         │   /remote   │
 └─────────────┘                                     └─────────────┘
   commando's ←──────────────────────────────────────  cmd
   state      ──────────────────────────────────────→  state
```

- Beide joinen hetzelfde **broadcast-kanaal** `dac-remote-<CODE>`.
- **Ephemeral broadcast + presence** — géén database, géén tabellen, géén RLS. De publieke (publishable) key volstaat voor publieke kanalen.
- Booth-config: `broadcast: { self: false }` (eigen berichten niet terugontvangen), presence aan.
- Supabase-project: `dac-photobooth-remote` (`https://wmmugadkmfcfkiiyntye.supabase.co`), key `sb_publishable_...`.

## 4. Gedeeld protocol (`src/lib/remote/protocol.js`)

Eén bron van waarheid, geïmporteerd door booth én telefoon. Beëindigt de viervoudige duplicatie (`usePeerHost`/`usePeerRemote`/`RemotePanel`/`uiStore.partialize`).

Bevat:
- `PROTOCOL_VERSION` (number) — meegestuurd in `hello`/`state`; bij mismatch toont de telefoon "ververs de pagina" i.p.v. opaak falen (relevant door service-worker stale-caching).
- `CHANNEL_PREFIX = "dac-remote-"`, `channelName(code)`.
- `generateRoomCode()` — 6 tekens uit het ondubbelzinnige alfabet `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (≈ 887M combinaties) via `crypto.getRandomValues`.
- `generateToken()` — 192-bit, base64url (bestaand patroon).
- `tokenMatch(a,b)` — constante-tijd vergelijk (bestaand).
- `pickStatePayload(state)` — de wire-shape (huidige velden).
- **`validateCommand(msg)`** — pareert + **clampt/valideert** elk inkomend commando tegen de toegestane waarden uit `settingsPresets` (numHands ∈ handOptions, confidences/triggerMinScore ∈ [0,1], intervals/hold tegen presets/grenzen). Retourneert een veilig commando of `null`. Vervangt het blind vertrouwen op `msg.value` in de oude `applyCommand`.

**Berichttypes**

| Richting | Type | Velden | Doel |
|---|---|---|---|
| 📱→booth | `hello` | `token?`, `v` | aanmeldhandshake (token uit QR, of leeg bij handmatig) |
| 📱→booth | `cmd` | `cmd:{t,...}` | bediening (zie hieronder) |
| booth→📱 | `granted` | — | aanmelding geaccepteerd |
| booth→📱 | `denied` | — | handmatige aanmelding geweigerd door operator |
| booth→📱 | `occupied` | — | er is al een actieve controller |
| booth→📱 | `state` | `payload`, `v` | gedebounced + gediffed booth-state |

**Commando's (`cmd.t`)** — semantiek ongewijzigd t.o.v. nu: `trigger`, `toggle{key}`, `set{key,value}`, `preset:scene{id}`, `preset:gesture{interval,score}`, `preset:hold{ms}`, `preset:highPower`, `preset:lowPower`, `modal{name}`.

## 5. Verbinding & betrouwbaarheid

- **Auto-reconnect** door de Supabase-client. Statussen worden afgeleid uit de `subscribe`-callback (`SUBSCRIBED` / `CHANNEL_ERROR` / `TIMED_OUT` / `CLOSED`).
- **Telefoon-statussen:** `idle · connecting · awaiting-approval · connected · reconnecting · denied · occupied · error-config · error-timeout`. Elk met eigen tekst + een **retry-knop**. Een **connect-timeout (10s)** voorkomt oneindig "Verbinden…".
- **Booth-statussen:** `idle · waiting · awaiting-approval · connected · error`. De QR-modal toont een betekenisvolle status (incl. "Supabase niet bereikbaar/niet geconfigureerd").
- **State-sync:** booth abonneert op `uiStore`; bij wijziging `pickStatePayload` berekenen, **shallow-diffen** t.o.v. laatst verzonden, **debouncen (~60ms)**, dan broadcasten. Bij een nieuw geautoriseerde controller direct een volledige snapshot sturen.
- **Slider-fight voorkomen:** de telefoon past sliderwaarden **optimistisch lokaal** toe, **debounced** uitgaand (~80ms), en **negeert inkomende state voor dat veld** kort na een eigen wijziging (~400ms).

## 6. Beveiliging (operator-only)

- **QR-pad:** `/remote?r=<CODE>&k=<TOKEN>` → telefoon stuurt `hello{token}` → booth `tokenMatch` → **direct `granted`** (operator scande zelf).
- **Handmatige code:** `hello` zonder token → booth zet status `awaiting-approval` en toont **één "Telefoon wil verbinden — toestaan?"-prompt**; operator tikt akkoord → `granted`, of weiger → `denied`. Een geraden code geeft dus nóóit controle zonder fysieke tik op de booth.
- **Single-owner via Presence:** de eerste geautoriseerde controller is "owner"; latere controllers krijgen `occupied` en hun commando's worden genegeerd. Geen stille eviction meer.
- **Goedkeuringsprompt is een losstaand overlay** (niet gekoppeld aan de QR-modal): omdat `remoteActive` de host levend houdt terwijl de QR-modal verborgen kan zijn, moet een handmatige aanmelding ook dán zichtbaar om goedkeuring vragen.
- **Wachtwoordpoort (`RemotePasswordGate`, `NEXT_PUBLIC_REMOTE_PASSWORD`) vervalt** — was schijnveiligheid (leesbaar in de bundle). Token + booth-goedkeuring zijn de echte poort.
- 6-char code (≈ 887M) maakt blind raden onpraktisch; de goedkeuringsstap is de harde poort.

## 7. Bestandsplan

**Verwijderen**
- `src/hooks/usePeerHost.js`, `src/hooks/usePeerRemote.js`
- `src/lib/webrtc/iceServers.js` (+ map `src/lib/webrtc/`)
- `src/components/remote/CameraPreview.jsx` (geen video meer)
- `src/components/remote/RemotePasswordGate.jsx`

**Nieuw**
- `src/lib/remote/protocol.js` — gedeeld protocol + validatie (§4)
- `src/lib/remote/supabase.js` — client-singleton (lazy) + `isRemoteConfigured()`
- `src/hooks/useRemoteHost.js` — booth: join, presence/owner, ontvang `cmd`, broadcast `state`, goedkeuring
- `src/hooks/useRemoteController.js` — telefoon: join, `hello`, verstuur `cmd`, ontvang `state`, statussen/timeout/retry
- `public/.nojekyll` — borgt dat `_next/*`-assets op Pages geserveerd blijven
- `src/__tests__/remoteProtocol.test.js` — unit-tests voor §4

**Wijzigen**
- `src/components/PhotoBooth.jsx` — `usePeerHost` → `useRemoteHost` (return-shape `{ roomCode, token, status, pendingApproval, approve, deny }`); `remote:trigger`-event blijft; losstaande approval-prompt tonen wanneer `pendingApproval`
- `src/components/camera/RemoteConnectModal.jsx` — QR `?r&k`, room-code, nieuwe statussen, approval-knoppen; geen video-aannames
- `src/app/remote/page.jsx` — wachtwoordpoort eruit; `r`/`k` uit URL; handmatige code; `RemotePanel` zonder `stream`
- `src/components/remote/RemotePanel.jsx` — `CameraPreview`/`stream` eruit; scene-selectie tonen (nu hardcoded `false`); slider-debounce; retry-/statusekanten
- `.env.example` — Supabase-vars i.p.v. wachtwoord
- `.github/workflows/deploy.yml` — Supabase-env (publieke waarden, inline of repo-*Variables*); `NEXT_PUBLIC_REMOTE_PASSWORD` eruit
- `package.json` — `@supabase/supabase-js` toevoegen, `peerjs` verwijderen

## 8. Config & graceful degradation

- Vars (publiek, mogen in de bundle): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Lokaal al gezet in `.env.local`.
- **`isRemoteConfigured()`**: ontbreken de vars, dan toont de Remote-knop/modal "Remote niet geconfigureerd" i.p.v. stil te falen.
- `deploy.yml`: waarden zijn publiek → opgeslagen als repo **Variables** (`vars.NEXT_PUBLIC_SUPABASE_URL`, `vars.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`), géén Secret. Consistent met het bestaande patroon in de workflow; de operator voegt deze twee Variables eenmalig toe in GitHub → Settings → Secrets and variables → Actions → Variables.

## 9. Routing-hardening

- `public/.nojekyll` toevoegen (de enige routing-fix in scope): borgt dat onderstreepte `_next/*`-assets op GitHub Pages geserveerd worden, ongeacht Jekyll.
- QR blijft `/remote` (zonder trailing slash); GitHub Pages mapt dat naar `remote.html`. Een bredere `trailingSlash`-omzetting valt **buiten scope**.

## 10. Tests

- **Unit (Vitest):** `protocol.js` — codeformaat/lengte, token-format, `tokenMatch`, `pickStatePayload`-shape, en vooral `validateCommand` (geldige commando's door, NaN/negatief/te-groot/onbekende keys geweigerd of geclampt).
- Realtime-kanaal-logica achter een dunne, mockbare transport-grens houden zodat host/controller-gedrag testbaar is zonder echt netwerk.
- E2e over twee netwerken valt buiten scope (niet betrouwbaar te automatiseren); handmatige verificatie bij oplevering.

## 11. Buiten scope

- Live videopreview op de telefoon (verwijderd).
- Private channels + RLS (niet nodig voor operator-only).
- `trailingSlash`-routingomzetting.
- Multi-booth namespacing voorbij de random 6-char code.

## 12. Succescriteria

1. Telefoon op 4G bedient de booth op wifi betrouwbaar (trigger, toggles, presets, gallerij).
2. Een wifi-hapering herstelt vanzelf zonder page reload.
3. Een tweede telefoon kan de actieve sessie niet kapen.
4. Een geraden code geeft geen controle zonder booth-goedkeuring.
5. `peerjs` + `iceServers.js` zijn weg; `protocol.js` is de enige bron van het wire-contract.
6. Ontbrekende Supabase-config faalt zichtbaar, niet stil.
7. Het Supabase-project pauzeert niet tussen events zonder dat de operator iets hoeft te doen.

## 13. Keep-alive (pauzepreventie)

**Bevinding (geverifieerd, 2026):** free-tier projecten pauzeren na **7 dagen onafgebroken inactiviteit**; een gepauzeerd project **hervat niet automatisch** — herstellen is een handmatige 1-klik-actie in het dashboard (90-dagen-venster). Pro pauzeert nooit.

**Per scenario:**
- **Tijdens een event (1 dag / 1 weekend):** geen actie nodig — de 7-dagen-drempel wordt nooit gehaald.
- **Tussen events:** bij 7+ dagen niet-gebruik pauzeert het project → zonder keep-alive 1× handmatig herstellen vóór het volgende event.

**Subtiliteit:** de app gebruikt alleen Realtime (geen DB). Of Realtime-verkeer de pauze-timer reset is officieel niet bevestigd; de betrouwbare maatstaf is **database-activiteit**. Een keep-alive moet dus een echt DB/REST-verzoek doen.

**Oplossing (zero werk voor de operator):** een **GitHub Actions scheduled workflow** `.github/workflows/supabase-keepalive.yml` die 2× per week (`cron`) een mini-REST-`select` doet tegen een dummy-tabel `keepalive` (1 rij; RLS-policy: `select` voor `anon`). Dit reset de pauze-timer permanent.
- Gebruikt de publieke key (al als repo Variable); geen extra secret.
- De `keepalive`-tabel is de **enige** DB-usage en puur operationeel — niet betrokken bij de app-runtime (die blijft puur Realtime).
- Tabel + RLS-policy worden via een Supabase-migratie aangemaakt (kan via de MCP, geen handwerk voor de operator).
- **Caveat:** GitHub schakelt geplande workflows uit na 60 dagen zonder repo-commits. Bij maandenlange winterstop kan de cron stoppen → fallback = 1-klik restore vóór het event.

**Bestandsplan-aanvulling:** nieuw bestand `.github/workflows/supabase-keepalive.yml`; nieuwe migratie voor de `keepalive`-tabel.
