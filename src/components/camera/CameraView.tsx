"use client";

import { memo, RefObject } from "react";
import type { CameraDevice } from "@/hooks/useCamera";
import type { ActiveGesture } from "@/hooks/useHandGesture";
import { Overlays } from "./Overlays";
import { CaptureButton } from "./CaptureButton";
import { ControlBar } from "./ControlBar";
import { CameraMenu } from "./CameraMenu";
import { GestureIndicator } from "./GestureIndicator";
import { AppQrModal } from "./AppQrModal";

interface CameraViewProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  onCapture: () => void;
  onGalleryToggle: () => void;
  galleryCount: number;
  disabled: boolean;
  devices: CameraDevice[];
  selectedDeviceId: string | null;
  onSwitchCamera: (deviceId: string) => void;
  isMirrored: boolean;
  canInstall: boolean;
  onInstall: () => void;
  activeGesture: ActiveGesture;
  containerRef: RefObject<HTMLDivElement | null>;
  showAppQr: boolean;
  onCloseAppQr: () => void;
}

export const CameraView = memo(function CameraView({
  videoRef,
  onCapture,
  onGalleryToggle,
  galleryCount,
  disabled,
  devices,
  selectedDeviceId,
  onSwitchCamera,
  isMirrored,
  canInstall,
  onInstall,
  activeGesture,
  containerRef,
  showAppQr,
  onCloseAppQr,
}: CameraViewProps) {
  return (
    <main className="flex items-center justify-center w-dvw h-dvh bg-black">
      <div ref={containerRef} className="relative overflow-hidden w-dvw h-dvh">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover ${isMirrored ? "-scale-x-100" : ""}`}
        />

        <Overlays />
        <GestureIndicator gesture={activeGesture} />
        <CaptureButton onClick={onCapture} disabled={disabled} />

        <CameraMenu
          devices={devices}
          selectedDeviceId={selectedDeviceId}
          onSwitchCamera={onSwitchCamera}
        />

        <ControlBar
          onGalleryToggle={onGalleryToggle}
          galleryCount={galleryCount}
          canInstall={canInstall}
          onInstall={onInstall}
          onPhoneQr={onCloseAppQr}
        />

        {showAppQr && <AppQrModal onClose={onCloseAppQr} />}
      </div>
    </main>
  );
});
