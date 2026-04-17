/**
 * Compute the source crop rectangle so the video fills the container
 * with object-fit: cover semantics.
 * @param {HTMLVideoElement} video
 * @param {DOMRect} containerRect
 * @returns {{ srcX: number, srcY: number, srcW: number, srcH: number }}
 */
export function getVideoCrop(video, containerRect) {
  const containerAspect = containerRect.width / containerRect.height
  const vw = video.videoWidth || 1920
  const vh = video.videoHeight || 1080
  const videoAspect = vw / vh

  let srcX = 0
  let srcY = 0
  let srcW = vw
  let srcH = vh

  if (videoAspect > containerAspect) {
    srcW = Math.round(vh * containerAspect)
    srcX = Math.round((vw - srcW) / 2)
  } else if (videoAspect < containerAspect) {
    srcH = Math.round(vw / containerAspect)
    srcY = Math.round((vh - srcH) / 2)
  }

  return { srcX, srcY, srcW, srcH }
}

/**
 * Compute the output canvas dimensions, capped to a pixel budget.
 * @param {number} srcW
 * @param {number} srcH
 * @param {number} maxPixels - pixel budget from getMaxCanvasPixels()
 * @returns {{ canvasW: number, canvasH: number }}
 */
export function getCanvasSize(srcW, srcH, maxPixels) {
  let canvasW = srcW
  let canvasH = srcH

  if (canvasW * canvasH > maxPixels) {
    const scale = Math.sqrt(maxPixels / (canvasW * canvasH))
    canvasW = Math.round(canvasW * scale)
    canvasH = Math.round(canvasH * scale)
  }

  return { canvasW, canvasH }
}

/**
 * Draw the video frame onto the canvas, optionally mirrored.
 * @param {CanvasRenderingContext2D} ctx
 * @param {HTMLVideoElement} video
 * @param {{ srcX: number, srcY: number, srcW: number, srcH: number }} crop
 * @param {{ canvasW: number, canvasH: number }} size
 * @param {boolean} mirror
 */
export function drawVideoFrame(ctx, video, crop, size, mirror) {
  const { srcX, srcY, srcW, srcH } = crop
  const { canvasW, canvasH } = size

  if (mirror) {
    ctx.save()
    ctx.translate(canvasW, 0)
    ctx.scale(-1, 1)
    ctx.drawImage(video, srcX, srcY, srcW, srcH, 0, 0, canvasW, canvasH)
    ctx.restore()
    return
  }

  ctx.drawImage(video, srcX, srcY, srcW, srcH, 0, 0, canvasW, canvasH)
}