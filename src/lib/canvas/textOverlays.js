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

  const lineHeight = parseFloat(style.lineHeight) || fontSize * 1.2
  const scaledLineHeight = lineHeight * scaleY

  // Read lines from DOM instead of hardcoded strings
  const spans = el.querySelectorAll("span")
  if (spans.length > 0) {
    spans.forEach((s, i) => {
      ctx.fillText(s.textContent, x, y + fontSize + scaledLineHeight * i)
    })
  } else {
    // Fallback: split textContent by newlines or use as single line
    const lines = el.textContent.split("\n").filter(Boolean)
    lines.forEach((line, i) => {
      ctx.fillText(line, x, y + fontSize + scaledLineHeight * i)
    })
  }
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
