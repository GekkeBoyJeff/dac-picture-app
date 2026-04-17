/**
 * Draw three vignette gradients: radial, bottom, and top.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} w - canvas width
 * @param {number} h - canvas height
 */
export function drawVignettes(ctx, w, h) {
  // Radial vignette
  const cx = w / 2
  const cy = h / 2
  const outerR = Math.sqrt(cx * cx + cy * cy)
  const radial = ctx.createRadialGradient(cx, cy, outerR * 0.35, cx, cy, outerR)
  radial.addColorStop(0, "transparent")
  radial.addColorStop(1, "rgba(0,0,0,0.4)")
  ctx.fillStyle = radial
  ctx.fillRect(0, 0, w, h)

  // Bottom gradient (45% height)
  const bottomH = h * 0.45
  const bottomGrad = ctx.createLinearGradient(0, h - bottomH, 0, h)
  bottomGrad.addColorStop(0, "transparent")
  bottomGrad.addColorStop(0.4, "rgba(0,0,0,0.2)")
  bottomGrad.addColorStop(1, "rgba(0,0,0,0.5)")
  ctx.fillStyle = bottomGrad
  ctx.fillRect(0, h - bottomH, w, bottomH)

  // Top gradient (20% height)
  const topH = h * 0.2
  const topGrad = ctx.createLinearGradient(0, 0, 0, topH)
  topGrad.addColorStop(0, "rgba(0,0,0,0.4)")
  topGrad.addColorStop(1, "transparent")
  ctx.fillStyle = topGrad
  ctx.fillRect(0, 0, w, topH)
}