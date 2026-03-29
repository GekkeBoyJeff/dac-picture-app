"use client"

import { useState, useCallback, useRef } from "react"
import { STRIP_PHOTO_COUNT } from "@/lib/config"
import { compositeStrip } from "@/lib/canvas/compositeStrip"

/**
 * Manages the multi-photo strip capture flow.
 * Keeps photos in a ref to avoid stale closures in the countdown callback.
 *
 * @param {object} options
 * @param {boolean} options.enabled - Whether strip mode is on
 * @param {() => Promise<Blob>} options.captureOne - Captures a single photo
 * @param {(blob: Blob) => Promise<void>} options.onStripComplete - Called with the final composited strip
 * @param {(blob: Blob) => Promise<void>} options.savePhoto - Saves an individual photo
 * @param {(state: string) => void} options.setAppState
 */
export function useStripCapture({ enabled, captureOne, onStripComplete, savePhoto, setAppState }) {
  const [stripPhotos, setStripPhotos] = useState([])
  const [isActive, setIsActive] = useState(false)
  const photosRef = useRef([])

  const reset = useCallback(() => {
    photosRef.current = []
    setStripPhotos([])
    setIsActive(false)
  }, [])

  const start = useCallback(() => {
    photosRef.current = []
    setStripPhotos([])
    setIsActive(true)
  }, [])

  /** Called after each countdown completes. Returns true if strip is still in progress. */
  const addPhoto = useCallback(async (blob) => {
    const newPhotos = [...photosRef.current, blob]
    photosRef.current = newPhotos
    setStripPhotos(newPhotos)

    if (newPhotos.length < STRIP_PHOTO_COUNT) {
      // More photos needed — start next countdown immediately
      setAppState("countdown")
      return true
    }

    // All photos taken — fade out strip overlay, then compose
    setIsActive(false)
    await new Promise((r) => setTimeout(r, 550))
    reset()

    const stripBlob = await compositeStrip(newPhotos)
    await onStripComplete(stripBlob)

    for (const photo of newPhotos) {
      await savePhoto(photo)
    }

    return false
  }, [onStripComplete, savePhoto, setAppState, reset])

  return { stripPhotos, isActive, start, reset, addPhoto }
}