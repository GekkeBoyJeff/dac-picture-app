"use client"

import { CameraEmptyIcon, InfoIcon, WarningIcon } from "@/components/ui/icons"

function formatError(error) {
  if (!error) return "De camera kon niet worden gestart."
  return error
}

export function CameraIssueOverlay({ error, deviceCount = 0, onRetry }) {
  const isPermissionError = /toegang geweigerd|permission|notallowed/i.test(error || "")
  const isNoCameraError = /geen camera|not found|no camera/i.test(error || "") || deviceCount === 0

  const title = isPermissionError
    ? "Camera-toestemming nodig"
    : isNoCameraError
      ? "Geen camera gevonden"
      : "Camera start niet"

  const subtitle = isPermissionError
    ? "Sta cameratoegang toe in je browser en laad de pagina opnieuw."
    : isNoCameraError
      ? "Controleer of een camera is aangesloten en beschikbaar is voor deze browser."
      : "Er is iets misgegaan bij het opstarten van de camera."

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-[radial-gradient(circle_at_top,rgba(230,193,137,0.16),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(56,189,248,0.08),transparent_30%),linear-gradient(180deg,rgba(0,0,0,0.96),rgba(0,0,0,0.92))] px-6 py-8">
      <div className="w-full max-w-3xl overflow-hidden rounded-3xl border border-white/10 bg-white/[0.06] shadow-2xl shadow-black/50 backdrop-blur-xl">
        <div className="grid gap-0 lg:grid-cols-[1.02fr_0.98fr]">
          <div className="border-b border-white/10 p-6 sm:p-8 lg:border-b-0 lg:border-r">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-[0.7rem] uppercase tracking-[0.22em] text-amber-100">
              <WarningIcon className="h-3.5 w-3.5" />
              Camera fout
            </div>

            <div className="mt-5 flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-black/20">
                <CameraEmptyIcon className="h-6 w-6 text-white/70" />
              </div>
              <div className="min-w-0">
                <h2 className="text-2xl font-semibold tracking-tight text-white">{title}</h2>
                <p className="mt-2 max-w-lg text-sm leading-6 text-white/60">{subtitle}</p>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-sm font-medium text-white">Stap 1</p>
                <p className="mt-1 text-xs leading-5 text-white/50">Controleer of de browser cameratoegang mag gebruiken.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-sm font-medium text-white">Stap 2</p>
                <p className="mt-1 text-xs leading-5 text-white/50">Kijk of de camera echt verbonden en niet bezet is.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-sm font-medium text-white">Stap 3</p>
                <p className="mt-1 text-xs leading-5 text-white/50">Probeer daarna opnieuw of laad de pagina opnieuw.</p>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            <div className="space-y-3">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-[0.65rem] uppercase tracking-[0.22em] text-white/35">Technische melding</p>
                <p className="mt-2 text-sm leading-6 text-white/75">{formatError(error)}</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div className="flex items-start gap-3">
                  <InfoIcon className="mt-0.5 h-5 w-5 shrink-0 text-sky-200/80" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">Wat je nu kunt doen</p>
                    <p className="mt-1 text-xs leading-5 text-white/55">
                      Als je op een Raspberry Pi zit, controleer de kabel en of de juiste camera is aangesloten. Bij een normale pc is toestemming in de browser meestal de oorzaak.
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={onRetry}
                className="w-full rounded-2xl border border-sky-300/30 bg-sky-300/10 px-4 py-4 text-left transition-all hover:border-sky-200/45 hover:bg-sky-300/15"
              >
                <p className="text-sm font-semibold text-white">Opnieuw proberen</p>
                <p className="mt-1 text-xs leading-5 text-white/55">Start de camera opnieuw met de huidige instellingen.</p>
              </button>

              <div className="text-xs leading-5 text-white/45">
                {deviceCount > 0 ? `${deviceCount} camera's gedetecteerd. ` : "Geen camera gedetecteerd. "}
                Controleer de hardware of geef cameratoegang opnieuw.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}