import { create } from "zustand"
import { persist } from "zustand/middleware"
import {
  LAYOUTS,
  DEFAULT_LAYOUT_ID,
  MASCOTS,
  DEFAULT_MASCOT_ID,
  getActiveConvention,
} from "@/lib/config"

export const useOverlayStore = create(
  persist(
    (set) => ({
      layoutId: DEFAULT_LAYOUT_ID,
      mascotId: DEFAULT_MASCOT_ID,

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

// -- Selectors --

export const selectLayout = (state) => LAYOUTS.find((l) => l.id === state.layoutId) || LAYOUTS[0]

export const selectMascot = (state) => MASCOTS.find((m) => m.id === state.mascotId) || MASCOTS[0]

export const selectActiveConvention = () => getActiveConvention()