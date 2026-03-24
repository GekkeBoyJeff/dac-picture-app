"use client";

import { useState, useEffect, useCallback } from "react";
import { GALLERY } from "@/lib/config";

export function useGallery() {
  const [photos, setPhotos] = useState([]);

  // Hydrate from localStorage on mount, migrating old string-only format
  useEffect(() => {
    try {
      const stored = localStorage.getItem(GALLERY.STORAGE_KEY);
      if (!stored) return;

      const parsed = JSON.parse(stored);
      const migrated = parsed.map((item, i) => {
        if (typeof item === "string") {
          return { id: `migrated-${i}-${Date.now()}`, dataUrl: item, createdAt: 0 };
        }
        return item;
      });

      setPhotos(migrated);
      localStorage.setItem(GALLERY.STORAGE_KEY, JSON.stringify(migrated));
    } catch {
      localStorage.removeItem(GALLERY.STORAGE_KEY);
    }
  }, []);

  const addPhoto = useCallback((dataUrl) => {
    setPhotos((prev) => {
      const entry = {
        id: `photo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        dataUrl,
        createdAt: Date.now(),
      };
      const updated = [entry, ...prev].slice(0, GALLERY.MAX_PHOTOS);
      try {
        localStorage.setItem(GALLERY.STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  const removePhoto = useCallback((id) => {
    setPhotos((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      try {
        localStorage.setItem(GALLERY.STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  return { photos, addPhoto, removePhoto };
}
