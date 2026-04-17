"use client"

import { useEffect, useRef } from "react"

/**
 * Debug bounding box overlay for a single detected hand.
 *
 * Positions itself absolutely inside a container that covers the video.
 * All style updates go through direct DOM manipulation to avoid re-renders.
 * Brutalist: 1px white border, no glow.
 */
export function HandBox({
  box,
  videoRef,
  containerRef,
  borderColor = "rgba(255,255,255,0.6)",
  glowColor = "transparent",
  outlineColor = "transparent",
}) {
  const boxRef = useRef(null)

  useEffect(() => {
    const element = boxRef.current
    if (!element) return

    if (!box) {
      element.style.opacity = "0"
      return
    }

    const video = videoRef?.current
    const container = containerRef?.current

    if (video && container && video.videoWidth && video.videoHeight) {
      // offsetWidth/offsetHeight ignores CSS transforms (scale) on the container
      const layoutWidth = container.offsetWidth
      const layoutHeight = container.offsetHeight

      if (layoutWidth && layoutHeight) {
        const scale = Math.max(layoutWidth / video.videoWidth, layoutHeight / video.videoHeight)
        const displayWidth = video.videoWidth * scale
        const displayHeight = video.videoHeight * scale
        const offsetX = (layoutWidth - displayWidth) / 2
        const offsetY = (layoutHeight - displayHeight) / 2

        const left = box.x * displayWidth + offsetX
        const top = box.y * displayHeight + offsetY
        const width = box.width * displayWidth
        const height = box.height * displayHeight

        const clampedLeft = Math.max(0, Math.min(layoutWidth, left))
        const clampedTop = Math.max(0, Math.min(layoutHeight, top))
        const clampedRight = Math.max(0, Math.min(layoutWidth, left + width))
        const clampedBottom = Math.max(0, Math.min(layoutHeight, top + height))

        const boxWidth = Math.max(0, clampedRight - clampedLeft)
        const boxHeight = Math.max(0, clampedBottom - clampedTop)

        if (boxWidth && boxHeight) {
          element.style.left = `${clampedLeft}px`
          element.style.top = `${clampedTop}px`
          element.style.width = `${boxWidth}px`
          element.style.height = `${boxHeight}px`
          element.style.borderColor = borderColor
          element.style.boxShadow = "none"
          element.style.opacity = "1"
          return
        }
      }
    }

    element.style.opacity = "0"
  }, [box, videoRef, containerRef, borderColor, glowColor, outlineColor])

  return (
    <div className="absolute inset-0 pointer-events-none z-30">
      <div
        ref={boxRef}
        className="absolute border rounded-none"
        style={{
          opacity: 0,
          borderColor,
          boxShadow: "none",
        }}
      />
    </div>
  )
}
