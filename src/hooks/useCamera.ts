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
            ...(deviceId
              ? { deviceId: { exact: deviceId } }
              : /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)
                ? { facingMode: "user" }
                : {}),
            width: { ideal: isPortrait ? VIDEO.IDEAL_HEIGHT : VIDEO.IDEAL_WIDTH },
            height: { ideal: isPortrait ? VIDEO.IDEAL_WIDTH : VIDEO.IDEAL_HEIGHT },
            aspectRatio: { ideal: isPortrait ? 9 / 16 : 16 / 9 },
          } as MediaTrackConstraints,
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;

        const track = stream.getVideoTracks()[0];
        const settings = track?.getSettings();
        const activeDeviceId = settings?.deviceId ?? deviceId ?? null;
        setSelectedDeviceId(activeDeviceId);

        const facingMode = settings?.facingMode;
        const label = track?.label?.toLowerCase() ?? "";
        const isExternal =
          label.includes("elgato") ||
          label.includes("logitech") ||
          label.includes("external") ||
          label.includes("usb") ||
          label.includes("capture");
        // Mirror only front-facing cameras; back cameras and external devices stay normal
        setIsMirrored(
          facingMode ? facingMode === "user" : !isExternal
        );

        // Set zoom to minimum (widest angle) and enable image stabilization
        // These properties exist at runtime on mobile browsers but not in TS types
        try {
          const caps = track?.getCapabilities?.() as Record<string, unknown> | undefined;
          const advanced: Record<string, unknown>[] = [];

          const zoom = caps?.zoom as { min: number } | undefined;
          if (zoom) {
            advanced.push({ zoom: zoom.min });
          }

          const stabilization = caps?.imageStabilization as string[] | undefined;
          if (stabilization?.includes("on")) {
            advanced.push({ imageStabilization: "on" });
          }

          if (advanced.length > 0) {
            await track.applyConstraints({ advanced } as MediaTrackConstraints);
          }
        } catch {
          // Not all browsers/devices support these capabilities
        }

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

  // Re-initialize camera on resize/orientation change to recalculate constraints and reset zoom
  useEffect(() => {
    if (!isReady) return;

    let timeout: ReturnType<typeof setTimeout>;
    const handler = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        startCamera(selectedDeviceId);
      }, 500);
    };

    window.addEventListener("resize", handler);
    window.addEventListener("orientationchange", handler);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener("resize", handler);
      window.removeEventListener("orientationchange", handler);
    };
  }, [isReady, selectedDeviceId, startCamera]);

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
