import Image from "next/image"
import { BottomDrawer } from "@/components/ui/BottomDrawer"
import { assetPath } from "@/lib/config/basePath"

export function AboutDrawer({ onClose }) {
  return (
    <BottomDrawer
      title="Over deze app"
      subtitle="Korte achtergrond en versie-informatie."
      onClose={onClose}
    >
      <div className="py-1">
        <div className="rounded-none border border-white/10 bg-[#111] p-4 sm:p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-none border border-white/20 bg-black">
              <Image
                src={assetPath("/overlays/logo.svg")}
                alt=""
                width={32}
                height={32}
                className="h-8 w-8"
                draggable={false}
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-base font-bold tracking-[0.1em] uppercase text-white font-display">
                    DAC Fotobooth
                  </h2>
                  <p className="mt-1 text-xs text-white/40 font-mono">v{process.env.APP_VERSION}</p>
                </div>
              </div>

              <p className="mt-3 max-w-[30rem] text-sm leading-6 text-white/40">
                Fotobooth met camera-overlays, strip-modus, Discord-upload en een PWA-opzet voor
                event gebruik.
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-white/10 pt-3">
                <p className="text-[0.7rem] uppercase tracking-[0.24em] text-white/40 font-mono">
                  Maker
                </p>
                <p className="text-sm text-white/60">
                  Jeffrey Ullers &middot;{" "}
                  <a
                    href="https://www.jeffreyullers.nl"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-2 text-[#e6c189]"
                  >
                    jeffreyullers.nl
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </BottomDrawer>
  )
}
