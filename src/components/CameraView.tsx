"use client";

import { memo, RefObject, useState } from "react";
import { OVERLAYS, CORNERS, CORNER_SIZE, CORNER_OFFSET } from "@/lib/config";
import { getOverlayStyle, getOverlayClassName } from "@/lib/overlayStyles";
import type { CameraDevice } from "@/hooks/useCamera";

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
}: CameraViewProps) {
  const [showCameraMenu, setShowCameraMenu] = useState(false);

  return (
    <main className="flex items-center justify-center w-screen h-screen bg-black">
      <div
        className="relative overflow-hidden max-h-screen landscape:aspect-video landscape:h-screen landscape:w-auto portrait:aspect-9/16 portrait:w-screen portrait:h-auto"
      >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`w-full h-full object-cover ${isMirrored ? "-scale-x-100" : ""}`}
      />

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.4) 100%)",
        }}
      />

      <div className="absolute bottom-0 left-0 right-0 h-[45%] pointer-events-none bg-linear-to-t from-black/50 via-black/20 to-transparent" />

      <div className="absolute top-0 left-0 right-0 h-[20%] pointer-events-none bg-linear-to-b from-black/40 to-transparent" />

      {CORNERS.map((corner) => {
        const style: React.CSSProperties = { width: CORNER_SIZE, height: CORNER_SIZE };
        if (corner.position.includes("top")) style.top = CORNER_OFFSET;
        if (corner.position.includes("bottom")) style.bottom = CORNER_OFFSET;
        if (corner.position.includes("left")) style.left = CORNER_OFFSET;
        if (corner.position.includes("right")) style.right = CORNER_OFFSET;
        return <img key={corner.src} src={corner.src} alt="" draggable={false} className="absolute pointer-events-none" style={style} />;
      })}

      {OVERLAYS.map((config) => (
        <img
          key={config.path}
          src={config.path}
          alt=""
          style={getOverlayStyle(config)}
          className={getOverlayClassName(config)}
          draggable={false}
        />
      ))}

      <div
        className="absolute flex items-center gap-3 pointer-events-none drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]"
        style={{ top: 30, left: 100 }}
      >
        <span className="text-white/90 text-2xl font-semibold tracking-[0.15em] uppercase leading-tight">
          Dutch Anime<br />Community
        </span>
      </div>

      <span
        className="absolute text-white/50 text-xs font-mono pointer-events-none"
        style={{ bottom: "3.2%", left: "16.2%" }}
      >
        {new Date().toLocaleDateString("nl-NL", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })}
      </span>

      <button
        onClick={onCapture}
        disabled={disabled}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 cursor-pointer disabled:cursor-not-allowed group"
        aria-label="Maak foto"
      >
        <div
          className={`w-24 h-24 rounded-full bg-white/10 backdrop-blur-md border-2 border-white/50 flex items-center justify-center transition-all hover:bg-white/20 hover:scale-105 active:scale-95 ${
            !disabled ? "animate-shutter-pulse" : "opacity-40"
          }`}
        >
          <div className="w-16 h-16 rounded-full bg-white group-hover:bg-white/90 transition-colors" />
        </div>
      </button>

      {devices.length > 1 && (
        <div className="absolute bottom-12 right-6 z-10">
          <button
            onClick={() => setShowCameraMenu((v) => !v)}
            className="w-10 h-10 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer"
            aria-label="Wissel camera"
          >
            <svg
              className="w-5 h-5 text-white/70"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182M2.985 19.644l3.181-3.183"
              />
            </svg>
          </button>

          {showCameraMenu && (
            <div className="absolute bottom-12 right-0 min-w-56 rounded-xl bg-gray-950/95 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden">
              {devices.map((device) => (
                <button
                  key={device.deviceId}
                  onClick={() => {
                    onSwitchCamera(device.deviceId);
                    setShowCameraMenu(false);
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
          )}
        </div>
      )}

      <button
        onClick={onGalleryToggle}
        className="absolute top-5 right-5 w-10 h-10 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer z-10"
        aria-label="Galerij"
      >
        <svg
          className="w-5 h-5 text-white/70"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
          />
        </svg>
        {galleryCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-white/30 backdrop-blur-sm text-white text-[10px] flex items-center justify-center font-medium">
            {galleryCount}
          </span>
        )}
      </button>
      </div>
    </main>
  );
});
