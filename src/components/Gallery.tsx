"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PhotoEntry } from "@/lib/types";
import { CloseIcon, TrashIcon, CameraEmptyIcon } from "./icons";

interface GalleryProps {
  photos: PhotoEntry[];
  isOpen: boolean;
  onClose: () => void;
  onRemove: (id: string) => void;
}

export function Gallery({ photos, isOpen, onClose, onRemove }: GalleryProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [lightboxPhoto, setLightboxPhoto] = useState<PhotoEntry | null>(null);
  const [lightboxVisible, setLightboxVisible] = useState(false);

  const openLightbox = useCallback((photo: PhotoEntry) => {
    setLightboxPhoto(photo);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setLightboxVisible(true));
    });
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxVisible(false);
  }, []);

  const handleLightboxTransitionEnd = useCallback(() => {
    if (!lightboxVisible) setLightboxPhoto(null);
  }, [lightboxVisible]);

  useEffect(() => {
    if (!isOpen) {
      closeLightbox();
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (lightboxPhoto) {
          closeLightbox();
        } else {
          onClose();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, lightboxPhoto, closeLightbox]);

  useEffect(() => {
    if (isOpen && !lightboxPhoto) panelRef.current?.focus();
  }, [isOpen, lightboxPhoto]);

  return (
    <div
      className={`fixed inset-0 z-50 transition-all duration-300 ${
        isOpen ? "pointer-events-auto" : "pointer-events-none"
      }`}
    >
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />

      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Galerij"
        tabIndex={-1}
        className={`absolute top-0 right-0 h-full w-full sm:max-w-md bg-gray-950/95 backdrop-blur-xl border-l border-white/10 shadow-2xl transition-transform duration-300 ease-out outline-none ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <header className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-white">Galerij</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer"
            aria-label="Sluit galerij"
          >
            <CloseIcon className="w-5 h-5 text-white" />
          </button>
        </header>

        <section className="p-4 overflow-y-auto h-[calc(100%-5rem)]">
          {photos.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-white/40">
              <CameraEmptyIcon className="w-16 h-16 mb-4" />
              <p className="text-sm">Nog geen foto&apos;s gemaakt</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {photos.map((photo) => (
                <button
                  key={photo.id}
                  onClick={() => openLightbox(photo)}
                  className="aspect-video rounded-xl overflow-hidden bg-white/5 cursor-pointer hover:ring-2 hover:ring-white/30 transition-all"
                >
                  <img
                    src={photo.dataUrl}
                    alt={`Foto ${new Date(photo.createdAt).toLocaleTimeString("nl-NL")}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          )}
        </section>
      </aside>

      {lightboxPhoto && (
        <div
          className={`fixed inset-0 z-60 flex items-center justify-center transition-all duration-300 ${
            lightboxVisible
              ? "bg-black/80 backdrop-blur-md pointer-events-auto"
              : "bg-transparent backdrop-blur-none pointer-events-none"
          }`}
          onClick={closeLightbox}
          onTransitionEnd={handleLightboxTransitionEnd}
        >
          <div
            className={`absolute top-6 right-6 flex gap-2 transition-opacity ${
              lightboxVisible ? "opacity-100" : "opacity-0"
            }`}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (!lightboxPhoto) return;
                const id = lightboxPhoto.id;
                closeLightbox();
                onRemove(id);
              }}
              className="w-10 h-10 rounded-lg bg-red-500/80 flex items-center justify-center hover:bg-red-500 transition-colors cursor-pointer"
              aria-label="Verwijder foto"
            >
              <TrashIcon className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={closeLightbox}
              className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer"
              aria-label="Sluit foto"
            >
              <CloseIcon className="w-5 h-5 text-white" />
            </button>
          </div>

          <img
            src={lightboxPhoto.dataUrl}
            alt={`Foto ${new Date(lightboxPhoto.createdAt).toLocaleTimeString("nl-NL")}`}
            className={`max-w-[90vw] max-h-[90vh] rounded-2xl shadow-2xl object-contain transition-all duration-300 ${
              lightboxVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
            }`}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
