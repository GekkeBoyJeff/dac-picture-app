import { IMAGE } from "./config"
import { getVideoCrop, getCanvasSize, drawVideoFrame } from "./canvas/videoFrame"
import { drawVignettes } from "./canvas/vignettes"
import { drawImageOverlays } from "./canvas/imageOverlays"
import { drawTitle, drawDate } from "./canvas/textOverlays"

/**
 * Creates a photo by reading overlay positions directly from the DOM.
 *
 * Why DOM measurement instead of recalculating positions in JS?
 * CSS is the single source of truth for overlay placement. By reading
 * getBoundingClientRect() at capture time, the photo is guaranteed to
 * match the on-screen preview exactly — regardless of screen size,
 * orientation, or aspect ratio. No duplication of layout logic needed.
 *
 * @param {HTMLVideoElement} video
 * @param {HTMLElement} container
 * @param {boolean} [mirror=true]
 * @returns {Promise<{exportBlob: Blob, galleryDataUrl: string}>}
 */
export async function compositePhoto(video, container, mirror = true) {
  const containerRect = container.getBoundingClientRect()
  const crop = getVideoCrop(video, containerRect)

  // --- Canvas setup ---
  const { canvasW, canvasH } = getCanvasSize(crop.srcW, crop.srcH)

  const canvas = document.createElement("canvas")
  canvas.width = canvasW
  canvas.height = canvasH
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Failed to get canvas 2D context")

  // --- Draw video ---
  drawVideoFrame(ctx, video, crop, { canvasW, canvasH }, mirror)

  // --- Scale factors: canvas pixels per screen pixel ---
  const scaleX = canvasW / containerRect.width
  const scaleY = canvasH / containerRect.height

  // --- Vignettes (procedural — always full-canvas) ---
  drawVignettes(ctx, canvasW, canvasH)

  // --- Image overlays (corners, main overlays, QR) ---
  await drawImageOverlays(ctx, container, containerRect, scaleX, scaleY)

  // --- Title text ---
  const titleEl = container.querySelector('[data-overlay="title"]')
  if (titleEl) {
    drawTitle(ctx, titleEl, containerRect, scaleX, scaleY)
  }

  // --- Date stamp ---
  const dateEl = container.querySelector('[data-overlay="date"]')
  if (dateEl) {
    drawDate(ctx, dateEl, containerRect, scaleX, scaleY)
  }

  const exportBlob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))),
      IMAGE.FORMAT,
      IMAGE.EXPORT_QUALITY,
    )
  })

  const galleryDataUrl = canvas.toDataURL(IMAGE.FORMAT, IMAGE.GALLERY_QUALITY)

  return { exportBlob, galleryDataUrl }
}