"use client";

import { memo, useState, useEffect, useRef } from "react";
import { Spinner } from "../Spinner";
import { pickRandom } from "@/lib/random";

/**
 * Lightweight status overlay shown during camera recalibration or switching.
 *
 * @param {boolean} visible     — controls fade in/out
 * @param {string|string[]} messages — single string or array (cycles every 1.2s)
 * @param {string} [backdrop]   — Tailwind bg class, defaults to semi-transparent
 */
export const StatusOverlay = memo(function StatusOverlay({ visible, messages, backdrop = "bg-black/60 backdrop-blur-sm" }) {
  const list = Array.isArray(messages) ? messages : [messages];
  const cycles = list.length > 1;

  const [message, setMessage] = useState(list[0]);
  const [tick, setTick] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!visible || !cycles) {
      clearInterval(intervalRef.current);
      return;
    }
    setMessage(pickRandom(list, null));
    setTick((t) => t + 1);
    intervalRef.current = setInterval(() => {
      setMessage((prev) => pickRandom(list, prev));
      setTick((t) => t + 1);
    }, 1200);
    return () => clearInterval(intervalRef.current);
  }, [visible, cycles]);

  useEffect(() => {
    if (!cycles) setMessage(list[0]);
  }, [messages]);

  return (
    <div
      className={`absolute inset-0 z-30 flex items-center justify-center transition-opacity duration-300 ${backdrop} ${
        visible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-black/70 backdrop-blur-xl border border-white/10">
        <Spinner />
        <p
          key={`${message}-${tick}`}
          className="text-white/70 text-sm font-medium"
          style={cycles ? { animation: "splash-text 0.3s ease-out" } : undefined}
        >
          {message}
        </p>
      </div>
    </div>
  );
});
