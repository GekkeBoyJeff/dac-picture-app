import Image from "next/image"
import { assetPath } from "@/lib/config/basePath"

const Loading = () => (
  <div className="w-dvw h-dvh bg-black flex flex-col items-center justify-center">
    <Image
      src={assetPath("/overlays/logo.svg")}
      alt=""
      width={160}
      height={160}
      className="w-32 h-32 md:w-40 md:h-40 opacity-40 animate-pulse"
      draggable={false}
    />
    <div className="mt-6 text-center">
      <h1 className="text-white/40 text-2xl md:text-3xl font-semibold tracking-[0.15em] uppercase">
        Photo Booth
      </h1>
      <p className="text-white/20 text-sm mt-2 tracking-wide">
        Dutch Anime Community
      </p>
    </div>

    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3">
      <div className="w-6 h-6 rounded-full border-2 border-white/10 border-t-white/50 animate-spin" />
      <p className="text-white/20 text-xs tracking-widest uppercase">Laden...</p>
      <p className="text-white/10 text-[10px] tracking-wider mt-1">v{process.env.APP_VERSION}</p>
    </div>
  </div>
)

export default Loading