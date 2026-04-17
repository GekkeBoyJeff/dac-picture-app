import { useCallback } from "react"
import { useCameraStore } from "@/features/camera/store"
import { compositePhoto } from "@/lib/canvas/compositePhoto"
import { STRIP_CANVAS, IMAGE } from "@/lib/config"

/**
 * Captures a single video frame onto a canvas at the strip cell dimensions,
 * center-cropping and optionally mirroring the source.
 *
 * @param {HTMLVideoElement} video
 * @param {boolean} mirrored
 * @returns {Promise<Blob>}
 */
function captureStripCell(video, mirrored) {
  const cellW = STRIP_CANVAS.WIDTH - STRIP_CANVAS.MARGIN_X * 2
  const cellH = STRIP_CANVAS.PHOTO_HEIGHT

  const canvas = document.createElement("canvas")
  canvas.width = cellW
  canvas.height = cellH
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Failed to get canvas 2D context")

  const vw = video.videoWidth
  const vh = video.videoHeight
  const videoAspect = vw / vh
  const cellAspect = cellW / cellH

  let sx = 0
  let sy = 0
  let sw = vw
  let sh = vh

  if (videoAspect > cellAspect) {
    sw = Math.round(vh * cellAspect)
    sx = Math.round((vw - sw) / 2)
  } else {
    sh = Math.round(vw / cellAspect)
    sy = Math.round((vh - sh) / 2)
  }

  if (mirrored) {
    ctx.save()
    ctx.translate(cellW, 0)
    ctx.scale(-1, 1)
  }

  ctx.drawImage(video, sx, sy, sw, sh, 0, 0, cellW, cellH)

  if (mirrored) {
    ctx.restore()
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))),
      IMAGE.FORMAT,
      IMAGE.EXPORT_QUALITY,
    )
  })
}

/**
 * Single-photo and strip-cell capture orchestration.
 *
 * - For strip cells: center-crops the video feed into strip dimensions
 * - For single photos: delegates to compositePhoto for full overlay rendering
 *
 * Uses getCameraStore via getState() only in callbacks to avoid
 * unnecessary re-renders.
 *
 * @param {{ videoRef: React.RefObject, containerRef: React.RefObject }} refs
 * @returns {{ captureOnePhoto: (opts?: { forStrip?: boolean }) => Promise<Blob> }}
 */
export function useCaptureFlow({ videoRef, containerRef }) {
  const captureOnePhoto = useCallback(
    async ({ forStrip = false } = {}) => {
      const video = videoRef.current
      const container = containerRef.current
      if (!video || !container) throw new Error("Missing video or container ref")

      const mirrored = useCameraStore.getState().isMirrored

      if (forStrip) {
        return captureStripCell(video, mirrored)
      }

      const { exportBlob } = await compositePhoto(video, container, mirrored)
      return exportBlob
    },
    [videoRef, containerRef],
  )

  return { captureOnePhoto }
}