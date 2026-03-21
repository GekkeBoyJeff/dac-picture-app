"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PhotoEntry } from "@/lib/types";

interface GalleryProps {
  photos: PhotoEntry[];
  isOpen: boolean;
  onClose: () => void;
}

export function Gallery({ photos, isOpen, onClose }: GalleryProps) {
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
        className={`absolute top-0 right-0 h-full w-full max-w-md bg-gray-950/95 backdrop-blur-xl border-l border-white/10 shadow-2xl transition-transform duration-300 ease-out outline-none ${
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
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </header>

        <section className="p-4 overflow-y-auto h-[calc(100%-5rem)]">
          {photos.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-white/40">
              <svg
                className="w-16 h-16 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"
                />
              </svg>
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
          <button
            onClick={closeLightbox}
            className={`absolute top-6 right-6 w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer ${
              lightboxVisible ? "opacity-100" : "opacity-0"
            }`}
            aria-label="Sluit foto"
          >
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

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
