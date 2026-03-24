import { useState, useCallback } from "react";
import { FullscreenIcon, DownloadIcon, GridIcon, MascotIcon, LayoutIcon, CameraSwitchIcon, InfoIcon } from "../icons";
import { useBooth } from "../BoothContext";

const BTN_CLASS =
  "w-10 h-10 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer";

function toggleFullscreen() {
  if (document.fullscreenElement) {
    document.exitFullscreen();
  } else {
    document.documentElement.requestFullscreen().catch(() => {});
  }
}

export function ControlBar() {
  const {
    openGallery,
    galleryCount,
    canInstall,
    onInstall,
    openMascotPicker,
    openLayoutPicker,
    devices,
    selectedDeviceId,
    switchCamera,
    openAbout,
  } = useBooth();

  const [cameraMenuOpen, setCameraMenuOpen] = useState(false);

  const toggleCameraMenu = useCallback(() => setCameraMenuOpen((v) => !v), []);

  const selectCamera = useCallback((deviceId) => {
    switchCamera(deviceId);
    setCameraMenuOpen(false);
  }, [switchCamera]);

  return (
    <div className="pointer-events-auto absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-2 max-lg:landscape:right-auto max-lg:landscape:top-auto max-lg:landscape:translate-y-0 max-lg:landscape:bottom-3 max-lg:landscape:left-1/2 max-lg:landscape:-translate-x-1/2 max-lg:landscape:flex-row z-10">
      <button onClick={openGallery} className={`relative ${BTN_CLASS}`} aria-label="Gallery">
        <GridIcon className="w-5 h-5 text-white/70" />
        {galleryCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-white/30 backdrop-blur-sm text-white text-[10px] flex items-center justify-center font-medium">
            {galleryCount}
          </span>
        )}
      </button>

      <button onClick={openMascotPicker} className={BTN_CLASS} aria-label="Choose mascot">
        <MascotIcon className="w-5 h-5 text-white/70" />
      </button>

      <button onClick={openLayoutPicker} className={BTN_CLASS} aria-label="Choose layout">
        <LayoutIcon className="w-5 h-5 text-white/70" />
      </button>

      {devices.length > 0 && (
        <div className="relative">
          <button
            onClick={toggleCameraMenu}
            className={BTN_CLASS}
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
                onClick={() => selectCamera(device.deviceId)}
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
        <button onClick={onInstall} className={BTN_CLASS} aria-label="Install app">
          <DownloadIcon className="w-5 h-5 text-white/70" />
        </button>
      )}

      <button
        onClick={toggleFullscreen}
        className={`${BTN_CLASS} hidden md:flex`}
        aria-label="Fullscreen"
      >
        <FullscreenIcon className="w-5 h-5 text-white/70" />
      </button>

      <button onClick={openAbout} className={BTN_CLASS} aria-label="About">
        <InfoIcon className="w-5 h-5 text-white/70" />
      </button>
    </div>
  );
}
