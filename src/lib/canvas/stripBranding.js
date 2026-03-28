import { STRIP_CANVAS, STRIP_BRANDING } from "@/lib/config"
import { LOGO, QR_CODE } from "@/lib/config/overlays"
import { getActiveConvention, MASCOTS } from "@/lib/config/presets"
import { useOverlayStore } from "@/stores/overlayStore"
import { loadImage } from "./imageLoader"

const {
  WIDTH, HEIGHT, MARGIN_X, ACCENT_COLOR,
  BRANDING_Y, LOGO_SIZE, QR_SIZE, BORDER_RADIUS,
  MASCOT_MAX_HEIGHT, MASCOT_MAX_WIDTH,
  CONVENTION_BANNER_MAX_H, CONVENTION_BANNER_MAX_W,
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
  return { logo, qr, mascotImg, conventionBanner }
}

// ---------------------------------------------------------------------------
// Photo frame — thin gold hairline
// ---------------------------------------------------------------------------

export function drawPhotoFrame(ctx, x, y, w, h) {
  ctx.save()
  ctx.strokeStyle = ACCENT_COLOR
  ctx.globalAlpha = 0.25
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, BORDER_RADIUS)
  ctx.stroke()
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
    { x: 24, y: 22, s: 6, a: 0.3 },
    { x: 1056, y: 24, s: 5, a: 0.25 },
    { x: 22, y: 1580, s: 5, a: 0.2 },
    { x: 1058, y: 1576, s: 4, a: 0.18 },
    { x: 44, y: 1900, s: 5, a: 0.2 },
  ]
  spots.forEach(({ x, y, s, a }) => drawSparkle(ctx, x, y, s, a))
}

// ---------------------------------------------------------------------------
// Branding zone — all left-aligned, right side reserved for mascot
// ---------------------------------------------------------------------------

export function drawBrandingZone(ctx, logo, qr, conventionBanner) {
  const convention = getActiveConvention()
  const x = MARGIN_X
  const contentW = WIDTH - MARGIN_X * 2

  // Thin gold separator
  ctx.save()
  ctx.strokeStyle = ACCENT_COLOR
  ctx.globalAlpha = 0.12
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(x, BRANDING_Y + 8)
  ctx.lineTo(x + contentW, BRANDING_Y + 8)
  ctx.stroke()
  ctx.restore()

  // --- Identity row: logo + text ---
  let y = BRANDING_Y + 28

  ctx.save()
  ctx.shadowColor = "rgba(230, 193, 137, 0.2)"
  ctx.shadowBlur = 10
  ctx.drawImage(logo, x, y, LOGO_SIZE, LOGO_SIZE)
  ctx.restore()

  const textX = x + LOGO_SIZE + 12
  ctx.save()
  ctx.textBaseline = "top"
  ctx.font = STRIP_BRANDING.FONT_HEADING
  ctx.fillStyle = "#ffffff"
  ctx.globalAlpha = 0.9
  ctx.fillText(STRIP_BRANDING.COMMUNITY_NAME, textX, y + 4)
  ctx.restore()

  if (convention) {
    ctx.save()
    ctx.textBaseline = "top"
    ctx.font = STRIP_BRANDING.FONT_CONVENTION
    ctx.fillStyle = ACCENT_COLOR
    ctx.globalAlpha = 0.65
    ctx.fillText(convention.name, textX, y + 30)
    ctx.restore()
  }

  // --- Date ---
  y += LOGO_SIZE + 18
  const dateStr = new Date().toLocaleDateString(STRIP_BRANDING.DATE_LOCALE, {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
  ctx.save()
  ctx.textBaseline = "top"
  ctx.font = STRIP_BRANDING.FONT_DATE
  ctx.fillStyle = ACCENT_COLOR
  ctx.globalAlpha = 0.4
  ctx.fillText(dateStr, x, y)
  ctx.restore()

  // --- Convention banner ---
  if (conventionBanner) {
    y += 24
    const bannerScale = Math.min(
      CONVENTION_BANNER_MAX_W / conventionBanner.naturalWidth,
      CONVENTION_BANNER_MAX_H / conventionBanner.naturalHeight,
    )
    const bW = conventionBanner.naturalWidth * bannerScale
    const bH = conventionBanner.naturalHeight * bannerScale

    ctx.save()
    ctx.globalAlpha = 0.85
    ctx.drawImage(conventionBanner, x, y, bW, bH)
    ctx.restore()

    y += bH + 14
  } else {
    y += 24
  }

  // --- QR + Discord ---
  ctx.save()
  ctx.globalAlpha = 0.55
  ctx.drawImage(qr, x, y, QR_SIZE, QR_SIZE)
  ctx.restore()

  ctx.save()
  ctx.textBaseline = "middle"
  ctx.font = STRIP_BRANDING.FONT_SMALL
  ctx.fillStyle = "#ffffff"
  ctx.globalAlpha = 0.3
  ctx.fillText(STRIP_BRANDING.DISCORD_CTA, x + QR_SIZE + 10, y + QR_SIZE / 2)
  ctx.restore()
}

// ---------------------------------------------------------------------------
// Mascot — overlaps bottom photo, right-aligned
// ---------------------------------------------------------------------------

export function drawMascot(ctx, mascotImg) {
  const scale = Math.min(MASCOT_MAX_WIDTH / mascotImg.naturalWidth, MASCOT_MAX_HEIGHT / mascotImg.naturalHeight)
  const mW = mascotImg.naturalWidth * scale
  const mH = mascotImg.naturalHeight * scale
  const mX = WIDTH - MARGIN_X - mW + 12
  const mY = HEIGHT - 12 - mH

  ctx.save()
  ctx.shadowColor = "rgba(0, 0, 0, 0.4)"
  ctx.shadowBlur = 20
  ctx.shadowOffsetX = -3
  ctx.shadowOffsetY = 2
  ctx.globalAlpha = 0.92
  ctx.drawImage(mascotImg, mX, mY, mW, mH)
  ctx.restore()
}