"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { LAYOUTS, GESTURE_SWIPE_SNAP_THRESHOLD } from "@/lib/config"
import { useOverlayStore, selectLayout } from "@/features/overlay/store"
import { LayoutPreviewBlock } from "./LayoutPreviewBlock"

const CARD_W_REM = 10
const CARD_W = CARD_W_REM * 16
const STEP_ICONS = { Open_Palm: "\u{1F44B}", Closed_Fist: "\u270A" }

function LayoutCard({ layout, isSelected, onClick }) {
  return (
    <button
      onClick={onClick}
      className="shrink-0 cursor-pointer outline-none"
      style={{ width: `${CARD_W_REM}rem`, padding: "0 0.5rem" }}
    >
      <div
        className={`relative w-full aspect-[4/3] rounded-none overflow-hidden transition-all duration-300 ${
          isSelected ? "scale-100" : "scale-[0.88] opacity-50"
        }`}
        style={
          isSelected
            ? {
                backgroundColor: "#111",
                border: "0.125rem solid #e6c189",
              }
            : { backgroundColor: "#111", border: "0.125rem solid rgba(255,255,255,0.1)" }
        }
      >
        <LayoutPreviewBlock
          position={layout.logo.position}
          className="w-4 h-4 rounded-none bg-white/50"
          offset={6}
        />
        <LayoutPreviewBlock
          position={layout.qr.position}
          className="w-5 h-5 rounded-none bg-white/20"
          offset={6}
        />
        <LayoutPreviewBlock
          position={layout.mascot.position}
          className="w-7 h-10 rounded-none bg-[#e6c189]/40"
          offset={6}
        />
        <LayoutPreviewBlock
          position={layout.convention.position}
          className="w-9 h-4 rounded-none bg-white/20"
          offset={6}
        />
      </div>
      <p
        className={`text-center text-sm mt-2 font-bold transition-all duration-300 font-mono ${
          isSelected ? "text-white" : "text-white/40"
        }`}
      >
        {layout.name}
      </p>
    </button>
  )
}

