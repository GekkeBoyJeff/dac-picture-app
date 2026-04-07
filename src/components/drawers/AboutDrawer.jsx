import Image from "next/image"
import { BottomDrawer } from "@/components/ui/BottomDrawer"
import { drawerCompactCardClass, drawerSectionHelpClass, drawerSectionLabelClass } from "@/components/ui/drawerStyles"
import { assetPath } from "@/lib/config/basePath"

export function AboutDrawer({ onClose }) {
  return (
    <BottomDrawer title="Over deze app" subtitle="Korte achtergrond en versie-informatie." onClose={onClose} showHeaderDivider={false}>
      <div className="py-1">
        <div className={`${drawerCompactCardClass} p-4 sm:p-5`}>
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
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
                  <h2 className="text-base font-semibold tracking-wide text-white">DAC Fotobooth</h2>
                  <p className="mt-1 text-xs text-white/45">v{process.env.APP_VERSION}</p>
                </div>
              </div>

              <p className={`mt-3 max-w-[30rem] text-sm leading-6 ${drawerSectionHelpClass}`}>
                Fotobooth met camera-overlays, strip-modus, Discord-upload en een PWA-opzet voor event gebruik.
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-white/8 pt-3">
                <p className={drawerSectionLabelClass}>Maker</p>
                <p className="text-sm text-white/80">
                  Jeffrey Ullers ·{" "}
                  <a
                    href="https://www.jeffreyullers.nl"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/90 underline underline-offset-2 hover:text-white transition-colors"
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