"use client"

import { useCallback, useState, useEffect, useRef } from "react"
import { TrashIcon, CloseIcon, CameraEmptyIcon } from "@/components/ui/icons"
import { BottomDrawer } from "@/components/ui/BottomDrawer"
import { useGalleryStore } from "@/features/gallery/store"

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

  useEffect(() => {
    let active = true
    const currentIds = new Set(photos.map((p) => p.id))

    for (const [id, url] of urlMapRef.current) {
      if (!currentIds.has(id)) {
        URL.revokeObjectURL(url)
        urlMapRef.current.delete(id)
      }
    }

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

  useEffect(() => {
    const map = urlMapRef.current
    return () => {
      for (const url of map.values()) URL.revokeObjectURL(url)
      map.clear()
    }
  }, [])

  const openLightbox = useCallback(
    async (photo) => {
      const blob = await getPhotoBlob(photo.id)
      if (!blob) return
      setLightboxPhoto(photo)
      setLightboxUrl(URL.createObjectURL(blob))
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
          <div className="flex min-h-[16rem] items-center justify-center px-4 py-10">
            <div className="max-w-sm rounded-none border border-white/10 bg-black px-5 py-6 text-center">
              <CameraEmptyIcon className="mx-auto h-10 w-10 text-white/40" />
              <p className="mt-4 text-sm font-bold text-white">Nog geen foto&apos;s</p>
              <p className="mt-1 text-xs leading-5 text-white/40">
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
                  className="group relative overflow-hidden rounded-none border border-white/10 bg-black text-left transition-all duration-200 hover:scale-[1.02] cursor-pointer"
                >
                  <div className="aspect-[4/3] overflow-hidden bg-[#111]">
                    {thumbnails[photo.id] && (
                      <img // eslint-disable-line @next/next/no-img-element
                        src={thumbnails[photo.id]}
                        alt={`Foto ${new Date(photo.createdAt).toLocaleTimeString("nl-NL")}`}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                        loading="lazy"
                      />
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2 px-3 py-2.5 border-t border-white/10">
                    <p className="truncate text-xs font-mono text-white/60">
                      {new Date(photo.createdAt).toLocaleDateString("nl-NL", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </p>
                    <span className="rounded-none border border-white/10 px-2 py-0.5 text-[0.65rem] uppercase tracking-[0.18em] text-white/40 font-mono">
                      Open
                    </span>
                  </div>
                </button>
              ))}
          </div>
        )}
      </BottomDrawer>

      {lightboxPhoto && lightboxUrl && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Foto weergave"
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/85"
          onClick={closeLightbox}
        >
          <div className="absolute top-6 right-6 flex gap-2">
            <button
              onClick={handleDelete}
              className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-none border border-white/20 bg-black transition-colors hover:border-white active:scale-95"
              aria-label="Verwijder foto"
            >
              <TrashIcon className="h-5 w-5 text-white" />
            </button>
            <button
              onClick={closeLightbox}
              className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-none border border-white/20 bg-black transition-colors hover:border-white active:scale-95"
              aria-label="Sluiten"
            >
              <CloseIcon className="h-5 w-5 text-white/60" />
            </button>
          </div>
          <img // eslint-disable-line @next/next/no-img-element
            src={lightboxUrl}
            alt=""
            className="max-w-[90vw] max-h-[90vh] rounded-none object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  )
}
