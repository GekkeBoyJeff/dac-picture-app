import { create } from "zustand"
import {
  addPhoto as dbAddPhoto,
  getPhotoBlob as dbGetPhotoBlob,
  removePhoto as dbRemovePhoto,
  getPhotoIndex,
  trimPhotos,
} from "@/lib/storage/indexedDb"
import { GALLERY } from "@/lib/config"
import { logger } from "@/lib/logger"

export const useGalleryStore = create((set) => ({
  photos: [],
  isLoaded: false,

  loadPhotos: async () => {
    try {
      const index = await getPhotoIndex()
      set({ photos: index, isLoaded: true })
    } catch (error) {
      logger.error("gallery", "Failed to load photos", error)
      set({ photos: [], isLoaded: true })
    }
  },

  /**
   * Add a photo to the gallery. Returns the photo ID on success.
   * @param {Blob} blob
   * @returns {Promise<string | null>}
   */
  addPhoto: async (blob) => {
    const id = `photo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    const metadata = { createdAt: Date.now() }

    try {
      await dbAddPhoto(id, blob, metadata)
      await trimPhotos(GALLERY.MAX_PHOTOS)
      const index = await getPhotoIndex()
      set({ photos: index })
      return id
    } catch (error) {
      logger.error("gallery", "Failed to save photo", error)
      return null
    }
  },

  /**
   * Remove a photo from the gallery.
   * @param {string} id
   */
  removePhoto: async (id) => {
    try {
      await dbRemovePhoto(id)
      set((state) => ({
        photos: state.photos.filter((p) => p.id !== id),
      }))
    } catch (error) {
      logger.error("gallery", "Failed to delete photo", error)
    }
  },

  /**
   * Get a photo blob by ID (for lightbox display).
   * @param {string} id
   * @returns {Promise<Blob | undefined>}
   */
  getPhotoBlob: async (id) => {
    return dbGetPhotoBlob(id)
  },
}))

// -- Selectors --

export const selectPhotos = (state) => state.photos
export const selectGalleryLoaded = (state) => state.isLoaded
export const selectPhotoCount = (state) => state.photos.length