"use client"

import { Overlays } from "@/features/overlay/components/Overlays"
import { CaptureButton } from "./CaptureButton"
import { ControlBar } from "./ControlBar"
import { StatusOverlay } from "./StatusOverlay"
import { AttractOverlay } from "./AttractOverlay"
import { StripFrameOverlay } from "@/features/capture/components/StripFrameOverlay"
import { CameraIssueOverlay } from "./CameraIssueOverlay"
import { ANIMATION_DELAYS } from "@/lib/styles/animations"
import { BOOT_STAGES, useBootStore } from "@/stores/bootStore"
import { useCameraStore } from "@/features/camera/store"
import { useUiStore } from "@/stores/uiStore"
import { OfflineBadge } from "./OfflineBadge"

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
  videoRef,
  containerRef,
  onCapture,
  switchCamera,
  canInstall,
  onInstall,
  cameraError,
  cameraDeviceCount,
  onRetryCamera,
  showAttract,
  stripPhotos,
  stripIsActive,
}) {
  const isReady = useCameraStore((s) => s.isReady)
  const isRecalibrating = useCameraStore((s) => s.isRecalibrating)
  const isSwitching = useCameraStore((s) => s.isSwitching)
  const isMirrored = useCameraStore((s) => s.isMirrored)
  const bootStage = useBootStore((s) => s.bootStage)
  const stripModeEnabled = useUiStore((s) => s.stripModeEnabled)
  const showLayoutSlider = useUiStore((s) => s.modals.layoutSlider)
  const closeLayoutSlider = useUiStore((s) => s.closeModal)

  const showStripFrame = stripModeEnabled && !showLayoutSlider

  let containerStyle
  let containerExtra = ""
  if (showLayoutSlider) {
    containerStyle = { transform: "scale(0.75)", transformOrigin: "top center", marginTop: "1rem" }
    containerExtra = "rounded-sm cursor-pointer"
  }

  return (
    <main className="flex items-center justify-center w-dvw h-dvh bg-black max-w-480 mx-auto">
      <div
        ref={containerRef}
        className={`relative overflow-hidden w-dvw h-dvh transition-all duration-500 ease-in-out ${containerExtra}`}
        style={containerStyle}
        onClick={showLayoutSlider ? () => closeLayoutSlider("layoutSlider") : undefined}
      >
        <OfflineBadge />
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover transition-all duration-500 ${isMirrored ? "-scale-x-100" : ""} ${isReady && !isSwitching ? "opacity-100 blur-0" : "opacity-0 blur-sm"}`}
        />

        {(isReady || isSwitching || isRecalibrating) && (
          <>
            <div
              className="absolute inset-0 animate-pop-in"
              style={{ animationDelay: ANIMATION_DELAYS.cameraView.overlays }}
            >
              <Overlays />
            </div>

            <StripFrameOverlay
              videoRef={videoRef}
              stripPhotos={stripPhotos}
              isActive={stripIsActive}
              visible={showStripFrame}
            />

            <div
              className="absolute inset-0 pointer-events-none z-30 animate-pop-in"
              style={{ animationDelay: ANIMATION_DELAYS.cameraView.captureButton }}
            >
              <CaptureButton onCapture={onCapture} />
            </div>
            <div
              className="absolute inset-0 pointer-events-none z-30 animate-pop-in"
              style={{ animationDelay: ANIMATION_DELAYS.cameraView.controlBar }}
            >
              <ControlBar
                switchCamera={switchCamera}
                canInstall={canInstall}
                onInstall={onInstall}
              />
            </div>
          </>
        )}

        {(bootStage === BOOT_STAGES.ERROR || cameraError) && cameraError && !isReady && (
          <CameraIssueOverlay
            error={cameraError}
            deviceCount={cameraDeviceCount}
            onRetry={onRetryCamera}
          />
        )}
        <StatusOverlay visible={isRecalibrating} messages={RECALIBRATE_MESSAGES} />
        <StatusOverlay visible={isSwitching} messages="Camera wisselen..." />
        <AttractOverlay visible={showAttract && isReady} />
      </div>
    </main>
  )
}
