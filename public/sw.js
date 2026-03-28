const CACHE_NAME = "dac-photo-booth-v2"

// MediaPipe assets to precache on install
const PRECACHE_URLS = [
  "/",
]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)),
  )
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  // Clean up old caches
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name)),
      ),
    ),
  )
  self.clients.claim()
})

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url)

  // Skip non-GET and API requests
  if (event.request.method !== "GET" || url.pathname.includes("/api/")) {
    return
  }

  // Cache-first for MediaPipe WASM/model files (immutable)
  if (url.hostname === "cdn.jsdelivr.net" || url.hostname === "storage.googleapis.com") {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached
        return fetch(event.request).then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
          }
          return response
        })
      }),
    )
    return
  }

  // Cache-first for static overlay assets (images, SVGs)
  if (url.pathname.match(/\.(png|svg|jpg|webp|woff2?)$/)) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        return (
          cached ||
          fetch(event.request).then((response) => {
            if (response.ok) {
              const clone = response.clone()
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
            }
            return response
          })
        )
      }),
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
      caches.open(CACHE_NAME).then((cache) =>
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
    )
    return
  }

  // Default: network-first
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request)),
  )
})