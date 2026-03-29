"use client"

import { memo, useMemo, useEffect, useRef, useState, useCallback } from "react"
import { STRIP_PHOTO_COUNT, STRIP_CANVAS } from "@/lib/config"
import { useCameraStore } from "@/stores/cameraStore"
import { GestureIndicator } from "@/components/gestures/GestureIndicator"

const BG = "#0a0a0a"
const FRAME_RATIO = `${STRIP_CANVAS.WIDTH - STRIP_CANVAS.MARGIN_X * 2} / ${STRIP_CANVAS.PHOTO_HEIGHT}`

const FrameContent = memo(function FrameContent({ isCaptured, isCurrent, photoURL, attachStream, isMirrored, activeGesture, holdProgress }) {
  if (isCaptured && photoURL) {
    return <img src={photoURL} className="w-full h-full object-cover animate-strip-photo-land" alt="" />
  }
  if (isCurrent) {
    return (
      <>
        <video ref={attachStream} autoPlay playsInline muted className={`w-full h-full object-cover ${isMirrored ? "-scale-x-100" : ""}`} />
        <div className="absolute inset-0 flex items-start justify-center pt-3 z-10">
          <GestureIndicator gesture={activeGesture} holdProgress={holdProgress} />
        </div>
      </>
    )
  }
  return <div className="w-full h-full" style={{ background: "rgba(255,255,255,0.02)" }} />
})

/**
 * Strip mode overlay.
 * Portrait: 9:16 stacked frames.
 * Landscape: full-screen carousel, one frame at a time.
 */
export function StripFrameOverlay({ videoRef, stripPhotos = [], isActive, visible, activeGesture, holdProgress }) {
  const count = stripPhotos.length
  const isMirrored = useCameraStore((s) => s.isMirrored)
  const [isLandscape, setIsLandscape] = useState(false)

  // Detect orientation
  useEffect(() => {
    const mq = window.matchMedia("(orientation: landscape)")
    setIsLandscape(mq.matches)
    const handler = (e) => setIsLandscape(e.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])

  // Attach camera stream to the live preview video element
  const liveVideoRef = useRef(null)
  const attachStream = useCallback((el) => {
    liveVideoRef.current = el
    if (el && videoRef?.current?.srcObject) {
      el.srcObject = videoRef.current.srcObject
    }
  }, [videoRef])

  // Update srcObject when camera switches (without re-rendering every frame)
  useEffect(() => {
    const source = videoRef?.current
    if (!source) return
    const onLoadedMetadata = () => {
      if (liveVideoRef.current && source.srcObject) {
        liveVideoRef.current.srcObject = source.srcObject
      }
    }
    source.addEventListener("loadedmetadata", onLoadedMetadata)
    return () => source.removeEventListener("loadedmetadata", onLoadedMetadata)
  }, [videoRef])

  // Blob URLs for captured photos
  const photoURLs = useMemo(
    () => stripPhotos.map((blob) => URL.createObjectURL(blob)),
    [stripPhotos],
  )
  const prevURLsRef = useRef([])
  useEffect(() => {
    const prev = prevURLsRef.current
    prevURLsRef.current = photoURLs
    return () => prev.forEach((url) => URL.revokeObjectURL(url))
  }, [photoURLs])

  const activeIndex = isActive ? count : 0

  const renderFrame = (i) => (
    <FrameContent
      isCaptured={i < count}
      isCurrent={i === activeIndex}
      photoURL={photoURLs[i]}
      attachStream={attachStream}
      isMirrored={isMirrored}
      activeGesture={activeGesture}
      holdProgress={holdProgress}
    />
  )

  // Progress dots
  const progressDots = (
    <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/6 border border-[#e6c189]/15">
      <div className="flex gap-1.5">
        {Array.from({ length: STRIP_PHOTO_COUNT }, (_, i) => (
          <div
            key={i}
            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
              i < count ? "bg-[#e6c189]" : "bg-white/20"
            }`}
          />
        ))}
      </div>
      <span className="text-[#e6c189]/70 text-xs font-mono">
        {count}/{STRIP_PHOTO_COUNT}
      </span>
    </div>
  )

  return (
    <div
      className="absolute inset-0 z-20 flex items-center justify-center transition-opacity duration-500 ease-in-out"
      style={{
        background: BG,
        opacity: visible ? 1 : 0,
        pointerEvents: "none",
      }}
    >
      {isLandscape ? (
        /* ── Landscape: full-screen carousel ── */
        <div className="relative w-full h-full overflow-hidden">
          {/* Carousel track — slides horizontally */}
          <div
            className="flex h-full transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${activeIndex * 100}%)` }}
          >
            {Array.from({ length: STRIP_PHOTO_COUNT }, (_, i) => (
              <div
                key={i}
                className="shrink-0 w-full h-full flex items-center justify-center p-[3%]"
              >
                <div
                  className="relative w-full max-h-full rounded-2xl overflow-hidden"
                  style={{
                    aspectRatio: "16 / 9",
                    border: i === activeIndex
                      ? "0.125rem solid rgba(230,193,137,0.25)"
                      : i < count
                        ? "0.09375rem solid rgba(230,193,137,0.15)"
                        : "0.09375rem solid rgba(255,255,255,0.06)",
                  }}
                >
                  {renderFrame(i)}
                </div>
              </div>
            ))}
          </div>

          {/* Progress — bottom center */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 transition-opacity duration-500" style={{ opacity: visible ? 1 : 0 }}>
            {isActive ? progressDots : (
              <span className="text-white/20 text-[0.65rem] font-medium tracking-[0.15em] uppercase">Strip</span>
            )}
          </div>
        </div>
      ) : (
        /* ── Portrait: stacked 9:16 frames ── */
        <div
          className="relative h-full flex flex-col transition-transform duration-500 ease-in-out"
          style={{
            aspectRatio: "9 / 16",
            maxWidth: "100%",
            padding: "1.5% 3%",
            gap: "0.8%",
            transform: visible ? "scale(1)" : "scale(0.92)",
          }}
        >
          {Array.from({ length: STRIP_PHOTO_COUNT }, (_, i) => {
            const isCaptured = i < count
            const isCurrent = i === activeIndex

            return (
              <div
                key={i}
                className="relative w-full rounded-xl overflow-hidden transition-all duration-500 ease-in-out"
                style={{
                  aspectRatio: FRAME_RATIO,
                  opacity: visible ? 1 : 0,
                  transform: visible ? "translateY(0)" : "translateY(1rem)",
                  transitionDelay: visible ? `${0.05 + i * 0.07}s` : "0s",
                  border: isCurrent
                    ? "0.09375rem solid rgba(230,193,137,0.25)"
                    : isCaptured
                      ? "0.0625rem solid rgba(230,193,137,0.15)"
                      : "0.0625rem solid rgba(255,255,255,0.06)",
                }}
              >
                {renderFrame(i)}
              </div>
            )
          })}

          {/* Bottom status */}
          <div
            className="shrink-0 flex items-center justify-center py-1 transition-opacity duration-500 ease-in-out"
            style={{ minHeight: "2.5rem", opacity: visible ? 1 : 0, transitionDelay: visible ? "0.3s" : "0s" }}
          >
            {isActive ? progressDots : (
              <span className="text-white/20 text-[0.65rem] font-medium tracking-[0.15em] uppercase">Strip</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
