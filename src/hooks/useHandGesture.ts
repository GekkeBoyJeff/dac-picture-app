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
const CONFIDENCE_THRESHOLD = 0.65;
// Require the peace sign to be held for this many consecutive detections
const REQUIRED_CONSECUTIVE = 3;

export function useHandGesture(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  enabled: boolean,
  onPeaceSign: () => void
) {
  const recognizerRef = useRef<GestureRecognizer | null>(null);
  const animFrameRef = useRef<number>(0);
  const consecutiveRef = useRef(0);
  const firedRef = useRef(false);
  const lastTimestampRef = useRef(-1);
  const [gestureActive, setGestureActive] = useState(false);

  // Reset fired state when re-enabled
  useEffect(() => {
    if (enabled) {
      firedRef.current = false;
      consecutiveRef.current = 0;
      setGestureActive(false);
    }
  }, [enabled]);

  const initRecognizer = useCallback(async () => {
    if (recognizerRef.current) return;

    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );

    recognizerRef.current = await GestureRecognizer.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
        delegate: "GPU",
      },
      runningMode: "VIDEO",
      numHands: 2,
    });
  }, []);

  useEffect(() => {
    if (!enabled) return;

    let stopped = false;

    const run = async () => {
      await initRecognizer();
      if (stopped) return;

      const detect = () => {
        if (stopped || !enabled || firedRef.current) return;

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
              // Suppress MediaPipe WASM info/warning messages that Next.js
              // dev overlay incorrectly treats as errors
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

              const isPeace = (result as GestureResult).gestures.some(
                (gestureList: GestureCategory[]) =>
                  gestureList.some(
                    (g: GestureCategory) =>
                      g.categoryName === "Victory" &&
                      g.score >= CONFIDENCE_THRESHOLD
                  )
              );

              if (isPeace) {
                consecutiveRef.current++;
                setGestureActive(true);
                if (
                  consecutiveRef.current >= REQUIRED_CONSECUTIVE &&
                  !firedRef.current
                ) {
                  firedRef.current = true;
                  setGestureActive(false);
                  onPeaceSign();
                  return;
                }
              } else {
                consecutiveRef.current = 0;
                setGestureActive(false);
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
  }, [enabled, videoRef, onPeaceSign, initRecognizer]);

  // Cleanup recognizer on unmount
  useEffect(() => {
    return () => {
      recognizerRef.current?.close();
      recognizerRef.current = null;
    };
  }, []);

  return { gestureActive };
}
