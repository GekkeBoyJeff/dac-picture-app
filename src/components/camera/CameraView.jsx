"use client"

import { Overlays } from "./Overlays"
import { CaptureButton } from "./CaptureButton"
import { ControlBar } from "./ControlBar"
import { GestureIndicator } from "./GestureIndicator"
import { GestureSequenceHint } from "./GestureSequenceHint"
import { LayoutSlider } from "./LayoutSlider"
import { HandBox } from "./HandBox"
import { MascotPicker } from "./MascotPicker"
import { LayoutPicker } from "./LayoutPicker"
import { SplashOverlay } from "./SplashOverlay"
import { StatusOverlay } from "./StatusOverlay"
import { AboutDrawer } from "./AboutDrawer"
import { SettingsDrawer } from "./SettingsDrawer"
import { ANIMATION_DELAYS } from "@/lib/styles/animations"
import { useCameraContext, useModalContext, useUIContext } from "@/context"

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

export function CameraView() {
  const { videoRef, containerRef, isReady, splashDone, isRecalibrating, isSwitching, isMirrored, activeGesture, handBoxes, gestureBoxes, holdProgress, gestureSequenceOpen, gestureSequenceClose, gestureSwipe } = useCameraContext()
  const { showMascotPicker, showLayoutPicker, showAbout, showSettings, closeSettings, openAbout, showLayoutSlider, closeLayoutSlider } = useModalContext()
  const {
    debugEnabled,
    toggleDebug,
    gesturesEnabled,
    toggleGestures,
    detectionIntervalMs,
    setDetectionInterval,
    triggerMinScore,
    setTriggerMinScore,
    gestureHoldMs,
    setGestureHoldMs,
  } = useUIContext()

  return (
    <main className="flex items-center justify-center w-dvw h-dvh bg-black max-w-480 mx-auto">
      <div
        ref={containerRef}
        className={`relative overflow-hidden w-dvw h-dvh transition-all duration-500 ease-[cubic-bezier(.4,0,.2,1)] ${
          showLayoutSlider ? "rounded-2xl cursor-pointer" : ""
        }`}
        style={showLayoutSlider ? { transform: "scale(0.75)", transformOrigin: "top center", marginTop: "1rem" } : undefined}
        onClick={showLayoutSlider ? closeLayoutSlider : undefined}
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
            {debugEnabled && handBoxes.map((box) => (
              <HandBox key={`track-${box.index}-${box.x}-${box.y}`} box={box} videoRef={videoRef} containerRef={containerRef} />
            ))}
            {debugEnabled && !showLayoutSlider && gestureBoxes.map((box) => (
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
            <GestureIndicator gesture={activeGesture} holdProgress={holdProgress} />
            <GestureSequenceHint
              isActiveRef={showLayoutSlider ? gestureSequenceClose.isActiveRef : gestureSequenceOpen.isActiveRef}
              currentStepRef={showLayoutSlider ? gestureSequenceClose.currentStepRef : gestureSequenceOpen.currentStepRef}
              sequence={showLayoutSlider ? gestureSequenceClose.sequence : gestureSequenceOpen.sequence}
            />
            <div className="absolute inset-0 pointer-events-none animate-pop-in" style={{ animationDelay: ANIMATION_DELAYS.cameraView.captureButton }}>
              <CaptureButton />
            </div>
            <div className="absolute inset-0 pointer-events-none animate-pop-in" style={{ animationDelay: ANIMATION_DELAYS.cameraView.controlBar }}>
              <ControlBar />
            </div>
          </>
        )}

        <SplashOverlay visible={!splashDone || (!isReady && !isSwitching && !isRecalibrating)} />
        <StatusOverlay visible={isRecalibrating && splashDone} messages={RECALIBRATE_MESSAGES} />
        <StatusOverlay visible={isSwitching && splashDone} messages="Camera wisselen..." />

        <SettingsDrawer
          isOpen={showSettings}
          onClose={closeSettings}
          debugEnabled={debugEnabled}
          onToggleDebug={toggleDebug}
          gesturesEnabled={gesturesEnabled}
          onToggleGestures={toggleGestures}
          detectionIntervalMs={detectionIntervalMs}
          onChangeDetectionInterval={setDetectionInterval}
          triggerMinScore={triggerMinScore}
          onChangeTriggerMinScore={setTriggerMinScore}
          gestureHoldMs={gestureHoldMs}
          onChangeGestureHoldMs={setGestureHoldMs}
          openAbout={openAbout}
        />

        {showMascotPicker && <MascotPicker />}
        {showLayoutPicker && <LayoutPicker />}
        {showAbout && <AboutDrawer />}
      </div>

      <LayoutSlider
        isOpen={showLayoutSlider}
        onClose={closeLayoutSlider}
        gestureSwipe={gestureSwipe}
        closeSequence={gestureSequenceClose}
      />
    </main>
  )
}