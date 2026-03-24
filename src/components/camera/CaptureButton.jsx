import { useBooth } from "../BoothContext";

export function CaptureButton() {
  const { onCapture, disabled } = useBooth();

  return (
    <button
      onClick={onCapture}
      disabled={disabled}
      className="pointer-events-auto absolute bottom-[12%] left-1/2 -translate-x-1/2 max-lg:landscape:bottom-auto max-lg:landscape:left-auto max-lg:landscape:translate-x-0 max-lg:landscape:right-[8%] max-lg:landscape:top-1/2 max-lg:landscape:-translate-y-1/2 z-10 cursor-pointer disabled:cursor-not-allowed group"
      aria-label="Maak foto"
    >
      <div
        className={`w-20 h-20 md:w-24 md:h-24 rounded-full bg-white/10 backdrop-blur-md border-2 border-white/50 flex items-center justify-center transition-all hover:bg-white/20 hover:scale-105 active:scale-95 ${
          !disabled ? "animate-shutter-pulse" : "opacity-40"
        }`}
      >
        <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-white group-hover:bg-white/90 transition-colors" />
      </div>
    </button>
  );
}
