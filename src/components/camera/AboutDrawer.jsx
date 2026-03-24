import { BottomDrawer } from "../BottomDrawer";
import { useBooth } from "../BoothContext";

export function AboutDrawer() {
  const { closeAbout } = useBooth();

  return (
    <BottomDrawer title="Over deze app" onClose={closeAbout}>
      <div className="flex flex-col items-center gap-4 py-4">
        <img
          src={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/overlays/logo.svg`}
          alt=""
          className="w-16 h-16"
          draggable={false}
        />
        <div className="text-center">
          <h2 className="text-white text-lg font-semibold tracking-wide">DAC Photo Booth</h2>
          <p className="text-white/40 text-xs mt-1">v1.0.1</p>
        </div>
        <p className="text-white/50 text-sm text-center max-w-xs">
          Gemaakt door{" "}
          <a
            href="https://www.jeffreyullers.nl"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/80 underline underline-offset-2 hover:text-white transition-colors"
          >
            Jeffrey Ullers
          </a>
        </p>
      </div>
    </BottomDrawer>
  );
}
