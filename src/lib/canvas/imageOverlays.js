import { loadImage } from "./imageLoader"
import { measureBoxRect, measureContainRect } from "./overlayMeasurer"
import { logger } from "@/lib/logger"

export async function drawImageOverlays(ctx, container, containerRect, scaleX, scaleY, options = {}) {
  const { excludeImageTypes = [] } = options

  const allEls = container.querySelectorAll(
    '[data-overlay="corner"], [data-overlay="image"], [data-overlay="qr"]',
  )

  const imageEls = excludeImageTypes.length > 0
    ? Array.from(allEls).filter((el) => {
        const type = el.getAttribute("data-image-type")
        return !type || !excludeImageTypes.includes(type)
      })
    : Array.from(allEls)

  const imageDraws = imageEls.map(async (el) => {
    const src = el.src || el.getAttribute("src")
    if (!src) return

    try {
      const img = await loadImage(src)
      const elRect = el.getBoundingClientRect()
      const style = getComputedStyle(el)
      const objectFit = style.objectFit

      let { x, y, w, h } = measureBoxRect(elRect, containerRect, scaleX, scaleY)

      // When CSS uses object-fit: contain, the browser renders the image
      // smaller than the element box. getBoundingClientRect returns the BOX
      // size, not the image size — so we must recalculate to avoid stretching.
      if (objectFit === "contain" && img.naturalWidth && img.naturalHeight) {
        ({ x, y, w, h } = measureContainRect(
          elRect,
          containerRect,
          scaleX,
          scaleY,
          img.naturalWidth / img.naturalHeight,
        ))
      }

      const opacity = parseFloat(style.opacity)
      const filter = style.filter

      ctx.save()
      if (!isNaN(opacity)) ctx.globalAlpha = opacity
      if (filter && filter !== "none") ctx.filter = filter
      ctx.drawImage(img, x, y, w, h)
      ctx.restore()
    } catch (err) {
      logger.warn("canvas", "Overlay failed:", src, err)
    }
  })

  await Promise.all(imageDraws)
}