export function LayoutSlider({ isOpen, onClose, gestureSwipe, closeSequence }) {
  const layout = useOverlayStore(selectLayout)
  const setLayoutId = useOverlayStore((s) => s.setLayoutId)

  const [currentIndex, setCurrentIndex] = useState(() =>
    Math.max(
      0,
      LAYOUTS.findIndex((l) => l.id === layout.id),
    ),
  )
  const [touchDelta, setTouchDelta] = useState(0)
  const [isSnapping, setIsSnapping] = useState(false)
  const touchStartRef = useRef(null)
  const isTouchActiveRef = useRef(false)
  const stripRef = useRef(null)
  const trackRef = useRef(null)
  const wasEngagedRef = useRef(false)
  const rafRef = useRef(0)

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(
        Math.max(
          0,
          LAYOUTS.findIndex((l) => l.id === layout.id),
        ),
      )
    }
  }, [isOpen, layout.id])

  const snapTo = useCallback(
    (newIndex) => {
      const clamped = Math.max(0, Math.min(LAYOUTS.length - 1, newIndex))
      setIsSnapping(true)
      setCurrentIndex(clamped)
      setTouchDelta(0)
      setLayoutId(LAYOUTS[clamped].id)
      setTimeout(() => setIsSnapping(false), 300)
    },
    [setLayoutId],
  )

  // Touch handlers
  const onTouchStart = useCallback(
    (e) => {
      if (isSnapping) return
      touchStartRef.current = e.touches[0].clientX
      isTouchActiveRef.current = true
      setIsSnapping(false)
    },
    [isSnapping],
  )

  const onTouchMove = useCallback((e) => {
    if (!isTouchActiveRef.current || touchStartRef.current == null) return
    setTouchDelta(e.touches[0].clientX - touchStartRef.current)
  }, [])

  const finishSwipe = useCallback(() => {
    if (!isTouchActiveRef.current) return
    isTouchActiveRef.current = false
    const threshold = CARD_W * GESTURE_SWIPE_SNAP_THRESHOLD
    if (touchDelta > threshold && currentIndex < LAYOUTS.length - 1) {
      snapTo(currentIndex + 1)
    } else if (touchDelta < -threshold && currentIndex > 0) {
      snapTo(currentIndex - 1)
    } else {
      setIsSnapping(true)
      setTouchDelta(0)
      setTimeout(() => setIsSnapping(false), 300)
    }
    touchStartRef.current = null
  }, [touchDelta, currentIndex, snapTo])

  // Pointer (mouse) handlers
  const onPointerDown = useCallback(
    (e) => {
      if (isSnapping || e.pointerType === "touch") return
      touchStartRef.current = e.clientX
      isTouchActiveRef.current = true
      setIsSnapping(false)
    },
    [isSnapping],
  )

  const onPointerMove = useCallback((e) => {
    if (!isTouchActiveRef.current || touchStartRef.current == null || e.pointerType === "touch")
      return
    setTouchDelta(e.clientX - touchStartRef.current)
  }, [])

  const onPointerUp = useCallback(
    (e) => {
      if (e.pointerType === "touch") return
      finishSwipe()
    },
    [finishSwipe],
  )

  // Gesture swipe rAF loop
  useEffect(() => {
    if (!isOpen || !gestureSwipe) {
      wasEngagedRef.current = false
      return
    }
    let running = true
    const animate = () => {
      if (!running) return
      const engaged = gestureSwipe.isEngagedRef.current
      const delta = gestureSwipe.swipeDeltaRef.current

      if (engaged && !isTouchActiveRef.current) {
        wasEngagedRef.current = true
        if (trackRef.current && stripRef.current) {
          const stripW = stripRef.current.offsetWidth
          const centerOffset = (stripW - CARD_W) / 2
          const gesturePx = delta * stripW
          const baseOffset = centerOffset - currentIndex * CARD_W
          trackRef.current.style.transform = `translateX(${baseOffset + gesturePx}px)`
          trackRef.current.style.transition = "none"
        }
      }

      if (wasEngagedRef.current && !engaged) {
        wasEngagedRef.current = false
        const stripW = stripRef.current?.offsetWidth || 300
        const threshold = CARD_W * GESTURE_SWIPE_SNAP_THRESHOLD
        const gesturePx = delta * stripW
        if (gesturePx < -threshold && currentIndex < LAYOUTS.length - 1) {
          snapTo(currentIndex + 1)
        } else if (gesturePx > threshold && currentIndex > 0) {
          snapTo(currentIndex - 1)
        } else {
          setIsSnapping(true)
          setTimeout(() => setIsSnapping(false), 300)
        }
      }
      rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)
    return () => {
      running = false
      cancelAnimationFrame(rafRef.current)
    }
  }, [isOpen, currentIndex, snapTo, gestureSwipe])

  // Force re-render once strip ref is measured for correct centering
  const [measured, setMeasured] = useState(false)
  useEffect(() => {
    if (isOpen && stripRef.current && !measured) setMeasured(true)
    if (!isOpen) setMeasured(false)
  }, [isOpen, measured])

  if (!isOpen) return null

  /* eslint-disable react-hooks/refs -- DOM measurement refs needed for carousel positioning */
  const stripW = stripRef.current?.offsetWidth || 0
  const centerOffset = stripW ? (stripW - CARD_W) / 2 : 0
  const baseOffset = centerOffset - currentIndex * CARD_W
  const activeDelta = isTouchActiveRef.current ? -touchDelta : 0
  const translateX = baseOffset + activeDelta
  /* eslint-enable react-hooks/refs */

  return (
    <div className="absolute inset-x-0 bottom-0 z-40 animate-fade-in">
      <div className="relative pt-2 pb-6 border-t border-white/10 bg-black">
        <button
          onClick={onClose}
          className="w-full py-2 mb-1 shrink-0 cursor-pointer"
          aria-label="Sluiten"
        >
          <div className="w-10 h-0.5 bg-white/30 mx-auto" />
        </button>

        <div className="flex items-center justify-center gap-2 mb-3">
          <p className="text-white/40 text-xs font-mono tracking-[0.15em] uppercase">
            Swipe om layout te kiezen
          </p>
          {closeSequence && (
            <>
              <span className="text-white/40">|</span>
              <div className="flex items-center gap-1">
                {closeSequence.sequence.map((step, i) => (
                  <span
                    key={i}
                    className={`text-sm ${
                      closeSequence.isActiveRef.current && i < closeSequence.currentStepRef.current
                        ? "opacity-100"
                        : "opacity-40"
                    }`}
                  >
                    {STEP_ICONS[step]}
                  </span>
                ))}
                <span className="text-white/40 text-xs font-mono tracking-[0.15em] uppercase ml-1">
                  = sluiten
                </span>
              </div>
            </>
          )}
        </div>

        <div
          ref={stripRef}
          className="w-full overflow-hidden touch-pan-y select-none"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={finishSwipe}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        >
          <div
            ref={trackRef}
            className="flex pb-2"
            style={{
              transform: `translateX(${translateX}px)`,
              transition: isSnapping ? "transform 300ms cubic-bezier(.4,0,.2,1)" : "none",
              willChange: "transform",
            }}
          >
            {LAYOUTS.map((l, idx) => (
              <LayoutCard
                key={l.id}
                layout={l}
                isSelected={idx === currentIndex}
                onClick={() => snapTo(idx)}
              />
            ))}
          </div>
        </div>

        <div className="flex justify-center gap-1.5 pt-1">
          {LAYOUTS.map((l, idx) => (
            <div
              key={l.id}
              className={`h-0.5 rounded-none transition-all duration-300 ${
                idx === currentIndex ? "w-4 bg-white" : "w-1 bg-white/20"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
