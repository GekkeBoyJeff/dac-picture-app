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

self.addEventListener("install", (event) => {
  event.waitUntil(
    fetchVersionInfo().then(async ({ version, basePath }) => {
      cacheName = CACHE_PREFIX + version
      const cache = await caches.open(cacheName)
      return cache.addAll([(basePath || "") + "/"])
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

  // Skip non-GET and API requests
  if (event.request.method !== "GET" || url.pathname.includes("/api/")) {
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
