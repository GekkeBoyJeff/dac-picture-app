import { IMAGE } from "@/lib/config"
import { getVideoCrop, getCanvasSize, drawVideoFrame } from "./videoFrame"
import { drawVignettes } from "./vignettes"
import { drawImageOverlays } from "./imageOverlays"
import { drawTitle, drawDate } from "./textOverlays"

/**
 * Creates a photo by reading overlay positions directly from the DOM.
 *
 * @param {HTMLVideoElement} video
 * @param {HTMLElement} container
 * @param {boolean} [mirror=true]
 * @param {object} [options]
 * @param {string[]} [options.excludeImageTypes] - Image types to exclude (e.g. ["logo", "convention"])
 * @param {boolean} [options.excludeText] - Skip title and date overlays
 * @returns {Promise<{exportBlob: Blob}>}
 */
export async function compositePhoto(video, container, mirror = true, options = {}) {
  const { excludeImageTypes, excludeText = false } = options

  const containerRect = container.getBoundingClientRect()
  const crop = getVideoCrop(video, containerRect)
  const { canvasW, canvasH } = getCanvasSize(crop.srcW, crop.srcH)

  const canvas = document.createElement("canvas")
  canvas.width = canvasW
  canvas.height = canvasH
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Failed to get canvas 2D context")

  drawVideoFrame(ctx, video, crop, { canvasW, canvasH }, mirror)

  const scaleX = canvasW / containerRect.width
  const scaleY = canvasH / containerRect.height

  drawVignettes(ctx, canvasW, canvasH)

  await drawImageOverlays(ctx, container, containerRect, scaleX, scaleY, { excludeImageTypes })

  if (!excludeText) {
    const titleEl = container.querySelector('[data-overlay="title"]')
    if (titleEl) drawTitle(ctx, titleEl, containerRect, scaleX, scaleY)

    const dateEl = container.querySelector('[data-overlay="date"]')
    if (dateEl) drawDate(ctx, dateEl, containerRect, scaleX, scaleY)
  }

  const exportBlob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))),
      IMAGE.FORMAT,
      IMAGE.EXPORT_QUALITY,
    )
  })

  return { exportBlob }
}