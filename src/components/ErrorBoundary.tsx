"use client";

import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-screen h-screen bg-black flex items-center justify-center">
          <div className="text-center p-8 max-w-md">
            <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-10 h-10 text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                />
              </svg>
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
      );
    }

    return this.props.children;
  }
}
