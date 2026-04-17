import { create } from "zustand"
import { persist } from "zustand/middleware"
import {
  LAYOUTS, DEFAULT_LAYOUT_ID,
  MASCOTS, DEFAULT_MASCOT_ID,
  getActiveConvention,
} from "@/lib/config"

export const useOverlayStore = create(
  persist(
    (set, get) => ({
      layoutId: DEFAULT_LAYOUT_ID,
      mascotId: DEFAULT_MASCOT_ID,

      /** @returns {import("@/lib/config/presets").Layout} */
      get layout() {
        return LAYOUTS.find((l) => l.id === get().layoutId) || LAYOUTS[0]
      },

      /** @returns {import("@/lib/config/presets").Mascot} */
      get mascot() {
        return MASCOTS.find((m) => m.id === get().mascotId) || MASCOTS[0]
      },

      get activeConvention() {
        return getActiveConvention()
      },

      setLayoutId: (layoutId) => set({ layoutId }),
      setMascotId: (mascotId) => set({ mascotId }),
    }),
    {
      name: "overlay-settings",
      partialize: (state) => ({
        layoutId: state.layoutId,
        mascotId: state.mascotId,
      }),
    },
  ),
)

// Selector helpers for computed values
export const selectLayout = (state) =>
  LAYOUTS.find((l) => l.id === state.layoutId) || LAYOUTS[0]

export const selectMascot = (state) =>
  MASCOTS.find((m) => m.id === state.mascotId) || MASCOTS[0]

export const selectActiveConvention = () => getActiveConvention()