"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { VIDEO } from "@/lib/config";

export interface CameraDevice {
  deviceId: string;
  label: string;
}

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devices, setDevices] = useState<CameraDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [isMirrored, setIsMirrored] = useState(true);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setIsReady(false);
  }, []);

  const enumerateDevices = useCallback(async () => {
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = allDevices
        .filter((d) => d.kind === "videoinput")
        .map((d) => ({
          deviceId: d.deviceId,
          label: d.label || `Camera ${d.deviceId.slice(0, 6)}`,
        }));
      setDevices(videoDevices);
      return videoDevices;
    } catch {
      return [];
    }
  }, []);

  const startCamera = useCallback(
    async (deviceId?: string | null) => {
      try {
        setError(null);
        stopCamera();

        const isPortrait = window.innerHeight > window.innerWidth;
        const constraints: MediaStreamConstraints = {
          video: {
            ...(deviceId ? { deviceId: { exact: deviceId } } : {}),
            width: { ideal: isPortrait ? VIDEO.IDEAL_HEIGHT : VIDEO.IDEAL_WIDTH },
            height: { ideal: isPortrait ? VIDEO.IDEAL_WIDTH : VIDEO.IDEAL_HEIGHT },
            aspectRatio: { ideal: isPortrait ? 9 / 16 : 16 / 9 },
          },
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;

        const track = stream.getVideoTracks()[0];
        const settings = track?.getSettings();
        const activeDeviceId = settings?.deviceId ?? deviceId ?? null;
        setSelectedDeviceId(activeDeviceId);

        const label = track?.label?.toLowerCase() ?? "";
        const isExternal =
          label.includes("elgato") ||
          label.includes("logitech") ||
          label.includes("external") ||
          label.includes("usb") ||
          label.includes("capture");
        setIsMirrored(!isExternal);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setIsReady(true);
        }

        await enumerateDevices();
      } catch (err) {
        if (err instanceof DOMException) {
          const messages: Record<string, string> = {
            NotAllowedError:
              "Camera toegang geweigerd. Sta camera toe in je browser.",
            NotFoundError: "Geen camera gevonden op dit apparaat.",
          };
          setError(messages[err.name] ?? `Camera fout: ${err.message}`);
        } else {
          setError("Onbekende camera fout.");
        }
      }
    },
    [stopCamera, enumerateDevices]
  );

  const switchCamera = useCallback(
    (deviceId: string) => {
      startCamera(deviceId);
    },
    [startCamera]
  );

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  return {
    videoRef,
    isReady,
    error,
    devices,
    selectedDeviceId,
    isMirrored,
    startCamera,
    stopCamera,
    switchCamera,
  };
}
