import { IMAGE, STRIP_CANVAS, DEFAULT_MASCOT_ID } from "@/lib/config"
import { getActiveConvention } from "@/lib/config/presets"
import {
  loadStripAssets,
  drawDoodles,
  drawSparkles,
  drawBrandingZone,
  drawQrTopRight,
  drawMascot,
} from "./stripBranding"

const {
  WIDTH,
  HEIGHT,
  MARGIN_X,
  BG_COLOR,
  ACCENT_COLOR,
  PHOTO_TOP,
  PHOTO_HEIGHT,
  PHOTO_GAP,
  BORDER_RADIUS,
} = STRIP_CANVAS

/**
 * Combine photo blobs into a 9:16 strip with branding.
 * Pure — assets config is passed in, no store access.
 *
 * @param {Blob[]} photoBlobs
 * @param {{ mascotId: string, convention: object | null }} assets
 * @returns {Promise<Blob>}
 */
export async function compositeStrip(photoBlobs, assets = {}) {
  const mascotId = assets.mascotId || DEFAULT_MASCOT_ID
  const convention = assets.convention !== undefined ? assets.convention : getActiveConvention()

  const [images, stripAssets] = await Promise.all([
    Promise.all(
      photoBlobs.map(
        (blob) =>
          new Promise((resolve, reject) => {
            const img = new Image()
            img.onload = () => resolve(img)
            img.onerror = reject
            img.src = URL.createObjectURL(blob)
          }),
      ),
    ),
    loadStripAssets(mascotId, convention),
  ])

  const canvas = document.createElement("canvas")
  canvas.width = WIDTH
  canvas.height = HEIGHT
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Failed to get canvas 2D context")

  // Solid background
  ctx.fillStyle = BG_COLOR
  ctx.fillRect(0, 0, WIDTH, HEIGHT)

  // Photos
  const cellW = WIDTH - MARGIN_X * 2

  for (let i = 0; i < images.length; i++) {
    const img = images[i]
    const x = MARGIN_X
    const y = PHOTO_TOP + i * (PHOTO_HEIGHT + PHOTO_GAP)

    // Object-cover crop
    const imgAspect = img.naturalWidth / img.naturalHeight
    const cellAspect = cellW / PHOTO_HEIGHT
    let srcX = 0
    let srcY = 0
    let srcW = img.naturalWidth
    let srcH = img.naturalHeight

    if (imgAspect > cellAspect) {
      srcW = Math.round(img.naturalHeight * cellAspect)
      srcX = Math.round((img.naturalWidth - srcW) / 2)
    } else {
      srcH = Math.round(img.naturalWidth / cellAspect)
      srcY = Math.round((img.naturalHeight - srcH) / 2)
    }

    ctx.save()
    ctx.beginPath()
    ctx.roundRect(x, y, cellW, PHOTO_HEIGHT, BORDER_RADIUS)
    ctx.clip()
    ctx.drawImage(img, srcX, srcY, srcW, srcH, x, y, cellW, PHOTO_HEIGHT)
    ctx.restore()
  }

  // QR top-right (overlaps first photo)
  drawQrTopRight(ctx, stripAssets.qr)

  // Playful doodles in branding zone background
  drawDoodles(ctx)

  // Branding
  drawBrandingZone(ctx, stripAssets.logo, stripAssets.conventionBanner, convention)

  // Mascot (overlaps bottom photo)
  drawMascot(ctx, stripAssets.mascotImg)

  // Sparkles
  drawSparkles(ctx)

  // Outer border
  ctx.save()
  ctx.strokeStyle = ACCENT_COLOR
  ctx.globalAlpha = 0.12
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.roundRect(6, 6, WIDTH - 12, HEIGHT - 12, 10)
  ctx.stroke()
  ctx.restore()

  // Cleanup object URLs
  for (const img of images) {
    URL.revokeObjectURL(img.src)
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))),
      IMAGE.FORMAT,
      IMAGE.EXPORT_QUALITY,
    )
  })
}