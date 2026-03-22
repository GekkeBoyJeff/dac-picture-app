"use client";

import { useState } from "react";
import type { CameraDevice } from "@/hooks/useCamera";
import { CameraSwitchIcon } from "../icons";

export function CameraMenu({
  devices,
  selectedDeviceId,
  onSwitchCamera,
}: {
  devices: CameraDevice[];
  selectedDeviceId: string | null;
  onSwitchCamera: (deviceId: string) => void;
}) {
  const [open, setOpen] = useState(false);

  if (devices.length <= 1) return null;

  return (
    <div className="absolute bottom-[8%] right-[8%] z-10">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-10 h-10 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer"
        aria-label="Wissel camera"
      >
        <CameraSwitchIcon className="w-5 h-5 text-white/70" />
      </button>

      {open && (
        <div className="absolute bottom-12 right-0 min-w-56 rounded-xl bg-gray-950/95 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden z-30">
          {devices.map((device) => (
            <button
              key={device.deviceId}
              onClick={() => {
                onSwitchCamera(device.deviceId);
                setOpen(false);
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
  );
}
