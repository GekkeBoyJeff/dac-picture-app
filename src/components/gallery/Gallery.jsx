"use client"

import { useCallback, useState, useEffect } from "react"
import { TrashIcon, CloseIcon, CameraEmptyIcon } from "@/components/ui/icons"
import { BottomDrawer } from "@/components/ui/BottomDrawer"
import { useGalleryStore } from "@/stores/galleryStore"

export function Gallery({ isOpen, onClose }) {
  const photos = useGalleryStore((s) => s.photos)
  const removePhoto = useGalleryStore((s) => s.removePhoto)
  const getPhotoBlob = useGalleryStore((s) => s.getPhotoBlob)

  const [lightboxPhoto, setLightboxPhoto] = useState(null)
  const [lightboxUrl, setLightboxUrl] = useState(null)
  const [thumbnails, setThumbnails] = useState({})

  // Generate object URLs for thumbnails
  useEffect(() => {
    let active = true
    const urls = {}

    const loadThumbnails = async () => {
      for (const photo of photos) {
        if (thumbnails[photo.id]) continue
        const blob = await getPhotoBlob(photo.id)
        if (!active || !blob) continue
        urls[photo.id] = URL.createObjectURL(blob)
      }
      if (active) setThumbnails((prev) => ({ ...prev, ...urls }))
    }

    loadThumbnails()
    return () => {
      active = false
      Object.values(urls).forEach(URL.revokeObjectURL)
    }
  }, [photos, getPhotoBlob]) // eslint-disable-line react-hooks/exhaustive-deps

  const openLightbox = useCallback(async (photo) => {
    const blob = await getPhotoBlob(photo.id)
    if (!blob) return
    const url = URL.createObjectURL(blob)
    setLightboxPhoto(photo)
    setLightboxUrl(url)
  }, [getPhotoBlob])

  const closeLightbox = useCallback(() => {
    if (lightboxUrl) URL.revokeObjectURL(lightboxUrl)
    setLightboxPhoto(null)
    setLightboxUrl(null)
  }, [lightboxUrl])

  const handleDelete = useCallback((e) => {
    e.stopPropagation()
    const id = lightboxPhoto?.id
    closeLightbox()
    if (id) removePhoto(id)
  }, [lightboxPhoto, closeLightbox, removePhoto])

  const stopPropagation = useCallback((e) => e.stopPropagation(), [])

  if (!isOpen) return null

  return (
    <>
      <BottomDrawer title="Gallery" onClose={onClose}>
        {photos.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-white/40">
            <CameraEmptyIcon className="w-10 h-10 mr-3" />
            <p className="text-sm">Nog geen foto&apos;s</p>
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-2 px-3 scrollbar-none">
            {photos.map((photo) => (
              <button
                key={photo.id}
                onClick={() => openLightbox(photo)}
                className="shrink-0 w-36 aspect-video rounded-xl overflow-hidden bg-white/5 cursor-pointer border-2 border-transparent hover:border-white/30 transition-all"
              >
                {thumbnails[photo.id] && (
                  <img // eslint-disable-line @next/next/no-img-element
                    src={thumbnails[photo.id]}
                    alt={`Foto ${new Date(photo.createdAt).toLocaleTimeString("nl-NL")}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                )}
              </button>
            ))}
          </div>
        )}
      </BottomDrawer>

      {/* Lightbox */}
      {lightboxPhoto && lightboxUrl && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Foto weergave"
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 backdrop-blur-md"
          onClick={closeLightbox}
        >
          <div className="absolute top-6 right-6 flex gap-2">
            <button
              onClick={handleDelete}
              className="w-10 h-10 rounded-lg bg-red-500/80 flex items-center justify-center hover:bg-red-500 transition-colors cursor-pointer"
              aria-label="Verwijder foto"
            >
              <TrashIcon className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={closeLightbox}
              className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer"
              aria-label="Sluiten"
            >
              <CloseIcon className="w-5 h-5 text-white" />
            </button>
          </div>

          <img // eslint-disable-line @next/next/no-img-element
            src={lightboxUrl}
            alt=""
            className="max-w-[90vw] max-h-[90vh] rounded-2xl shadow-2xl object-contain"
            onClick={stopPropagation}
          />
        </div>
      )}
    </>
  )
}