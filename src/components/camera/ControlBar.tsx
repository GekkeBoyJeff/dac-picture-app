import { useState } from "react";
import { FullscreenIcon, DownloadIcon, GridIcon, MascotIcon, LayoutIcon, CameraSwitchIcon } from "../icons";
import type { CameraDevice } from "@/hooks/useCamera";

export function ControlBar({
  onGalleryToggle,
  galleryCount,
  canInstall,
  onInstall,
  onOpenMascotPicker,
  onOpenLayoutPicker,
  devices,
  selectedDeviceId,
  onSwitchCamera,
}: {
  onGalleryToggle: () => void;
  galleryCount: number;
  canInstall: boolean;
  onInstall: () => void;
  onOpenMascotPicker: () => void;
  onOpenLayoutPicker: () => void;
  devices: CameraDevice[];
  selectedDeviceId: string | null;
  onSwitchCamera: (deviceId: string) => void;
}) {
  const [cameraMenuOpen, setCameraMenuOpen] = useState(false);

  const btnClass =
    "w-10 h-10 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer";

  return (
    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-2 max-lg:landscape:right-auto max-lg:landscape:top-auto max-lg:landscape:translate-y-0 max-lg:landscape:bottom-3 max-lg:landscape:left-1/2 max-lg:landscape:-translate-x-1/2 max-lg:landscape:flex-row z-10">
      <button onClick={onGalleryToggle} className={`relative ${btnClass}`} aria-label="Gallery">
        <GridIcon className="w-5 h-5 text-white/70" />
        {galleryCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-white/30 backdrop-blur-sm text-white text-[10px] flex items-center justify-center font-medium">
            {galleryCount}
          </span>
        )}
      </button>

      <button onClick={onOpenMascotPicker} className={btnClass} aria-label="Choose mascot">
        <MascotIcon className="w-5 h-5 text-white/70" />
      </button>

      <button onClick={onOpenLayoutPicker} className={btnClass} aria-label="Choose layout">
        <LayoutIcon className="w-5 h-5 text-white/70" />
      </button>

      {devices.length > 0 && (
        <div className="relative">
          <button
            onClick={() => setCameraMenuOpen((v) => !v)}
            className={btnClass}
            aria-label="Switch camera"
          >
            <CameraSwitchIcon className="w-5 h-5 text-white/70" />
          </button>

          <div
            className={`absolute right-12 top-0 max-lg:landscape:right-auto max-lg:landscape:left-0 max-lg:landscape:top-auto max-lg:landscape:bottom-12 min-w-48 rounded-xl bg-black/90 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden transition-all duration-200 origin-right max-lg:landscape:origin-bottom ${
              cameraMenuOpen
                ? "opacity-100 scale-100 pointer-events-auto"
                : "opacity-0 scale-95 pointer-events-none"
            }`}
          >
            {devices.map((device) => (
              <button
                key={device.deviceId}
                onClick={() => {
                  onSwitchCamera(device.deviceId);
                  setCameraMenuOpen(false);
                }}
                className={`w-full px-4 py-3 text-left text-sm transition-colors cursor-pointer ${
                  device.deviceId === selectedDeviceId
                    ? "bg-white/15 text-white font-medium"
                    : "text-white/70 hover:bg-white/10"
                }`}
              >
                {device.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {canInstall && (
        <button onClick={onInstall} className={btnClass} aria-label="Install app">
          <DownloadIcon className="w-5 h-5 text-white/70" />
        </button>
      )}

      <button
        onClick={() => {
          if (document.fullscreenElement) {
            document.exitFullscreen();
          } else {
            document.documentElement.requestFullscreen().catch(() => {});
          }
        }}
        className={`${btnClass} hidden md:flex`}
        aria-label="Fullscreen"
      >
        <FullscreenIcon className="w-5 h-5 text-white/70" />
      </button>
    </div>
  );
}
