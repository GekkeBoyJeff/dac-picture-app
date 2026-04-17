import { STRIP_CANVAS, STRIP_BRANDING } from "@/lib/config"
import { LOGO, QR_CODE } from "@/lib/config/overlays"
import { MASCOTS } from "@/lib/config/presets"
import { loadImage } from "./imageLoader"

// Re-export decorations so compositeStrip can import everything from here
export { drawDoodles, drawSparkles } from "./stripDecorations"

const {
  WIDTH,
  HEIGHT,
  MARGIN_X,
  ACCENT_COLOR,
  PHOTO_TOP,
  BRANDING_Y,
  LOGO_SIZE,
  QR_SIZE,
  BORDER_RADIUS,
  MASCOT_MAX_HEIGHT,
  MASCOT_MAX_WIDTH,
  CONVENTION_BANNER_MAX_H,
  CONVENTION_BANNER_MAX_W,
} = STRIP_CANVAS

// -- Assets --

/**
 * Load all strip assets. Pure — mascotId and convention passed as params.
 * @param {string} mascotId
 * @param {object | null} convention
 */
export async function loadStripAssets(mascotId, convention) {
  const mascot = MASCOTS.find((m) => m.id === mascotId) || MASCOTS[0]

  const [logo, qr, mascotImg, conventionBanner] = await Promise.all([
    loadImage(LOGO.src),
    loadImage(QR_CODE.src),
    loadImage(mascot.path),
    convention ? loadImage(convention.bannerPath).catch(() => null) : Promise.resolve(null),
  ])

  return { logo, qr, mascotImg, conventionBanner, convention }
}

// -- QR top right --

/**
 * Draw QR code overlapping the first photo, top-right corner.
 * @param {CanvasRenderingContext2D} ctx
 * @param {HTMLImageElement} qr
 */
export function drawQrTopRight(ctx, qr) {
  const inset = BORDER_RADIUS + 8
  const qrX = WIDTH - MARGIN_X - inset - QR_SIZE
  const qrY = PHOTO_TOP + inset

  ctx.save()
  ctx.globalAlpha = 0.85
  ctx.drawImage(qr, qrX, qrY, QR_SIZE, QR_SIZE)
  ctx.restore()

  ctx.save()
  ctx.textBaseline = "top"
  ctx.textAlign = "center"
  ctx.font = STRIP_BRANDING.FONT_SMALL
  ctx.fillStyle = "#ffffff"
  ctx.globalAlpha = 0.5
  const ctaLines = STRIP_BRANDING.DISCORD_CTA.split("\n")
  const ctaX = qrX + QR_SIZE / 2
  let ctaY = qrY + QR_SIZE + 12
  for (const line of ctaLines) {
    ctx.fillText(line, ctaX, ctaY)
    ctaY += 32
  }
  ctx.restore()
}

// -- Branding zone --

/**
 * Draw the branding zone: logo, heading, convention name, date, banner.
 * @param {CanvasRenderingContext2D} ctx
 * @param {HTMLImageElement} logo
 * @param {HTMLImageElement | null} conventionBanner
 * @param {object | null} convention
 */
export function drawBrandingZone(ctx, logo, conventionBanner, convention) {
  const x = MARGIN_X
  const zoneH = HEIGHT - BRANDING_Y

  let bannerH = 0
  let bannerW = 0
  if (conventionBanner) {
    const bannerScale = Math.min(
      CONVENTION_BANNER_MAX_W / conventionBanner.naturalWidth,
      CONVENTION_BANNER_MAX_H / conventionBanner.naturalHeight,
    )
    bannerW = conventionBanner.naturalWidth * bannerScale
    bannerH = conventionBanner.naturalHeight * bannerScale
  }
  const dateLineH = 44
  const contentH = LOGO_SIZE + 30 + dateLineH + (bannerH > 0 ? 30 + bannerH : 0)
  const topPad = Math.max(24, (zoneH - contentH) / 2)

  let y = BRANDING_Y + topPad

  // DAC logo
  ctx.save()
  ctx.shadowColor = "rgba(230, 193, 137, 0.3)"
  ctx.shadowBlur = 16
  ctx.drawImage(logo, x, y, LOGO_SIZE, LOGO_SIZE)
  ctx.restore()

  // "Dutch Anime Community"
  const textX = x + LOGO_SIZE + 24
  ctx.save()
  ctx.textBaseline = "top"
  ctx.font = STRIP_BRANDING.FONT_HEADING
  ctx.fillStyle = "#ffffff"
  ctx.globalAlpha = 0.94
  ctx.fillText(STRIP_BRANDING.COMMUNITY_NAME, textX, y + 4)
  ctx.restore()

  // Convention name
  let dateY = y + 62
  if (convention) {
    ctx.save()
    ctx.textBaseline = "top"
    ctx.font = STRIP_BRANDING.FONT_CONVENTION
    ctx.fillStyle = ACCENT_COLOR
    ctx.globalAlpha = 0.75
    ctx.fillText(convention.name, textX, y + 62)
    ctx.restore()
    dateY = y + 62 + 48
  }

  // Date
  const dateStr = new Date().toLocaleDateString(STRIP_BRANDING.DATE_LOCALE, {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
  ctx.save()
  ctx.textBaseline = "top"
  ctx.font = STRIP_BRANDING.FONT_DATE
  ctx.fillStyle = ACCENT_COLOR
  ctx.globalAlpha = 0.5
  ctx.fillText(dateStr, textX, dateY)
  ctx.restore()

  y += LOGO_SIZE + 30

  // Convention banner
  if (conventionBanner && bannerH > 0) {
    y += 30 + dateLineH
    ctx.save()
    ctx.globalAlpha = 0.92
    ctx.drawImage(conventionBanner, x, y, bannerW, bannerH)
    ctx.restore()
  }
}

// -- Mascot --

/**
 * Draw the mascot overlapping the bottom photo, right-aligned.
 * @param {CanvasRenderingContext2D} ctx
 * @param {HTMLImageElement} mascotImg
 */
export function drawMascot(ctx, mascotImg) {
  const scale = Math.min(
    MASCOT_MAX_WIDTH / mascotImg.naturalWidth,
    MASCOT_MAX_HEIGHT / mascotImg.naturalHeight,
  )
  const mW = mascotImg.naturalWidth * scale
  const mH = mascotImg.naturalHeight * scale
  const mX = WIDTH - MARGIN_X - mW + 12
  const mY = HEIGHT - 12 - mH

  ctx.save()
  ctx.globalAlpha = 0.92
  ctx.drawImage(mascotImg, mX, mY, mW, mH)
  ctx.restore()
}