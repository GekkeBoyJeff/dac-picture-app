"use client"

import { useEffect, useRef } from "react"

export function CameraPreview({ stream, className }) {
  const videoRef = useRef(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    if (stream) {
      video.srcObject = stream
      video.play().catch(() => {})
    } else {
      video.srcObject = null
    }
  }, [stream])

  return (
    <div className={`relative overflow-hidden bg-black/60 ${className ?? ""}`}>
      {stream ? (
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
      ) : (
        <div className="flex h-full min-h-[9rem] items-center justify-center">
          <p className="text-xs text-ink-subtle">Camera preview beschikbaar na verbinding</p>
        </div>
      )}
    </div>
  )
}