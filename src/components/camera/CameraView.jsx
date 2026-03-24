"use client";

import { Overlays } from "./Overlays";
import { CaptureButton } from "./CaptureButton";
import { ControlBar } from "./ControlBar";
import { GestureIndicator } from "./GestureIndicator";
import { MascotPicker } from "./MascotPicker";
import { LayoutPicker } from "./LayoutPicker";
import { SplashOverlay } from "./SplashOverlay";
import { StatusOverlay } from "./StatusOverlay";
import { useBooth } from "../BoothContext";

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
];

export function CameraView() {
  const {
    videoRef,
    containerRef,
    isReady,
    splashDone,
    isRecalibrating,
    isSwitching,
    isMirrored,
    activeGesture,
    showMascotPicker,
    showLayoutPicker,
  } = useBooth();

  return (
    <main className="flex items-center justify-center w-dvw h-dvh bg-black max-w-480 mx-auto">
      <div ref={containerRef} className="relative overflow-hidden w-dvw h-dvh">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover transition-all duration-500 ${isMirrored ? "-scale-x-100" : ""} ${isReady && !isSwitching ? "opacity-100 blur-0" : "opacity-0 blur-sm"}`}
        />

        {(isReady || isSwitching || isRecalibrating) && splashDone && (
          <>
            <div className="absolute inset-0 animate-pop-in" style={{ animationDelay: "0.1s" }}>
              <Overlays />
            </div>
            <GestureIndicator gesture={activeGesture} />
            <div className="absolute inset-0 pointer-events-none animate-pop-in" style={{ animationDelay: "0.25s" }}>
              <CaptureButton />
            </div>
            <div className="absolute inset-0 pointer-events-none animate-pop-in" style={{ animationDelay: "0.4s" }}>
              <ControlBar />
            </div>
          </>
        )}

        <SplashOverlay visible={!splashDone || (!isReady && !isSwitching && !isRecalibrating)} />
        <StatusOverlay visible={isRecalibrating && splashDone} messages={RECALIBRATE_MESSAGES} />
        <StatusOverlay visible={isSwitching && splashDone} messages="Camera wisselen..." />

        {showMascotPicker && <MascotPicker />}
        {showLayoutPicker && <LayoutPicker />}
      </div>
    </main>
  );
}
