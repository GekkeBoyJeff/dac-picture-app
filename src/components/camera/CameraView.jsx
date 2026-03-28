"use client"

import { Overlays } from "./Overlays"
import { CaptureButton } from "./CaptureButton"
import { ControlBar } from "./ControlBar"
import { SplashOverlay } from "./SplashOverlay"
import { StatusOverlay } from "./StatusOverlay"
import { AttractOverlay } from "./AttractOverlay"
import { StripFrameOverlay } from "@/components/capture/StripFrameOverlay"
import { GestureIndicator } from "@/components/gestures/GestureIndicator"
import { GestureSequenceHint } from "@/components/gestures/GestureSequenceHint"
import { HandBox } from "@/components/gestures/HandBox"
import { ANIMATION_DELAYS } from "@/lib/styles/animations"
import { useCameraStore } from "@/stores/cameraStore"
import { useUiStore } from "@/stores/uiStore"

const RECALIBRATE_MESSAGES = [
  "Schermgrootte detecteren...",
  "Even herberekenen...",
  "Camera aanpassen...",
  "Nieuwe afmetingen instellen...",
  "Pixels herschikken...",
  "Beeldverhouding bijwerken...",
  "Eén momentje...",
  "Zoom resetten...",
  "Kader aanpassen...",
]

export function CameraView({
  videoRef, containerRef, splashDone, onCapture, switchCamera,
  canInstall, onInstall,
  activeGesture, handBoxes, gestureBoxes, holdProgress,
  gestureSequenceOpen, gestureSequenceClose,
  showAttract,
  stripPhotos, stripIsActive,
}) {
  const isReady = useCameraStore((s) => s.isReady)
  const isRecalibrating = useCameraStore((s) => s.isRecalibrating)
  const isSwitching = useCameraStore((s) => s.isSwitching)
  const isMirrored = useCameraStore((s) => s.isMirrored)
  const debugEnabled = useUiStore((s) => s.debugEnabled)
  const stripModeEnabled = useUiStore((s) => s.stripModeEnabled)
  const showLayoutSlider = useUiStore((s) => s.modals.layoutSlider)
  const closeLayoutSlider = useUiStore((s) => s.closeModal)

  const showStripFrame = stripModeEnabled && !showLayoutSlider

  let containerStyle
  let containerExtra = ""
  if (showLayoutSlider) {
    containerStyle = { transform: "scale(0.75)", transformOrigin: "top center", marginTop: "1rem" }
    containerExtra = "rounded-2xl cursor-pointer"
  }

  return (
    <main className="flex items-center justify-center w-dvw h-dvh bg-black max-w-480 mx-auto">
      <div
        ref={containerRef}
        className={`relative overflow-hidden w-dvw h-dvh transition-all duration-500 ease-in-out ${containerExtra}`}
        style={containerStyle}
        onClick={showLayoutSlider ? () => closeLayoutSlider("layoutSlider") : undefined}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover transition-all duration-500 ${isMirrored ? "-scale-x-100" : ""} ${isReady && !isSwitching ? "opacity-100 blur-0" : "opacity-0 blur-sm"}`}
        />

        {(isReady || isSwitching || isRecalibrating) && splashDone && (
          <>
            <div className="absolute inset-0 animate-pop-in" style={{ animationDelay: ANIMATION_DELAYS.cameraView.overlays }}>
              <Overlays />
            </div>

            {/* Strip frame overlay — always mounted, transitions in/out */}
            <StripFrameOverlay
              videoRef={videoRef}
              stripPhotos={stripPhotos}
              isActive={stripIsActive}
              visible={showStripFrame}
              activeGesture={activeGesture}
              holdProgress={holdProgress}
            />

            {/* Debug hand tracking boxes — hide in strip mode (coords are full-screen) */}
            {debugEnabled && !showStripFrame && handBoxes?.map((box) => (
              <HandBox key={`track-${box.index}-${box.x}-${box.y}`} box={box} videoRef={videoRef} containerRef={containerRef} />
            ))}
            {debugEnabled && !showLayoutSlider && !showStripFrame && gestureBoxes?.map((box) => (
              <HandBox
                key={`gesture-${box.index}-${box.x}-${box.y}`}
                box={box}
                videoRef={videoRef}
                containerRef={containerRef}
                borderColor="rgba(56,189,248,0.8)"
                glowColor="rgba(56,189,248,0.45)"
                outlineColor="rgba(56,189,248,0.35)"
              />
            ))}

            {/* Gesture feedback — in strip mode this moves into the strip frame */}
            {!showStripFrame && (
              <GestureIndicator gesture={activeGesture} holdProgress={holdProgress} />
            )}
            <GestureSequenceHint
              isActive={showLayoutSlider ? gestureSequenceClose?.isActiveRef?.current : gestureSequenceOpen?.isActiveRef?.current}
              currentStep={showLayoutSlider ? gestureSequenceClose?.currentStepRef?.current : gestureSequenceOpen?.currentStepRef?.current}
              sequence={showLayoutSlider ? gestureSequenceClose?.sequence : gestureSequenceOpen?.sequence}
            />

            <div className="absolute inset-0 pointer-events-none z-30 animate-pop-in" style={{ animationDelay: ANIMATION_DELAYS.cameraView.captureButton }}>
              <CaptureButton onCapture={onCapture} />
            </div>
            <div className="absolute inset-0 pointer-events-none z-30 animate-pop-in" style={{ animationDelay: ANIMATION_DELAYS.cameraView.controlBar }}>
              <ControlBar switchCamera={switchCamera} canInstall={canInstall} onInstall={onInstall} />
            </div>
          </>
        )}

        <SplashOverlay visible={!splashDone || (!isReady && !isSwitching && !isRecalibrating)} />
        <StatusOverlay visible={isRecalibrating && splashDone} messages={RECALIBRATE_MESSAGES} />
        <StatusOverlay visible={isSwitching && splashDone} messages="Camera wisselen..." />
        <AttractOverlay visible={showAttract && splashDone && isReady} />
      </div>
    </main>
  )
}
