import { STRIP_CANVAS, STRIP_BRANDING } from "@/lib/config"
import { LOGO, QR_CODE } from "@/lib/config/overlays"
import { getActiveConvention, MASCOTS } from "@/lib/config/presets"
import { useOverlayStore } from "@/stores/overlayStore"
import { loadImage } from "./imageLoader"

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

// ---------------------------------------------------------------------------
// Assets
// ---------------------------------------------------------------------------

export async function loadStripAssets() {
  const mascotId = useOverlayStore.getState().mascotId
  const mascot = MASCOTS.find((m) => m.id === mascotId) || MASCOTS[0]
  const convention = getActiveConvention()

  const [logo, qr, mascotImg, conventionBanner] = await Promise.all([
    loadImage(LOGO.src),
    loadImage(QR_CODE.src),
    loadImage(mascot.path),
    convention ? loadImage(convention.bannerPath).catch(() => null) : Promise.resolve(null),
  ])
  return { logo, qr, mascotImg, conventionBanner, convention }
}

// ---------------------------------------------------------------------------
// Doodles — playful semi-transparent shapes in the branding zone background
// ---------------------------------------------------------------------------

function drawStar(ctx, cx, cy, outerR, innerR, points) {
  ctx.beginPath()
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR
    const a = (Math.PI / points) * i - Math.PI / 2
    ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r)
  }
  ctx.closePath()
}

function drawHeart(ctx, cx, cy, size) {
  ctx.beginPath()
  ctx.moveTo(cx, cy + size * 0.3)
  ctx.bezierCurveTo(
    cx - size * 0.5,
    cy - size * 0.3,
    cx - size,
    cy + size * 0.1,
    cx,
    cy + size * 0.8,
  )
  ctx.bezierCurveTo(
    cx + size,
    cy + size * 0.1,
    cx + size * 0.5,
    cy - size * 0.3,
    cx,
    cy + size * 0.3,
  )
  ctx.closePath()
}

export function drawDoodles(ctx) {
  const zoneTop = BRANDING_Y + 10
  const zoneBottom = HEIGHT - 20

  const zoneH = zoneBottom - zoneTop

  const doodles = [
    // Stars — positioned relative to WIDTH and zone
    { type: "star", x: WIDTH * 0.76, y: zoneTop + zoneH * 0.15, size: 18, a: 0.3 },
    { type: "star", x: WIDTH * 0.89, y: zoneTop + zoneH * 0.5, size: 12, a: 0.24 },
    { type: "star", x: WIDTH * 0.11, y: zoneBottom - zoneH * 0.2, size: 14, a: 0.24 },
    { type: "star", x: WIDTH * 0.46, y: zoneBottom - zoneH * 0.07, size: 10, a: 0.2 },
    // Hearts
    { type: "heart", x: WIDTH * 0.81, y: zoneBottom - zoneH * 0.35, size: 20, a: 0.24 },
    { type: "heart", x: WIDTH * 0.19, y: zoneBottom - zoneH * 0.1, size: 14, a: 0.2 },
    // Circles
    { type: "circle", x: WIDTH * 0.7, y: zoneTop + zoneH * 0.33, size: 12, a: 0.2 },
    { type: "circle", x: WIDTH * 0.91, y: zoneBottom - zoneH * 0.15, size: 9, a: 0.24 },
    { type: "circle", x: WIDTH * 0.28, y: zoneTop + zoneH * 0.5, size: 14, a: 0.16 },
    // Small dots
    { type: "dot", x: WIDTH * 0.63, y: zoneTop + zoneH * 0.1, size: 4, a: 0.3 },
    { type: "dot", x: WIDTH * 0.79, y: zoneBottom - zoneH * 0.07, size: 5, a: 0.24 },
    { type: "dot", x: WIDTH * 0.14, y: zoneTop + zoneH * 0.35, size: 4, a: 0.2 },
    { type: "dot", x: WIDTH * 0.93, y: zoneTop + zoneH * 0.25, size: 4, a: 0.24 },
    { type: "dot", x: WIDTH * 0.41, y: zoneTop + zoneH * 0.2, size: 3, a: 0.2 },
  ]

  ctx.save()
  ctx.fillStyle = ACCENT_COLOR
  ctx.strokeStyle = ACCENT_COLOR
  ctx.lineWidth = 1.5

  doodles.forEach(({ type, x, y, size, a }) => {
    ctx.globalAlpha = a

    if (type === "star") {
      drawStar(ctx, x, y, size, size * 0.4, 5)
      ctx.stroke()
    } else if (type === "heart") {
      drawHeart(ctx, x, y, size)
      ctx.stroke()
    } else if (type === "circle") {
      ctx.beginPath()
      ctx.arc(x, y, size, 0, Math.PI * 2)
      ctx.stroke()
    } else if (type === "dot") {
      ctx.beginPath()
      ctx.arc(x, y, size, 0, Math.PI * 2)
      ctx.fill()
    }
  })

  ctx.restore()
}

