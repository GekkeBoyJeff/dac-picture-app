"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { LAYOUTS, GESTURE_SWIPE_SNAP_THRESHOLD } from "@/lib/config"
import { useOverlayStore, selectLayout } from "@/stores/overlayStore"
import { cn } from "@/lib/styles/cn"
import { LayoutPreview } from "./LayoutPreview"

function LayoutCard({ layout, isSelected, onClick }) {
  return (
    <button
      onClick={onClick}
      className="shrink-0 cursor-pointer outline-none"
      style={{ width: CARD_W, padding: "0 8px" }}
    >
      <div
        className={cn(
          "relative rounded-2xl p-1 transition-all duration-300",
          isSelected
            ? "scale-100 ring-2 ring-gold shadow-[0_0_24px_rgba(230,193,137,0.3)]"
            : "scale-[0.88] opacity-50 ring-1 ring-hairline",
        )}
      >
        <LayoutPreview layout={layout} size="lg" />
        {isSelected && (
          <span
            className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-linear-to-b from-gold-strong via-gold to-gold-deep text-[#1b1407] shadow-[0_0_14px_rgba(230,193,137,0.45)]"
            aria-hidden="true"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </span>
        )}
      </div>
      <p
        className={cn(
          "mt-2 text-center text-sm font-medium transition-all duration-300",
          isSelected ? "text-ink" : "text-ink-dim",
        )}
      >
        {layout.name}
      </p>
    </button>
  )
}

const CARD_W = 160

const STEP_ICONS = { Open_Palm: "\u{1F44B}", Closed_Fist: "\u270A" }

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

  // --- Touch ---
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

  // --- Pointer (mouse) ---
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

  // --- Gesture swipe rAF ---
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

  // Force a re-render once the strip ref is measured so centering is correct
  const [measured, setMeasured] = useState(false)
  useEffect(() => {
    if (isOpen && stripRef.current && !measured) setMeasured(true)
    if (!isOpen) setMeasured(false)
  }, [isOpen, measured])

  if (!isOpen) return null

  /* eslint-disable react-hooks/refs -- layout measurement refs read during render for positioning */
  const stripW = stripRef.current?.offsetWidth || 0
  const centerOffset = stripW ? (stripW - CARD_W) / 2 : 0
  const baseOffset = centerOffset - currentIndex * CARD_W
  const activeDelta = isTouchActiveRef.current ? -touchDelta : 0
  const translateX = baseOffset + activeDelta
  /* eslint-enable react-hooks/refs */

  return (
    <div className="absolute inset-x-0 bottom-0 z-40 animate-fade-in">
      <div className="relative border-t border-hairline bg-ground/85 pt-2 pb-6 backdrop-blur-md">
        <button
          onClick={onClose}
          className="mb-1 w-full shrink-0 cursor-pointer py-2"
          aria-label="Sluiten"
        >
          <div className="mx-auto h-1 w-10 rounded-full bg-ink-muted/40" />
        </button>

        <div className="mb-3 flex items-center justify-center gap-2">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
            Swipe om layout te kiezen
          </p>
          {closeSequence && (
            <>
              <span className="text-ink-dim">|</span>
              <div className="flex items-center gap-1">
                {closeSequence.sequence.map((step, i) => (
                  <span
                    key={i}
                    className={cn(
                      "text-sm",
                      closeSequence.isActiveRef.current && i < closeSequence.currentStepRef.current
                        ? "opacity-100"
                        : "opacity-40",
                    )}
                  >
                    {STEP_ICONS[step]}
                  </span>
                ))}
                <span className="ml-1 text-xs font-medium uppercase tracking-wide text-ink-muted">
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
              className={cn(
                "h-1 rounded-full transition-all duration-300",
                idx === currentIndex ? "w-4 bg-gold" : "w-1 bg-ink-muted/30",
              )}
            />
          ))}
        </div>
      </div>
    </div>
  )
}