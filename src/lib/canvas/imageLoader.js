// Overlay images are cached across captures to avoid re-fetching on every photo.
const imageCache = new Map()

/**
 * Load an image and cache it. Returns a resolved promise on cache hit.
 * @param {string} src
 * @returns {Promise<HTMLImageElement>}
 */
export function loadImage(src) {
  const cached = imageCache.get(src)
  if (cached) return Promise.resolve(cached)

  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      imageCache.set(src, img)
      resolve(img)
    }
    img.onerror = () => reject(new Error(`Failed to load overlay: ${src}`))
    img.src = src
  })
}