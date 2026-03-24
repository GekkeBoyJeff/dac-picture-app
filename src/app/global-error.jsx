"use client";

import { WarningIcon } from "@/components/icons";

// Replaces the root layout when an uncaught error bubbles up,
// so it must define its own <html> and <body>.
export default function GlobalError() {
  return (
    <html lang="nl">
      <body className="h-full bg-black text-white">
        <div className="w-screen h-screen flex items-center justify-center">
          <div className="text-center p-8 max-w-md">
            <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
              <WarningIcon className="w-10 h-10 text-red-400" />
            </div>
            <p className="text-white/80 text-lg mb-4">
              Er ging iets mis. Herlaad de pagina om opnieuw te beginnen.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer"
            >
              Pagina herladen
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
