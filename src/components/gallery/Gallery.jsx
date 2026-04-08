"use client"

import { useCallback, useState, useEffect, useRef } from "react"
import { TrashIcon, CloseIcon, CameraEmptyIcon } from "@/components/ui/icons"
import { BottomDrawer } from "@/components/ui/BottomDrawer"
import { useGalleryStore } from "@/stores/galleryStore"

const UNDO_DURATION_MS = 5000

export function Gallery({ isOpen, onClose, toast }) {
  const photos = useGalleryStore((s) => s.photos)
  const removePhoto = useGalleryStore((s) => s.removePhoto)
  const getPhotoBlob = useGalleryStore((s) => s.getPhotoBlob)

  const [lightboxPhoto, setLightboxPhoto] = useState(null)
  const [lightboxUrl, setLightboxUrl] = useState(null)
  const [thumbnails, setThumbnails] = useState({})
  const [pendingDelete, setPendingDelete] = useState(null)
  const undoTimerRef = useRef(null)
  const urlMapRef = useRef(new Map())

  // Generate object URLs for thumbnails — track and revoke properly
  useEffect(() => {
    let active = true
    const currentIds = new Set(photos.map((p) => p.id))

    // Revoke URLs for photos that no longer exist
    for (const [id, url] of urlMapRef.current) {
      if (!currentIds.has(id)) {
        URL.revokeObjectURL(url)
        urlMapRef.current.delete(id)
      }
    }

    // Load thumbnails for new photos
    const loadThumbnails = async () => {
      for (const photo of photos) {
        if (urlMapRef.current.has(photo.id)) continue
        const blob = await getPhotoBlob(photo.id)
        if (!active || !blob) continue
        const url = URL.createObjectURL(blob)
        urlMapRef.current.set(photo.id, url)
        setThumbnails((prev) => ({ ...prev, [photo.id]: url }))
      }
    }

    loadThumbnails()
    return () => {
      active = false
    }
  }, [photos, getPhotoBlob])

  // Cleanup ALL URLs on unmount
  useEffect(() => {
    return () => {
      for (const url of urlMapRef.current.values()) {
        URL.revokeObjectURL(url)
      }
      urlMapRef.current.clear()
    }
  }, [])

  const openLightbox = useCallback(
    async (photo) => {
      const blob = await getPhotoBlob(photo.id)
      if (!blob) return
      const url = URL.createObjectURL(blob)
      setLightboxPhoto(photo)
      setLightboxUrl(url)
    },
    [getPhotoBlob],
  )

  const closeLightbox = useCallback(() => {
    if (lightboxUrl) URL.revokeObjectURL(lightboxUrl)
    setLightboxPhoto(null)
    setLightboxUrl(null)
  }, [lightboxUrl])

  const handleUndo = useCallback(() => {
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current)
    setPendingDelete(null)
  }, [])

  const handleDelete = useCallback(
    (e) => {
      e.stopPropagation()
      const id = lightboxPhoto?.id
      closeLightbox()
      if (!id) return

      // Commit any previous pending delete immediately
      if (pendingDelete) removePhoto(pendingDelete)

      if (undoTimerRef.current) clearTimeout(undoTimerRef.current)
      setPendingDelete(id)
      undoTimerRef.current = setTimeout(() => {
        removePhoto(id)
        setPendingDelete(null)
      }, UNDO_DURATION_MS)

      toast.show("Foto verwijderd", { label: "Ongedaan maken", onClick: handleUndo })
    },
    [lightboxPhoto, closeLightbox, removePhoto, pendingDelete, toast, handleUndo],
  )

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current)
    }
  }, [])

  const stopPropagation = useCallback((e) => e.stopPropagation(), [])

  if (!isOpen) return null

  return (
    <>
      <BottomDrawer
        title="Galerij"
        subtitle="Bekijk en beheer je gemaakte foto's."
        onClose={onClose}
        fullHeight
      >
        {photos.length === 0 ? (
          <div className="flex min-h-[16rem] items-center justify-center px-4 py-10 text-white/45">
            <div className="max-w-sm rounded-3xl border border-white/10 bg-white/[0.04] px-5 py-6 text-center">
              <CameraEmptyIcon className="mx-auto h-10 w-10 text-white/35" />
              <p className="mt-4 text-sm font-semibold text-white">Nog geen foto&apos;s</p>
              <p className="mt-1 text-xs leading-5 text-white/50">
                Zodra er een foto is gemaakt, verschijnt hij hier als overzichtelijke kaart.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {photos
              .filter((p) => p.id !== pendingDelete)
              .map((photo) => (
                <button
                  key={photo.id}
                  onClick={() => openLightbox(photo)}
                  className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] text-left transition-all hover:border-white/25 hover:bg-white/[0.07]"
                >
                  <div className="aspect-[4/3] overflow-hidden bg-black/30">
                    {thumbnails[photo.id] && (
                      <img // eslint-disable-line @next/next/no-img-element
                        src={thumbnails[photo.id]}
                        alt={`Foto ${new Date(photo.createdAt).toLocaleTimeString("nl-NL")}`}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                        loading="lazy"
                      />
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2 px-3 py-2.5">
                    <p className="truncate text-xs font-medium text-white/75">
                      {new Date(photo.createdAt).toLocaleDateString("nl-NL", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </p>
                    <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[0.65rem] uppercase tracking-[0.18em] text-white/45">
                      Open
                    </span>
                  </div>
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
              className="w-10 h-10 rounded-xl border border-red-400/20 bg-red-500/80 flex items-center justify-center hover:bg-red-500 transition-colors cursor-pointer"
              aria-label="Verwijder foto"
            >
              <TrashIcon className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={closeLightbox}
              className="w-10 h-10 rounded-xl border border-white/10 bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer"
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
