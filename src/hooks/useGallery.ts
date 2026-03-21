"use client";

import { useState, useEffect, useCallback } from "react";
import { GALLERY } from "@/lib/config";
import type { PhotoEntry } from "@/lib/types";

export function useGallery() {
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(GALLERY.STORAGE_KEY);
      if (!stored) return;

      const parsed: unknown[] = JSON.parse(stored);
      const migrated: PhotoEntry[] = parsed.map((item, i) => {
        if (typeof item === "string") {
          return { id: `migrated-${i}-${Date.now()}`, dataUrl: item, createdAt: 0 };
        }
        return item as PhotoEntry;
      });

      setPhotos(migrated);
      localStorage.setItem(GALLERY.STORAGE_KEY, JSON.stringify(migrated));
    } catch {
      localStorage.removeItem(GALLERY.STORAGE_KEY);
    }
  }, []);

  const addPhoto = useCallback((dataUrl: string) => {
    setPhotos((prev) => {
      const entry: PhotoEntry = {
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

  const clearPhotos = useCallback(() => {
    setPhotos([]);
    try {
      localStorage.removeItem(GALLERY.STORAGE_KEY);
    } catch {}
  }, []);

  return { photos, addPhoto, clearPhotos };
}
