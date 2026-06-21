"use client"

import { useCallback, useState, useEffect, useRef } from "react"
import { TrashIcon, CloseIcon, CameraEmptyIcon } from "@/components/ui/icons"
import { BottomDrawer } from "@/components/ui/BottomDrawer"
import { IconButton } from "@/components/ui/IconButton"
import { cn } from "@/lib/styles/cn"
import { useGalleryStore } from "@/stores/galleryStore"
import { useUiStore } from "@/stores/uiStore"

const UNDO_DURATION_MS = 5000

export function Gallery({ isOpen, onClose, toast }) {
  const photos = useGalleryStore((s) => s.photos)
  const removePhoto = useGalleryStore((s) => s.removePhoto)
  const getPhotoBlob = useGalleryStore((s) => s.getPhotoBlob)

  // Lightbox index lives in the store so /admin can drive it (open/next/prev/close).
  const lightboxIndex = useUiStore((s) => s.galleryLightboxIndex)
  const setLightboxIndex = useUiStore((s) => s.setGalleryLightboxIndex)
  const galleryNext = useUiStore((s) => s.galleryNext)
  const galleryPrev = useUiStore((s) => s.galleryPrev)
  const closeLightbox = useUiStore((s) => s.closeGalleryLightbox)

  const [lightboxUrl, setLightboxUrl] = useState(null)
  const [thumbnails, setThumbnails] = useState({})
  const [pendingDelete, setPendingDelete] = useState(null)
  const undoTimerRef = useRef(null)

  const lightboxPhoto =
    lightboxIndex != null && lightboxIndex >= 0 && lightboxIndex < photos.length
      ? photos[lightboxIndex]
      : null

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

  // Load the full-size blob for the current lightbox photo (re-runs as the index changes).
  useEffect(() => {
    let active = true
    let url = null
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLightboxUrl(null) // clear first so we never show a stale/revoked image while loading
    if (lightboxPhoto) {
      getPhotoBlob(lightboxPhoto.id).then((blob) => {
        if (!active || !blob) return
        url = URL.createObjectURL(blob)
        setLightboxUrl(url)
      })
    }
    return () => {
      active = false
      if (url) URL.revokeObjectURL(url)
    }
  }, [lightboxPhoto?.id, getPhotoBlob]) // eslint-disable-line react-hooks/exhaustive-deps

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
          <div className="flex min-h-64 items-center justify-center px-4 py-10">
            <div className="max-w-sm rounded-3xl border border-hairline bg-surface px-6 py-9 text-center">
              <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-gold/30 bg-gold/10">
                <CameraEmptyIcon className="h-10 w-10 text-gold" />
              </span>
              <p className="mt-5 font-display text-base font-semibold text-ink">
                Nog geen foto&apos;s
              </p>
              <p className="mt-2 text-sm leading-6 text-ink-muted">
                Maak je eerste foto en hij verschijnt hier meteen als kaart.
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
                  onClick={() => setLightboxIndex(photos.findIndex((p) => p.id === photo.id))}
                  className="group relative cursor-pointer overflow-hidden rounded-3xl border border-hairline bg-surface text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-gold/55 hover:shadow-[0_0_0_1px_rgba(230,193,137,0.2),0_8px_24px_rgba(0,0,0,0.35)]"
                >
                  <div className="aspect-4/3 overflow-hidden bg-ground">
                    {thumbnails[photo.id] && (
                      <img // eslint-disable-line @next/next/no-img-element
                        src={thumbnails[photo.id]}
                        alt={`Foto ${new Date(photo.createdAt).toLocaleTimeString("nl-NL")}`}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                        loading="lazy"
                      />
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2 px-3 py-2.5">
                    <p className="truncate text-xs font-medium text-ink-muted">
                      {new Date(photo.createdAt).toLocaleDateString("nl-NL", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </p>
                    <span className="rounded-full border border-hairline bg-raised px-2 py-0.5 text-[0.65rem] uppercase tracking-[0.18em] text-ink-dim transition-colors group-hover:border-gold/55 group-hover:text-gold">
                      Open
                    </span>
                  </div>
                </button>
              ))}
          </div>
        )}
      </BottomDrawer>

      {/* Lightbox — index-driven so /admin can browse it remotely */}
      {lightboxPhoto && lightboxUrl && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Foto weergave"
          className="fixed inset-0 z-60 flex items-center justify-center bg-ground/85 backdrop-blur-md"
          onClick={closeLightbox}
        >
          <div className="absolute top-6 right-6 flex gap-2">
            <IconButton
              onClick={handleDelete}
              ariaLabel="Verwijder foto"
              className={cn(
                "border-danger/40 bg-danger/15 text-danger",
                "hover:-translate-y-px hover:border-danger/60 hover:bg-danger/25 hover:text-danger",
              )}
            >
              <TrashIcon className="w-5 h-5" />
            </IconButton>
            <IconButton onClick={closeLightbox} ariaLabel="Sluiten">
              <CloseIcon className="w-5 h-5" />
            </IconButton>
          </div>

          {/* Prev / next (touch on booth; mirrors remote next/prev) */}
          {lightboxIndex > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                galleryPrev()
              }}
              aria-label="Vorige foto"
              className="absolute left-4 top-1/2 -translate-y-1/2 cursor-pointer rounded-full border border-hairline bg-base/70 px-4 py-3 text-2xl text-ink hover:bg-surface"
            >
              ‹
            </button>
          )}
          {lightboxIndex < photos.length - 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                galleryNext(photos.length)
              }}
              aria-label="Volgende foto"
              className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer rounded-full border border-hairline bg-base/70 px-4 py-3 text-2xl text-ink hover:bg-surface"
            >
              ›
            </button>
          )}

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full border border-hairline bg-base/70 px-3 py-1 text-xs text-ink-muted">
            Foto {lightboxIndex + 1} / {photos.length}
          </div>

          <img // eslint-disable-line @next/next/no-img-element
            src={lightboxUrl}
            alt=""
            className="max-w-[90vw] max-h-[90vh] rounded-2xl border border-hairline shadow-2xl object-contain"
            onClick={stopPropagation}
          />
        </div>
      )}
    </>
  )
}