import Image from "next/image"
import { BottomDrawer } from "@/components/ui/BottomDrawer"
import { assetPath } from "@/lib/config/basePath"

export function AboutDrawer({ onClose }) {
  return (
    <BottomDrawer title="Over deze app" onClose={onClose}>
      <div className="flex flex-col items-center gap-4 py-4">
        <Image
          src={assetPath("/overlays/logo.svg")}
          alt=""
          width={64}
          height={64}
          className="w-16 h-16"
          draggable={false}
        />
        <div className="text-center">
          <h2 className="text-white text-lg font-semibold tracking-wide">DAC Photo Booth</h2>
          <p className="text-white/40 text-xs mt-1">v{process.env.APP_VERSION}</p>
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
  )
}