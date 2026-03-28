import { create } from "zustand"
import {
  savePhoto,
  getPhoto,
  deletePhoto,
  getPhotoIndex,
  trimGallery,
} from "@/lib/storage/indexedDb"
import { GALLERY, IMAGE } from "@/lib/config"
import { logger } from "@/lib/logger"

export const useGalleryStore = create((set, get) => ({
  photos: [],
  isLoaded: false,

  /**
   * Load photo metadata from IndexedDB on mount
   */
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
   * Add a photo to the gallery
   * @param {Blob} blob - Photo blob
   * @returns {Promise<string>} Photo ID
   */
  addPhoto: async (blob) => {
    const id = `photo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    const metadata = { createdAt: Date.now() }

    try {
      await savePhoto(id, blob, metadata)
      await trimGallery(GALLERY.MAX_PHOTOS)
      const index = await getPhotoIndex()
      set({ photos: index })
      return id
    } catch (error) {
      logger.error("gallery", "Failed to save photo", error)
      return null
    }
  },

  /**
   * Remove a photo from the gallery
   * @param {string} id
   */
  removePhoto: async (id) => {
    try {
      await deletePhoto(id)
      set((state) => ({
        photos: state.photos.filter((p) => p.id !== id),
      }))
    } catch (error) {
      logger.error("gallery", "Failed to delete photo", error)
    }
  },

  /**
   * Get a photo blob by ID (for lightbox display)
   * @param {string} id
   * @returns {Promise<Blob|undefined>}
   */
  getPhotoBlob: async (id) => {
    return getPhoto(id)
  },
}))