import { STRIP_CANVAS } from "@/lib/config"

const { WIDTH, HEIGHT, MARGIN_X, ACCENT_COLOR, BRANDING_Y } = STRIP_CANVAS

// -- Shape helpers --

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

// -- Doodles --

/**
 * Draw playful semi-transparent shapes in the branding zone background.
 * All coordinates are derived proportionally from STRIP_CANVAS constants.
 * @param {CanvasRenderingContext2D} ctx
 */
export function drawDoodles(ctx) {
  const zoneTop = BRANDING_Y + 10
  const zoneBottom = HEIGHT - 20
  const zoneH = zoneBottom - zoneTop

  const doodles = [
    { type: "star", x: WIDTH * 0.76, y: zoneTop + zoneH * 0.15, size: 18, a: 0.3 },
    { type: "star", x: WIDTH * 0.89, y: zoneTop + zoneH * 0.5, size: 12, a: 0.24 },
    { type: "star", x: WIDTH * 0.11, y: zoneBottom - zoneH * 0.2, size: 14, a: 0.24 },
    { type: "star", x: WIDTH * 0.46, y: zoneBottom - zoneH * 0.07, size: 10, a: 0.2 },
    { type: "heart", x: WIDTH * 0.81, y: zoneBottom - zoneH * 0.35, size: 20, a: 0.24 },
    { type: "heart", x: WIDTH * 0.19, y: zoneBottom - zoneH * 0.1, size: 14, a: 0.2 },
    { type: "circle", x: WIDTH * 0.7, y: zoneTop + zoneH * 0.33, size: 12, a: 0.2 },
    { type: "circle", x: WIDTH * 0.91, y: zoneBottom - zoneH * 0.15, size: 9, a: 0.24 },
    { type: "circle", x: WIDTH * 0.28, y: zoneTop + zoneH * 0.5, size: 14, a: 0.16 },
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

  for (const { type, x, y, size, a } of doodles) {
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
  }

  ctx.restore()
}

// -- Sparkles --

/**
 * Draw corner sparkle accents.
 * @param {CanvasRenderingContext2D} ctx
 */
export function drawSparkles(ctx) {
  const spots = [
    { x: MARGIN_X - 16, y: 20, s: 6, a: 0.3 },
    { x: WIDTH - MARGIN_X + 16, y: 22, s: 5, a: 0.25 },
    { x: MARGIN_X - 18, y: BRANDING_Y - 20, s: 5, a: 0.2 },
    { x: WIDTH - MARGIN_X + 18, y: BRANDING_Y - 24, s: 4, a: 0.18 },
    { x: MARGIN_X + 4, y: HEIGHT - 25, s: 5, a: 0.2 },
  ]
  for (const { x, y, s, a } of spots) {
    drawSparkle(ctx, x, y, s, a)
  }
}