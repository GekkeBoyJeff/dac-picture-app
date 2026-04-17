"use client"

import { memo, useMemo, useEffect, useRef, useState, useCallback } from "react"
import { STRIP_PHOTO_COUNT, STRIP_CANVAS } from "@/lib/config"
import { useCameraStore } from "@/features/camera/store"

const FRAME_RATIO = `${STRIP_CANVAS.WIDTH - STRIP_CANVAS.MARGIN_X * 2} / ${STRIP_CANVAS.PHOTO_HEIGHT}`

const FrameContent = memo(function FrameContent({
  isCaptured,
  isCurrent,
  photoURL,
  attachStream,
  isMirrored,
}) {
  if (isCaptured && photoURL) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={photoURL} className="w-full h-full object-cover animate-strip-photo-land" alt="" />
    )
  }
  if (isCurrent) {
    return (
      <video
        ref={attachStream}
        autoPlay
        playsInline
        muted
        className={`w-full h-full object-cover ${isMirrored ? "-scale-x-100" : ""}`}
      />
    )
  }
  return <div className="w-full h-full bg-[#111]" />
})

/**
 * Strip mode overlay.
 * Portrait: 9:16 stacked frames.
 * Landscape: full-screen carousel, one frame at a time.
 */
export function StripFrameOverlay({ videoRef, stripPhotos = [], isActive, visible }) {
  const count = stripPhotos.length
  const isMirrored = useCameraStore((s) => s.isMirrored)
  const [isLandscape, setIsLandscape] = useState(() => {
    if (typeof window === "undefined") return false
    return window.matchMedia("(orientation: landscape)").matches
  })

  useEffect(() => {
    const mq = window.matchMedia("(orientation: landscape)")
    const handler = (e) => setIsLandscape(e.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])

  const liveVideoRef = useRef(null)
  const attachStream = useCallback(
    (el) => {
      liveVideoRef.current = el
      if (el && videoRef?.current?.srcObject) {
        el.srcObject = videoRef.current.srcObject
      }
    },
    [videoRef],
  )

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
    />
  )

  const progressDots = (
    <div className="flex items-center gap-2 px-4 py-1.5 rounded-none bg-black border border-white/20">
      <div className="flex gap-1.5">
        {Array.from({ length: STRIP_PHOTO_COUNT }, (_, i) => (
          <div
            key={i}
            className={`w-1.5 h-1.5 rounded-none transition-all duration-300 ${
              i < count ? "bg-[#e6c189]" : "bg-white/20"
            }`}
          />
        ))}
      </div>
      <span className="text-[#e6c189] text-xs font-mono">
        {count}/{STRIP_PHOTO_COUNT}
      </span>
    </div>
  )

  return (
    <div
      className="absolute inset-0 z-20 flex items-center justify-center transition-opacity duration-500 ease-in-out"
      style={{
        background: "#000",
        opacity: visible ? 1 : 0,
        pointerEvents: "none",
      }}
    >
      {isLandscape ? (
        <div className="relative w-full h-full overflow-hidden">
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
                  className="relative w-full max-h-full rounded-none overflow-hidden"
                  style={{
                    aspectRatio: "16 / 9",
                    border:
                      i === activeIndex
                        ? "0.125rem solid #e6c189"
                        : i < count
                          ? "0.0625rem solid rgba(230,193,137,0.4)"
                          : "0.0625rem solid rgba(255,255,255,0.1)",
                  }}
                >
                  {renderFrame(i)}
                </div>
              </div>
            ))}
          </div>

          <div
            className="absolute bottom-4 left-1/2 -translate-x-1/2 transition-opacity duration-500"
            style={{ opacity: visible ? 1 : 0 }}
          >
            {isActive ? (
              progressDots
            ) : (
              <span className="text-white/40 text-[0.65rem] font-mono tracking-[0.15em] uppercase">
                Strip
              </span>
            )}
          </div>
        </div>
      ) : (
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
                className="relative w-full rounded-none overflow-hidden transition-all duration-500 ease-in-out"
                style={{
                  aspectRatio: FRAME_RATIO,
                  opacity: visible ? 1 : 0,
                  transform: visible ? "translateY(0)" : "translateY(1rem)",
                  transitionDelay: visible ? `${0.05 + i * 0.07}s` : "0s",
                  border: isCurrent
                    ? "0.125rem solid #e6c189"
                    : isCaptured
                      ? "0.0625rem solid rgba(230,193,137,0.4)"
                      : "0.0625rem solid rgba(255,255,255,0.1)",
                }}
              >
                {renderFrame(i)}
              </div>
            )
          })}

          <div
            className="shrink-0 flex items-center justify-center py-1 transition-opacity duration-500 ease-in-out"
            style={{
              minHeight: "2.5rem",
              opacity: visible ? 1 : 0,
              transitionDelay: visible ? "0.3s" : "0s",
            }}
          >
            {isActive ? (
              progressDots
            ) : (
              <span className="text-white/40 text-[0.65rem] font-mono tracking-[0.15em] uppercase">
                Strip
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