// ---------------------------------------------------------------------------
// Sparkles — corner accents
// ---------------------------------------------------------------------------

function drawSparkle(ctx, cx, cy, size, alpha) {
  const outer = size
  const inner = size * 0.3
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.fillStyle = ACCENT_COLOR
  ctx.beginPath()
  for (let i = 0; i < 4; i++) {
    const a = (Math.PI / 2) * i - Math.PI / 2
    ctx.lineTo(cx + Math.cos(a) * outer, cy + Math.sin(a) * outer)
    ctx.lineTo(cx + Math.cos(a + Math.PI / 4) * inner, cy + Math.sin(a + Math.PI / 4) * inner)
  }
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

export function drawSparkles(ctx) {
  const spots = [
    { x: MARGIN_X - 16, y: 20, s: 6, a: 0.3 },
    { x: WIDTH - MARGIN_X + 16, y: 22, s: 5, a: 0.25 },
    { x: MARGIN_X - 18, y: BRANDING_Y - 20, s: 5, a: 0.2 },
    { x: WIDTH - MARGIN_X + 18, y: BRANDING_Y - 24, s: 4, a: 0.18 },
    { x: MARGIN_X + 4, y: HEIGHT - 25, s: 5, a: 0.2 },
  ]
  spots.forEach(({ x, y, s, a }) => drawSparkle(ctx, x, y, s, a))
}

// ---------------------------------------------------------------------------
// Branding zone — all left-aligned, right side reserved for mascot
// ---------------------------------------------------------------------------

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

export function drawBrandingZone(ctx, logo, conventionBanner, convention) {
  const x = MARGIN_X
  const zoneH = HEIGHT - BRANDING_Y

  // Measure content height to vertically center in the zone
  // Logo row: LOGO_SIZE, gap: 30, date: dateLineH, gap: 30, banner: ~bannerH
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
  const dateLineH = 44 // approximate height for 32px date font
  const contentH = LOGO_SIZE + 30 + dateLineH + (bannerH > 0 ? 30 + bannerH : 0)
  const topPad = Math.max(24, (zoneH - contentH) / 2)

  let y = BRANDING_Y + topPad

  // --- DAC logo ---
  ctx.save()
  ctx.shadowColor = "rgba(230, 193, 137, 0.3)"
  ctx.shadowBlur = 16
  ctx.drawImage(logo, x, y, LOGO_SIZE, LOGO_SIZE)
  ctx.restore()

  // --- "Dutch Anime Community" — vertically centered with logo top half ---
  const textX = x + LOGO_SIZE + 24
  ctx.save()
  ctx.textBaseline = "top"
  ctx.font = STRIP_BRANDING.FONT_HEADING
  ctx.fillStyle = "#ffffff"
  ctx.globalAlpha = 0.94
  ctx.fillText(STRIP_BRANDING.COMMUNITY_NAME, textX, y + 4)
  ctx.restore()

  // --- Convention name — below heading, still beside logo ---
  let dateY = y + 62 // default: below heading
  if (convention) {
    ctx.save()
    ctx.textBaseline = "top"
    ctx.font = STRIP_BRANDING.FONT_CONVENTION
    ctx.fillStyle = ACCENT_COLOR
    ctx.globalAlpha = 0.75
    ctx.fillText(convention.name, textX, y + 62)
    ctx.restore()
    dateY = y + 62 + 48 // below convention name
  }

  // --- Date — aligned with heading text ---
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

  // --- Convention banner ---
  if (conventionBanner && bannerH > 0) {
    y += 30 + dateLineH
    ctx.save()
    ctx.globalAlpha = 0.92
    ctx.drawImage(conventionBanner, x, y, bannerW, bannerH)
    ctx.restore()
  }
}

// ---------------------------------------------------------------------------
// Mascot — overlaps bottom photo, right-aligned
// ---------------------------------------------------------------------------

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
