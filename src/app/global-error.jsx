"use client"

import { WarningIcon } from "@/components/ui/icons"

const GlobalError = () => (
  <html lang="nl">
    <body className="h-full bg-black text-white">
      <div className="w-screen h-screen flex items-center justify-center">
        <div className="text-center p-8 max-w-md">
          <div className="w-20 h-20 rounded-none border border-white/20 flex items-center justify-center mx-auto mb-6">
            <WarningIcon className="w-10 h-10 text-white" />
          </div>
          <p className="text-white text-lg mb-4 font-display uppercase tracking-[0.1em]">
            Er ging iets mis. Herlaad de pagina om opnieuw te beginnen.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 rounded-none border border-white/20 bg-black text-white hover:border-white transition-colors cursor-pointer font-mono"
          >
            Pagina herladen
          </button>
        </div>
      </div>
    </body>
  </html>
)

export default GlobalError
