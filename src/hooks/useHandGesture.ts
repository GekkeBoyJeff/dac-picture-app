"use client";

import { useEffect, useRef, useCallback, useState } from "react";
// @ts-expect-error - MediaPipe types exist but moduleResolution doesn't resolve them
import { GestureRecognizer, FilesetResolver } from "@mediapipe/tasks-vision";

type GestureCategory = {
  categoryName: string;
  score: number;
};

type GestureResult = {
  gestures: GestureCategory[][];
};

const DETECTION_INTERVAL_MS = 500;
const CONFIDENCE_THRESHOLD = 0.3;
// Consecutive detections required before firing
const REQUIRED_CONSECUTIVE_VICTORY = 3;
const REQUIRED_CONSECUTIVE_FIST_PALM = 2;
// Cooldown after fist/palm fires to prevent rapid toggling
const FIST_PALM_COOLDOWN_MS = 2000;

export type ActiveGesture = "Victory" | "Closed_Fist" | null;

interface GestureCallbacks {
  onVictory: () => void;
  onClosedFist?: () => void;
}

export function useHandGesture(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  enabled: boolean,
  callbacks: GestureCallbacks
) {
  const recognizerRef = useRef<GestureRecognizer | null>(null);
  const animFrameRef = useRef<number>(0);
  const lastTimestampRef = useRef(-1);
  const [activeGesture, setActiveGesture] = useState<ActiveGesture>(null);

  // Per-gesture tracking
  const victoryConsecutiveRef = useRef(0);
  const victoryFiredRef = useRef(false);
  const fistConsecutiveRef = useRef(0);
  const fistCooldownRef = useRef(false);

  // Reset victory fired state when re-enabled
  useEffect(() => {
    if (enabled) {
      victoryFiredRef.current = false;
      victoryConsecutiveRef.current = 0;
      setActiveGesture(null);
    }
  }, [enabled]);

  const initRecognizer = useCallback(async () => {
    if (recognizerRef.current) return;

    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );

    const modelOptions = {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
        delegate: "GPU" as const,
      },
      runningMode: "VIDEO" as const,
      numHands: 2,
    };

    try {
      recognizerRef.current = await GestureRecognizer.createFromOptions(vision, modelOptions);
    } catch {
      // GPU delegate failed (e.g. external webcam codec issue) — fall back to CPU
      recognizerRef.current = await GestureRecognizer.createFromOptions(vision, {
        ...modelOptions,
        baseOptions: { ...modelOptions.baseOptions, delegate: "CPU" as const },
      });
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    let stopped = false;

    const run = async () => {
      await initRecognizer();
      if (stopped) return;

      const detect = () => {
        if (stopped || !enabled) return;

        const video = videoRef.current;
        const recognizer = recognizerRef.current;

        if (
          video &&
          recognizer &&
          video.readyState >= 2 &&
          video.videoWidth > 0
        ) {
          const now = performance.now();
          if (now > lastTimestampRef.current) {
            lastTimestampRef.current = now;
            try {
              const origError = console.error;
              const origWarn = console.warn;
              console.error = () => {};
              console.warn = () => {};
              let result;
              try {
                result = recognizer.recognizeForVideo(video, now);
              } finally {
                console.error = origError;
                console.warn = origWarn;
              }

              const gestures = (result as GestureResult).gestures;

              // Find the best gesture across all detected hands
              let bestGesture: string | null = null;
              let bestScore = 0;
              for (const gestureList of gestures) {
                for (const g of gestureList) {
                  if (g.score >= CONFIDENCE_THRESHOLD && g.score > bestScore) {
                    bestGesture = g.categoryName;
                    bestScore = g.score;
                  }
                }
              }

              // Victory (peace sign) → take photo
              if (bestGesture === "Victory") {
                victoryConsecutiveRef.current++;
                fistConsecutiveRef.current = 0;
                setActiveGesture("Victory");

                if (
                  victoryConsecutiveRef.current >= REQUIRED_CONSECUTIVE_VICTORY &&
                  !victoryFiredRef.current
                ) {
                  victoryFiredRef.current = true;
                  setActiveGesture(null);
                  callbacks.onVictory();
                  return;
                }
              }
              // Closed fist → open dialog
              else if (bestGesture === "Closed_Fist" && callbacks.onClosedFist) {
                fistConsecutiveRef.current++;
                victoryConsecutiveRef.current = 0;
                setActiveGesture("Closed_Fist");

                if (
                  fistConsecutiveRef.current >= REQUIRED_CONSECUTIVE_FIST_PALM &&
                  !fistCooldownRef.current
                ) {
                  fistCooldownRef.current = true;
                  fistConsecutiveRef.current = 0;
                  setActiveGesture(null);
                  callbacks.onClosedFist();
                  setTimeout(() => {
                    fistCooldownRef.current = false;
                  }, FIST_PALM_COOLDOWN_MS);
                }
              }
              // No recognized gesture
              else {
                victoryConsecutiveRef.current = 0;
                fistConsecutiveRef.current = 0;
                setActiveGesture(null);
              }
            } catch {
              // Frame processing error, skip
            }
          }
        }

        setTimeout(() => {
          if (!stopped) {
            animFrameRef.current = requestAnimationFrame(detect);
          }
        }, DETECTION_INTERVAL_MS);
      };

      animFrameRef.current = requestAnimationFrame(detect);
    };

    run();

    return () => {
      stopped = true;
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [enabled, videoRef, callbacks, initRecognizer]);

  // Cleanup recognizer on unmount
  useEffect(() => {
    return () => {
      recognizerRef.current?.close();
      recognizerRef.current = null;
    };
  }, []);

  return { activeGesture };
}
