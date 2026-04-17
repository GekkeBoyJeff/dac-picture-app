# Future Scope — PRD, SEO & Tunnelvisie Roadmap

> Geschreven vanuit: CEO, Strategist, SEO Specialist, UX/UI Designer
> Datum: 2026-04-08

---

## DEEL 1: Product Requirements Document (PRD)

### Product

**DAC Fotobooth** — Een offline-first PWA fotobooth voor anime/comic conventions. Bediening via touch of handgebaren. Foto's worden automatisch naar een Discord-community gestuurd.

### Doelgroep

- **Primair:** Convention-bezoekers (13-35 jaar, cosplayers, anime fans)
- **Secundair:** Community-beheerders die engagement willen boosten
- **Tertiair:** Event-organisatoren die een interactieve attractie zoeken

### Huidige MVP Status

| Feature | Status | Kwaliteit |
|---------|--------|-----------|
| Camera capture (single) | ✅ Compleet | Solide |
| Camera capture (strip, 3 foto's) | ✅ Compleet | Solide |
| Hand gesture bediening | ✅ Compleet | Goed, maar complexe hook |
| Layout/mascot selectie | ✅ Compleet | Goed |
| Convention-based branding | ✅ Compleet | Goed |
| Canvas compositing + overlays | ✅ Compleet | Bug in title rendering |
| Discord webhook verzending | ✅ Compleet | Rate-limit bug |
| Offline queue met retry | ✅ Compleet | Dual-path architectuur issue |
| Local gallery (IndexedDB) | ✅ Compleet | Memory leak in thumbnails |
| PWA installeerbaar | ✅ Compleet | Manifest incompleet |
| Analytics dashboard | ✅ Compleet | Werkt |
| Low-power mode | ✅ Compleet | Werkt |
| Settings (gesture tuning) | ✅ Compleet | God-component |

### Wat ontbreekt voor "Ship-Ready" MVP

| # | Feature/Fix | Impact | Effort |
|---|-------------|--------|--------|
| 1 | Rate-limit fix (Discord 429) | Kritiek — kan Discord webhook blokkeren | S |
| 2 | Memory leak fix (Gallery) | Hoog — kiosk draait uren, geheugen groeit | S |
| 3 | Title rendering fix (canvas) | Hoog — output matcht niet met live preview | S |
| 4 | PhotoBooth + SettingsDrawer splitsen | Hoog — blokkeert feature-groei | M |
| 5 | Dead code opruimen (~323 LOC) | Medium — vermindert cognitive load | S |
| 6 | Manifest compleet maken | Medium — PWA install score | S |
| 7 | Service worker race fix | Medium — edge case bij first-install | S |

**S = Small (< 2 uur), M = Medium (2-4 uur), L = Large (4-8 uur)**

---

## DEEL 2: SEO & Metadata Strategie

### Huidige Status

```
✅ OpenGraph title + description
✅ Twitter card meta
✅ Theme color
✅ Apple web app config
✅ lang="nl"

❌ metadataBase (Next.js build warning)
❌ openGraph.images (geen preview bij link share)
❌ Structured data / JSON-LD
❌ robots.txt
❌ sitemap.xml
❌ Canonical URL
```

### Implementatieplan

#### 2.1 metadataBase + OG Image

```js
// src/app/layout.jsx — metadata object
export const metadata = {
  metadataBase: new URL("https://dutchanimecommunity.nl/dac-picture-app"),
  title: "DAC Fotobooth",
  description: "Maak foto's op anime conventions met de DAC Fotobooth",
  openGraph: {
    title: "DAC Fotobooth",
    description: "Maak foto's op anime conventions met de DAC Fotobooth",
    images: [
      {
        url: "/overlays/logo.png",
        width: 512,
        height: 512,
        alt: "DAC Fotobooth logo",
      },
    ],
    locale: "nl_NL",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    images: ["/overlays/logo.png"],
  },
}
```

#### 2.2 robots.txt + sitemap.xml

```
# public/robots.txt
User-agent: *
Allow: /
Sitemap: https://dutchanimecommunity.nl/dac-picture-app/sitemap.xml
```

```xml
<!-- public/sitemap.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemx.org/schemas/sitemap/0.9">
  <url>
    <loc>https://dutchanimecommunity.nl/dac-picture-app/</loc>
    <lastmod>2026-04-08</lastmod>
    <priority>1.0</priority>
  </url>
</urlset>
```

#### 2.3 JSON-LD Structured Data

```js
// src/app/layout.jsx
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "DAC Fotobooth",
      applicationCategory: "EntertainmentApplication",
      operatingSystem: "Any",
      offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
      description: "Interactieve fotobooth voor anime conventions",
      inLanguage: "nl",
    }),
  }}
/>
```

#### 2.4 Performance Eisen (Core Web Vitals targets)

| Metric | Target | Huidig risico |
|--------|--------|---------------|
| LCP | < 2.5s | Eager loading van alle drawers |
| FID/INP | < 200ms | MediaPipe init kan main thread blokkeren |
| CLS | < 0.1 | Goed — layout is stabiel |
| FCP | < 1.8s | Font niet geprecached |

**Acties:**
1. Lazy load drawers (SettingsDrawer, Gallery, AboutDrawer) → LCP verbetering
2. Precache Geist font in service worker → FCP verbetering
3. Code-split MediaPipe init path → INP verbetering

---

## DEEL 3: De Tunnelvisie Roadmap

> Geen ambiguïteit. Geen "misschien later". Dit is wat je doet, in deze volgorde.

### Sprint 1: Stabiliseren (Week van 8 april)

**Doel: Alle bugs fixen. Zero known defects.**

| Dag | Taak | Definition of Done |
|-----|------|--------------------|
| Di 8 apr | Fix Discord rate-limit (`sendQueue.js`) | 429 response → wacht `retryAfterMs` → retry succesvol |
| Di 8 apr | Fix Gallery memory leak | Open/sluit gallery 50x → geheugen stabiel (DevTools Memory tab) |
| Wo 9 apr | Fix canvas title rendering | Canvas output = DOM preview voor alle layouts |
| Wo 9 apr | Fix convention race in `stripBranding.js` | Convention resolved 1x, doorgegeven als parameter |
| Do 10 apr | Fix `ctx.save/restore` in strip capture | Mirror transform contained, geen state leakage |
| Do 10 apr | Fix manifest (icons, generated start_url) | Lighthouse PWA audit = 100 |
| Vr 11 apr | Fix SW race (`skipWaiting` na cache) | First-install offline test slaagt |

### Sprint 2: Opschonen (Week van 14 april)

**Doel: Dead code weg. God-components gesplitst. Schone basis.**

| Dag | Taak | Definition of Done |
|-----|------|--------------------|
| Ma 14 apr | Verwijder dead code (i18n, SplashOverlay, validate.js, etc.) | `grep` vindt geen referenties naar verwijderde exports |
| Ma 14 apr | Verwijder dode store getters + localStorage keys | Stores < 150 LOC elk |
| Di 15 apr | Unify send queue (één pad via store) | Geen duplicate ID generatie, store.queue altijd in sync |
| Di 15 apr | Extract `selectPendingCount` selector | Geen inline `.filter()` in consumers |
| Wo 16 apr | Split PhotoBooth.jsx → hooks | `PhotoBooth.jsx` < 200 LOC |
| Do 17 apr | Split SettingsDrawer.jsx → tab components | `SettingsDrawer.jsx` < 200 LOC, AnalyticsDashboard lazy |
| Vr 18 apr | Extract shared `LayoutPreviewBlock` | Eén component, 2 consumers |

### Sprint 3: Performance & DRY (Week van 21 april)

**Doel: Sneller. Minder herhaling. Production-grade.**

| Dag | Taak | Definition of Done |
|-----|------|--------------------|
| Ma 21 apr | Lazy load drawers (React.lazy + Suspense) | Initial JS bundle -30% (meten met `next build --analyze`) |
| Ma 21 apr | Tailwind theme tokens (text-label, surface-subtle, etc.) | Zero `[0.65rem]`-style arbitrary values |
| Di 22 apr | LayoutSlider px → rem | Geen `px` in non-canvas inline styles |
| Di 22 apr | Derive sparkle/doodle coords van STRIP_CANVAS constants | Coords schalen mee met canvas dimensies |
| Wo 23 apr | Split useHandGesture.js (360 → ~150 LOC) | 3 focused hooks, elk < 150 LOC |
| Do 24 apr | Precache fonts in SW + cache-bust version.json | Offline first-load toont correct font |
| Vr 25 apr | SEO: metadataBase, OG image, JSON-LD, robots.txt | Lighthouse SEO audit ≥ 90 |

### Sprint 4: AnimeCon Ready (Week van 26 april)

> AnimeCon 2026 = 17-19 april (VERLEDEN — als dit de juiste datum is).
> Pas deze sprint aan als AnimeCon nog komt.

**Doel: Convention-klaar. Getest op doelhardware.**

| Dag | Taak | Definition of Done |
|-----|------|--------------------|
| Ma 28 apr | E2E test: volledige capture flow (single + strip) | Playwright test groen |
| Di 29 apr | E2E test: offline → online queue drain | Queue leeg na reconnect |
| Wo 30 apr | Kiosk test op Raspberry Pi (4+ uur runtime) | Geheugen stabiel, geen crashes |
| Do 1 mei | Performance audit (Lighthouse + Chrome DevTools) | LCP < 2.5s, INP < 200ms |
| Vr 2 mei | **Ship it.** Tag v2.3.0. Deploy naar GitHub Pages. | Live. |

---

## DEEL 4: Na de MVP — Wat NIET Nu Doen

> Deze lijst bestaat zodat je er NIET aan begint. Parkeer het. Focus op de sprints hierboven.

| Feature | Waarom niet nu |
|---------|---------------|
| Multi-language (i18n) | Userbase is 99% NL. Bouw dit pas als er vraag is. |
| Video capture | Compleet andere pipeline. Na MVP evalueren. |
| Cloud storage (S3/R2) | Discord webhook werkt. Pas migreren bij schaalprobleem. |
| User accounts | Geen noodzaak voor een kiosk-app. |
| QR code scanning | Scope creep. Parkeer. |
| Custom overlay editor | Cool, maar niet nodig voor conventions. |
| Backend API | Alles draait client-side. Geen server nodig tot er een scaling-reden is. |

---

## DEEL 5: Kaders

### Non-negotiables

1. **Offline-first.** Elke feature moet werken zonder netwerk.
2. **Kiosk-safe.** Geheugen mag niet groeien over uren gebruik.
3. **Convention-ready.** Eén config switch (datum) bepaalt alle branding.
4. **Zero-config deploy.** `npm run build` → GitHub Pages. Klaar.
5. **Geen backend.** Client-only tot er een concrete reden is voor een server.

### Code Kaders

1. Max 200 LOC per component, max 300 per hook
2. Zustand stores: state + actions in `create()`, selectors geëxporteerd
3. Canvas code: pure functies, `getState()` aan de boundary
4. No semicolons, double quotes, trailing commas (Prettier enforced)
5. Dutch voor UI strings, English voor code/comments/logs
6. `rem` overal behalve canvas pixel buffers
7. Test elke bug fix (Vitest unit test)

---

## Conclusie

Je hebt een werkende app. De core features zijn compleet. Wat je nu nodig hebt is niet méér features — het is **stabiliteit, performance, en opschonen**.

De roadmap hierboven is 4 sprints. Na sprint 4 heb je:
- Zero known bugs
- Clean architecture (geen god-components)
- ~323 LOC minder dead code
- Production-grade PWA (Lighthouse 90+)
- Schaalbare basis voor toekomstige features

**Start vandaag met de Discord rate-limit fix. Dat is je eerste commit.**
