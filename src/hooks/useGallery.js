"use client"

import { useState, useCallback } from "react"
import { GALLERY } from "@/lib/config"
import { readJsonStorage, writeJsonStorage, removeStorage } from "@/lib/storage/localStorage"

export function useGallery() {
  // Lazy init: read and migrate photos from storage
  const [photos, setPhotos] = useState(() => {
    try {
      const stored = readJsonStorage(GALLERY.STORAGE_KEY)
      if (!Array.isArray(stored)) {
        removeStorage(GALLERY.STORAGE_KEY)
        return []
      }

      return stored.map((item, i) => {
        // Migrate old string-only format to new object format
        if (typeof item === "string") {
          return { id: `migrated-${i}-${Date.now()}`, dataUrl: item, createdAt: 0 }
        }
        return item
      })
    } catch {
      removeStorage(GALLERY.STORAGE_KEY)
      return []
    }
  })

  const addPhoto = useCallback((dataUrl) => {
    setPhotos((prev) => {
      const entry = {
        id: `photo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        dataUrl,
        createdAt: Date.now(),
      }
      const updated = [entry, ...prev].slice(0, GALLERY.MAX_PHOTOS)
      writeJsonStorage(GALLERY.STORAGE_KEY, updated)
      return updated
    })
  }, [])

  const removePhoto = useCallback((id) => {
    setPhotos((prev) => {
      const updated = prev.filter((p) => p.id !== id)
      writeJsonStorage(GALLERY.STORAGE_KEY, updated)
      return updated
    })
  }, [])

  return { photos, addPhoto, removePhoto }
}