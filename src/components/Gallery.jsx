"use client"

/* eslint-disable @next/next/no-img-element -- Data URL previews and lightbox rendering work reliably with native img. */
import { useCallback, useState } from "react"
import { TrashIcon, CloseIcon, CameraEmptyIcon } from "./icons"
import { BottomDrawer } from "./BottomDrawer"

export function Gallery({ photos, isOpen, onClose, onRemove }) {
  const [lightboxPhoto, setLightboxPhoto] = useState(null)

  const closeLightbox = useCallback(() => setLightboxPhoto(null), [])

  const handleDelete = useCallback((e) => {
    e.stopPropagation()
    const id = lightboxPhoto?.id
    closeLightbox()
    if (id) onRemove(id)
  }, [lightboxPhoto, closeLightbox, onRemove])

  const stopPropagation = useCallback((e) => e.stopPropagation(), [])

  if (!isOpen) return null

  return (
    <>
      <BottomDrawer title="Gallery" onClose={onClose}>
        {photos.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-white/40">
            <CameraEmptyIcon className="w-10 h-10 mr-3" />
            <p className="text-sm">No photos yet</p>
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-2 px-3 scrollbar-none">
            {photos.map((photo) => (
              <button
                key={photo.id}
                onClick={() => setLightboxPhoto(photo)}
                className="shrink-0 w-36 aspect-video rounded-xl overflow-hidden bg-white/5 cursor-pointer border-2 border-transparent hover:border-white/30 transition-all"
              >
                <img
                  src={photo.dataUrl}
                  alt={`Photo ${new Date(photo.createdAt).toLocaleTimeString("nl-NL")}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        )}
      </BottomDrawer>

      {/* Lightbox */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 backdrop-blur-md"
          onClick={closeLightbox}
        >
          <div className="absolute top-6 right-6 flex gap-2">
            <button
              onClick={handleDelete}
              className="w-10 h-10 rounded-lg bg-red-500/80 flex items-center justify-center hover:bg-red-500 transition-colors cursor-pointer"
              aria-label="Delete photo"
            >
              <TrashIcon className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={closeLightbox}
              className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <CloseIcon className="w-5 h-5 text-white" />
            </button>
          </div>

          <img
            src={lightboxPhoto.dataUrl}
            alt=""
            className="max-w-[90vw] max-h-[90vh] rounded-2xl shadow-2xl object-contain"
            onClick={stopPropagation}
          />
        </div>
      )}
    </>
  )
}