import { getMaxCanvasPixels, isLowPowerDevice } from "@/lib/deviceCapability"
import { useUiStore } from "@/stores/uiStore"

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
 * @param {number} srcW
 * @param {number} srcH
 * @param {"single" | "strip"} [mode="single"]
 */
export function getCanvasSize(srcW, srcH, mode = "single") {
  const lowPower = useUiStore.getState().forceLowPower || isLowPowerDevice()
  const maxPixels = getMaxCanvasPixels(mode, lowPower)
  let canvasW = srcW
  let canvasH = srcH

  if (canvasW * canvasH > maxPixels) {
    const s = Math.sqrt(maxPixels / (canvasW * canvasH))
    canvasW = Math.round(canvasW * s)
    canvasH = Math.round(canvasH * s)
  }

  return { canvasW, canvasH }
}

export function drawVideoFrame(ctx, video, crop, canvasSize, mirror) {
  const { srcX, srcY, srcW, srcH } = crop
  const { canvasW, canvasH } = canvasSize

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