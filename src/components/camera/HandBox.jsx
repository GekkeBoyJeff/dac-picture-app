"use client"

import { useEffect, useRef } from "react"

const HandBox = ({ box, videoRef, containerRef, borderColor = "rgba(16,185,129,0.8)", glowColor = "rgba(16,185,129,0.4)", outlineColor = "rgba(16,185,129,0.35)" }) => {
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
      const bounds = container.getBoundingClientRect()
      if (bounds.width && bounds.height) {
        const scale = Math.max(bounds.width / video.videoWidth, bounds.height / video.videoHeight)
        const displayWidth = video.videoWidth * scale
        const displayHeight = video.videoHeight * scale
        const offsetX = (bounds.width - displayWidth) / 2
        const offsetY = (bounds.height - displayHeight) / 2

        const left = box.x * displayWidth + offsetX
        const top = box.y * displayHeight + offsetY
        const width = box.width * displayWidth
        const height = box.height * displayHeight

        const clampedLeft = Math.max(0, Math.min(bounds.width, left))
        const clampedTop = Math.max(0, Math.min(bounds.height, top))
        const clampedRight = Math.max(0, Math.min(bounds.width, left + width))
        const clampedBottom = Math.max(0, Math.min(bounds.height, top + height))

        const boxWidth = Math.max(0, clampedRight - clampedLeft)
        const boxHeight = Math.max(0, clampedBottom - clampedTop)

        if (boxWidth && boxHeight) {
          element.style.left = `${clampedLeft}px`
          element.style.top = `${clampedTop}px`
          element.style.width = `${boxWidth}px`
          element.style.height = `${boxHeight}px`
            element.style.borderColor = borderColor
            element.style.boxShadow = `0 0 20px ${glowColor}, 0 0 0 1px ${outlineColor}`
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
        className="absolute border-2 rounded-xl"
        style={{
          opacity: 0,
          borderColor,
          boxShadow: `0 0 20px ${glowColor}, 0 0 0 1px ${outlineColor}`,
        }}
      />
    </div>
  )
}

export { HandBox }