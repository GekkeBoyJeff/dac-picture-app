"use client"

import { Component } from "react"
import { WarningIcon } from "@/components/ui/icons"

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error("[ErrorBoundary]", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-dvw h-dvh bg-black flex items-center justify-center">
          <div className="text-center p-8 max-w-md">
            <div className="w-20 h-20 rounded-none border border-white/20 flex items-center justify-center mx-auto mb-6">
              <WarningIcon className="w-10 h-10 text-white" />
            </div>
            <p className="text-white text-lg mb-4 font-display uppercase tracking-[0.1em]">
              Er ging iets mis. Herlaad de pagina om opnieuw te beginnen.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 rounded-none bg-black border border-white/20 text-white hover:border-white transition-colors cursor-pointer active:scale-95 font-mono"
            >
              Pagina herladen
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
