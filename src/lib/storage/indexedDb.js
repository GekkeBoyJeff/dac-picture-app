import { get, set, del, keys } from "idb-keyval"

// --- Photo storage ---

const PHOTO_PREFIX = "photo-"
const PHOTO_INDEX_KEY = "gallery-index"

/**
 * Save a photo blob to IndexedDB
 * @param {string} id - Photo ID
 * @param {Blob} blob - Photo blob
 * @param {Object} metadata - Photo metadata (createdAt, etc.)
 */
export async function savePhoto(id, blob, metadata = {}) {
  await set(`${PHOTO_PREFIX}${id}`, blob)
  const index = (await get(PHOTO_INDEX_KEY)) || []
  index.push({ id, createdAt: metadata.createdAt || Date.now(), ...metadata })
  await set(PHOTO_INDEX_KEY, index)
}

/**
 * Get a photo blob by ID
 * @param {string} id
 * @returns {Promise<Blob|undefined>}
 */
export async function getPhoto(id) {
  return get(`${PHOTO_PREFIX}${id}`)
}

/**
 * Delete a photo from IndexedDB
 * @param {string} id
 */
export async function deletePhoto(id) {
  await del(`${PHOTO_PREFIX}${id}`)
  const index = (await get(PHOTO_INDEX_KEY)) || []
  await set(PHOTO_INDEX_KEY, index.filter((p) => p.id !== id))
}

/**
 * Get all photo metadata entries
 * @returns {Promise<Array<{id: string, createdAt: number}>>}
 */
export async function getPhotoIndex() {
  return (await get(PHOTO_INDEX_KEY)) || []
}

/**
 * Trim gallery to max count, removing oldest
 * @param {number} maxPhotos
 */
export async function trimGallery(maxPhotos) {
  const index = (await get(PHOTO_INDEX_KEY)) || []
  if (index.length <= maxPhotos) return

  const sorted = [...index].sort((a, b) => a.createdAt - b.createdAt)
  const toRemove = sorted.slice(0, index.length - maxPhotos)

  for (const entry of toRemove) {
    await del(`${PHOTO_PREFIX}${entry.id}`)
  }

  const remaining = index.filter((p) => !toRemove.some((r) => r.id === p.id))
  await set(PHOTO_INDEX_KEY, remaining)
}

// --- Send queue storage ---

const QUEUE_PREFIX = "queue-"
const QUEUE_INDEX_KEY = "send-queue-index"

/**
 * Enqueue a photo blob for Discord send
 * @param {string} id
 * @param {Blob} blob
 */
export async function enqueueBlob(id, blob) {
  await set(`${QUEUE_PREFIX}${id}`, blob)
  const index = (await get(QUEUE_INDEX_KEY)) || []
  index.push({ id, attempts: 0, failed: false, lastAttempt: null })
  await set(QUEUE_INDEX_KEY, index)
}

/**
 * Get a queued blob by ID
 * @param {string} id
 * @returns {Promise<Blob|undefined>}
 */
export async function getQueuedBlob(id) {
  return get(`${QUEUE_PREFIX}${id}`)
}

/**
 * Remove a queued item after successful send
 * @param {string} id
 */
export async function dequeueBlob(id) {
  await del(`${QUEUE_PREFIX}${id}`)
  const index = (await get(QUEUE_INDEX_KEY)) || []
  await set(QUEUE_INDEX_KEY, index.filter((q) => q.id !== id))
}

/**
 * Get all queue metadata entries
 * @returns {Promise<Array<{id: string, attempts: number, failed: boolean, lastAttempt: number|null}>>}
 */
export async function getQueueIndex() {
  return (await get(QUEUE_INDEX_KEY)) || []
}

/**
 * Update queue item metadata (e.g. increment attempts)
 * @param {string} id
 * @param {Object} updates
 */
export async function updateQueueItem(id, updates) {
  const index = (await get(QUEUE_INDEX_KEY)) || []
  const updated = index.map((item) =>
    item.id === id ? { ...item, ...updates } : item,
  )
  await set(QUEUE_INDEX_KEY, updated)
}