/**
 * Measure a DOM element's rect relative to a container, scaled to canvas coords.
 * @param {DOMRect} elRect
 * @param {DOMRect} containerRect
 * @param {number} scaleX
 * @param {number} scaleY
 * @returns {{ x: number, y: number, w: number, h: number }}
 */
export function measureBoxRect(elRect, containerRect, scaleX, scaleY) {
  return {
    x: (elRect.left - containerRect.left) * scaleX,
    y: (elRect.top - containerRect.top) * scaleY,
    w: elRect.width * scaleX,
    h: elRect.height * scaleY,
  }
}

/**
 * Measure an element with object-fit: contain, accounting for the image
 * being rendered smaller than the element box.
 * @param {DOMRect} elRect
 * @param {DOMRect} containerRect
 * @param {number} scaleX
 * @param {number} scaleY
 * @param {number} imageAspect - naturalWidth / naturalHeight
 * @returns {{ x: number, y: number, w: number, h: number }}
 */
export function measureContainRect(elRect, containerRect, scaleX, scaleY, imageAspect) {
  const boxW = elRect.width
  const boxH = elRect.height
  let renderW, renderH

  if (boxW / boxH > imageAspect) {
    renderH = boxH
    renderW = boxH * imageAspect
  } else {
    renderW = boxW
    renderH = boxW / imageAspect
  }

  // Center within box (default object-position)
  const offsetX = (boxW - renderW) / 2
  const offsetY = (boxH - renderH) / 2

  return {
    x: (elRect.left - containerRect.left + offsetX) * scaleX,
    y: (elRect.top - containerRect.top + offsetY) * scaleY,
    w: renderW * scaleX,
    h: renderH * scaleY,
  }
}