const CACHE_PREFIX = "dac-photo-booth-v"

// Resolved once on install/activate, then cached in memory for fetch events
let cacheName = null

async function fetchVersionInfo() {
  const res = await fetch("version.json")
  return res.json()
}

async function getCacheName() {
  if (cacheName) return cacheName
  try {
    const { version } = await fetchVersionInfo()
    cacheName = CACHE_PREFIX + version
  } catch {
    const keys = await caches.keys()
    cacheName = keys.find((k) => k.startsWith(CACHE_PREFIX)) || CACHE_PREFIX + "unknown"
  }
  return cacheName
}

// Overlay assets to precache at install time
const OVERLAY_ASSETS = [
  "/overlays/corner-tl.svg",
  "/overlays/corner-tr.svg",
  "/overlays/corner-bl.svg",
  "/overlays/corner-br.svg",
  "/overlays/logo.svg",
  "/overlays/logo.png",
  "/overlays/qr-discord.svg",
  "/overlays/qr-app.svg",
  "/overlays/mascots/amelia.webp",
  "/overlays/mascots/amelia-smile.webp",
  "/overlays/mascots/amelia-v2.webp",
  "/overlays/mascots/amelia-beer.webp",
  "/overlays/mascots/amelia-hug.webp",
  "/overlays/mascots/amelia-beer-alt.webp",
  "/overlays/conventions/hmia-2026/banner.png",
  "/overlays/conventions/dcc-2026/banner.svg",
  "/overlays/conventions/animecon-2026/banner.png",
]

self.addEventListener("install", (event) => {
  event.waitUntil(
    fetchVersionInfo().then(async ({ version, basePath }) => {
      cacheName = CACHE_PREFIX + version
      const prefix = basePath || ""
      const cache = await caches.open(cacheName)
      return cache.addAll([
        prefix + "/",
        ...OVERLAY_ASSETS.map((p) => prefix + p),
      ])
    }),
  )
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    getCacheName().then((current) =>
      caches.keys().then((names) =>
        Promise.all(
          names
            .filter((name) => name.startsWith(CACHE_PREFIX) && name !== current)
            .map((name) => caches.delete(name)),
        ),
      ),
    ),
  )
  self.clients.claim()
})

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url)

  // Skip non-GET, API requests, and the gesture worker (always fetch fresh)
  if (event.request.method !== "GET" || url.pathname.includes("/api/") || url.pathname.endsWith("/gesture-worker.js")) {
    return
  }

  // Cache-first for MediaPipe WASM/model files (immutable)
  if (url.hostname === "cdn.jsdelivr.net" || url.hostname === "storage.googleapis.com") {
    event.respondWith(
      getCacheName().then((name) =>
        caches.match(event.request).then((cached) => {
          if (cached) return cached
          return fetch(event.request).then((response) => {
            if (response.ok) {
              const clone = response.clone()
              caches.open(name).then((cache) => cache.put(event.request, clone))
            }
            return response
          })
        }),
      ),
    )
    return
  }

  // Cache-first for static overlay assets (images, SVGs)
  if (url.pathname.match(/\.(png|svg|jpg|webp|woff2?)$/)) {
    event.respondWith(
      getCacheName().then((name) =>
        caches.match(event.request).then((cached) => {
          return (
            cached ||
            fetch(event.request).then((response) => {
              if (response.ok) {
                const clone = response.clone()
                caches.open(name).then((cache) => cache.put(event.request, clone))
              }
              return response
            })
          )
        }),
      ),
    )
    return
  }

  // Stale-while-revalidate for app shell (HTML, JS, CSS)
  const isAppShell =
    event.request.mode === "navigate" ||
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".html")

  if (isAppShell) {
    event.respondWith(
      getCacheName().then((name) =>
        caches.open(name).then((cache) =>
          cache.match(event.request).then((cached) => {
            const fetchPromise = fetch(event.request)
              .then((response) => {
                if (response.ok) cache.put(event.request, response.clone())
                return response
              })
              .catch(() => cached)
            return cached || fetchPromise
          }),
        ),
      ),
    )
    return
  }

  // Default: network-first
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request)),
  )
})
