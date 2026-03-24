"use client";

import { useState, useCallback, useRef } from "react";
import { TOAST_DURATION_MS } from "@/lib/config";

export function useToast(duration = TOAST_DURATION_MS) {
  const [message, setMessage] = useState(null);
  const timerRef = useRef(undefined);

  const show = useCallback(
    (msg) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setMessage(msg);
      timerRef.current = setTimeout(() => setMessage(null), duration);
    },
    [duration]
  );

  const dismiss = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setMessage(null);
  }, []);

  return { message, show, dismiss };
}
