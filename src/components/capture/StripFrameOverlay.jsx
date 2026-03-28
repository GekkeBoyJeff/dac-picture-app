"use client"

import { useMemo, useEffect, useRef } from "react"
import { STRIP_PHOTO_COUNT } from "@/lib/config"
import { useCameraStore } from "@/stores/cameraStore"
import { GestureIndicator } from "@/components/gestures/GestureIndicator"

const BG = "#0a0a0a"

/**
 * Full strip layout overlay — replaces the normal camera view with
 * a 9:16 strip preview containing 3 stacked frames.
 * Always mounted, transitions smoothly between visible/hidden.
 */
export function StripFrameOverlay({ videoRef, stripPhotos = [], isActive, visible, activeGesture, holdProgress }) {
  const count = stripPhotos.length
  const isMirrored = useCameraStore((s) => s.isMirrored)
  const liveVideoRef = useRef(null)
  const attachedStreamRef = useRef(null)

  // Attach camera stream only when visible and it actually changes
  useEffect(() => {
    if (!visible) return
    const src = videoRef?.current?.srcObject
    if (src && liveVideoRef.current && src !== attachedStreamRef.current) {
      liveVideoRef.current.srcObject = src
      attachedStreamRef.current = src
    }
  }, [visible, videoRef])

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

  // Which frame gets the live camera
  const activeIndex = isActive ? count : 0

  return (
    <div
      className="absolute inset-0 z-20 flex items-center justify-center transition-opacity duration-500 ease-in-out"
      style={{
        background: BG,
        opacity: visible ? 1 : 0,
        pointerEvents: "none",
      }}
    >
      {/* 9:16 strip container — matches final output ratio */}
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
              className="relative flex-1 rounded-xl overflow-hidden transition-all duration-500 ease-in-out"
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(1rem)",
                transitionDelay: visible ? `${0.05 + i * 0.07}s` : "0s",
                border: isCurrent
                  ? "1.5px solid rgba(230,193,137,0.25)"
                  : isCaptured
                    ? "1px solid rgba(230,193,137,0.15)"
                    : "1px solid rgba(255,255,255,0.06)",
              }}
            >
              {isCaptured && photoURLs[i] && (
                <img
                  src={photoURLs[i]}
                  className="w-full h-full object-cover animate-strip-photo-land"
                  alt=""
                />
              )}
              {isCurrent && (
                <>
                  <video
                    ref={liveVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover ${isMirrored ? "-scale-x-100" : ""}`}
                  />
                  <div className="absolute inset-0 flex items-start justify-center pt-3 z-10">
                    <GestureIndicator gesture={activeGesture} holdProgress={holdProgress} />
                  </div>
                </>
              )}
              {!isCaptured && !isCurrent && (
                <div
                  className="w-full h-full"
                  style={{ background: "rgba(255,255,255,0.02)" }}
                />
              )}
            </div>
          )
        })}

        {/* Bottom status */}
        <div
          className="shrink-0 flex items-center justify-center py-1 transition-opacity duration-500 ease-in-out"
          style={{
            minHeight: "2.5rem",
            opacity: visible ? 1 : 0,
            transitionDelay: visible ? "0.3s" : "0s",
          }}
        >
          {isActive ? (
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
          ) : (
            <span className="text-white/20 text-[0.65rem] font-medium tracking-[0.15em] uppercase">
              Strip
            </span>
          )}
        </div>
      </div>
    </div>
  )
}