import { measureBoxRect } from "./overlayMeasurer"

export function drawTitle(ctx, el, containerRect, scaleX, scaleY) {
  const span = el.querySelector("span")
  if (!span) return

  const style = getComputedStyle(span)
  const elRect = el.getBoundingClientRect()
  const measured = measureBoxRect(elRect, containerRect, scaleX, scaleY)
  const fontSize = parseFloat(style.fontSize) * scaleY
  const x = measured.x
  const y = measured.y

  ctx.save()
  ctx.globalAlpha = parseFloat(style.opacity) || 0.9
  ctx.font = `600 ${fontSize}px Arial, sans-serif`
  ctx.fillStyle = "white"
  ctx.letterSpacing = `${parseFloat(style.letterSpacing || "0") * scaleX}px`
  ctx.shadowColor = "rgba(0,0,0,0.8)"
  ctx.shadowBlur = 12 * Math.min(scaleX, scaleY)
  ctx.shadowOffsetY = 2 * scaleY

  // The title has two lines: "Dutch Anime" and "Community"
  // Measure actual line height from the span's computed style
  const lineHeight = parseFloat(style.lineHeight) || fontSize * 1.2
  const scaledLineHeight = lineHeight * scaleY

  ctx.fillText("DUTCH ANIME", x, y + fontSize)
  ctx.fillText("COMMUNITY", x, y + fontSize + scaledLineHeight)
  ctx.restore()
}

export function drawDate(ctx, el, containerRect, scaleX, scaleY) {
  const style = getComputedStyle(el)
  const elRect = el.getBoundingClientRect()
  const measured = measureBoxRect(elRect, containerRect, scaleX, scaleY)
  const fontSize = parseFloat(style.fontSize) * scaleY

  const text = el.textContent || ""
  const x = measured.x
  const y = measured.y

  ctx.save()
  ctx.globalAlpha = parseFloat(style.opacity) || 0.7
  ctx.font = `${fontSize}px 'Courier New', monospace`
  ctx.fillStyle = "white"
  ctx.shadowColor = "rgba(0,0,0,0.9)"
  ctx.shadowBlur = 4 * Math.min(scaleX, scaleY)
  ctx.fillText(text, x, y + fontSize)
  ctx.restore()
}