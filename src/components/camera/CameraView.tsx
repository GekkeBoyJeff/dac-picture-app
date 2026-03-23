"use client";

import { memo, RefObject } from "react";
import type { CameraDevice } from "@/hooks/useCamera";
import type { ActiveGesture } from "@/hooks/useHandGesture";
import type { LayoutPreset, Mascot, Convention } from "@/lib/config";
import { Overlays } from "./Overlays";
import { CaptureButton } from "./CaptureButton";
import { ControlBar } from "./ControlBar";
import { GestureIndicator } from "./GestureIndicator";
import { AppQrModal } from "./AppQrModal";
import { MascotPicker } from "./MascotPicker";
import { LayoutPicker } from "./LayoutPicker";

interface CameraViewProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  containerRef: RefObject<HTMLDivElement | null>;
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
  showAppQr: boolean;
  onCloseAppQr: () => void;
  // Overlay settings
  layout: LayoutPreset;
  mascot: Mascot;
  activeConvention: Convention | null;
  setLayoutId: (id: string) => void;
  setMascotId: (id: string) => void;
  showMascotPicker: boolean;
  showLayoutPicker: boolean;
  onOpenMascotPicker: () => void;
  onCloseMascotPicker: () => void;
  onOpenLayoutPicker: () => void;
  onCloseLayoutPicker: () => void;
}

export const CameraView = memo(function CameraView({
  videoRef,
  containerRef,
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
  showAppQr,
  onCloseAppQr,
  layout,
  mascot,
  activeConvention,
  setLayoutId,
  setMascotId,
  showMascotPicker,
  showLayoutPicker,
  onOpenMascotPicker,
  onCloseMascotPicker,
  onOpenLayoutPicker,
  onCloseLayoutPicker,
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

        <Overlays layout={layout} mascot={mascot} activeConvention={activeConvention} />
        <GestureIndicator gesture={activeGesture} />
        <CaptureButton onClick={onCapture} disabled={disabled} />

        <ControlBar
          onGalleryToggle={onGalleryToggle}
          galleryCount={galleryCount}
          canInstall={canInstall}
          onInstall={onInstall}
          onOpenMascotPicker={onOpenMascotPicker}
          onOpenLayoutPicker={onOpenLayoutPicker}
          devices={devices}
          selectedDeviceId={selectedDeviceId}
          onSwitchCamera={onSwitchCamera}
        />

        {showAppQr && <AppQrModal onClose={onCloseAppQr} />}
        {showMascotPicker && (
          <MascotPicker
            currentId={mascot.id}
            onSelect={setMascotId}
            onClose={onCloseMascotPicker}
          />
        )}
        {showLayoutPicker && (
          <LayoutPicker
            currentId={layout.id}
            onSelect={setLayoutId}
            onClose={onCloseLayoutPicker}
          />
        )}
      </div>
    </main>
  );
});
