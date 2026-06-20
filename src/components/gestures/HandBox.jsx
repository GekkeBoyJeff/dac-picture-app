"use client"

import { useEffect, useRef } from "react"

/**
 * Hand-tracking indicator: a soft glow + four corner "focus" brackets, like a
 * camera reticle locking onto the hand. The box persists across frames (stable
 * key in the parent) and eases between positions, so it glides instead of
 * flickering.
 */
export function HandBox({
  box,
  videoRef,
  containerRef,
  borderColor = "rgba(230,193,137,0.95)",
  glowColor = "rgba(230,193,137,0.35)",
  outlineColor = "rgba(230,193,137,0.45)",
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
      // Use offsetWidth/offsetHeight instead of getBoundingClientRect() because
      // the container may have a CSS transform (scale) applied.
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
          element.style.opacity = "1"
          return
        }
      }
    }

    element.style.opacity = "0"
  }, [box, videoRef, containerRef])

  // Shared bracket styling — two visible edges per corner.
  const bracket = "absolute h-5 w-5"
  const bracketStyle = { borderColor, filter: `drop-shadow(0 0 6px ${glowColor})` }

  return (
    <div className="absolute inset-0 pointer-events-none z-30">
      <div
        ref={boxRef}
        className="absolute rounded-2xl"
        style={{
          opacity: 0,
          boxShadow: `0 0 28px ${glowColor}, inset 0 0 0 1px ${outlineColor}`,
          // A short positional ease smooths jitter without feeling like it lags.
          transition:
            "left 0.07s linear, top 0.07s linear, width 0.07s linear, height 0.07s linear, opacity 0.2s ease",
        }}
      >
        <span
          className={`${bracket} left-0 top-0 rounded-tl-xl border-l-2 border-t-2`}
          style={bracketStyle}
        />
        <span
          className={`${bracket} right-0 top-0 rounded-tr-xl border-r-2 border-t-2`}
          style={bracketStyle}
        />
        <span
          className={`${bracket} bottom-0 left-0 rounded-bl-xl border-b-2 border-l-2`}
          style={bracketStyle}
        />
        <span
          className={`${bracket} bottom-0 right-0 rounded-br-xl border-b-2 border-r-2`}
          style={bracketStyle}
        />
      </div>
    </div>
  )
}