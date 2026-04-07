import Image from "next/image"
import { MASCOTS } from "@/lib/config"
import { useOverlayStore, selectMascot } from "@/stores/overlayStore"
import { PickerDrawer } from "./PickerDrawer"

export function MascotPicker({ onClose }) {
  const mascot = useOverlayStore(selectMascot)
  const setMascotId = useOverlayStore((s) => s.setMascotId)

  return (
    <PickerDrawer
      title="Mascotte"
      subtitle="Kies de mascotte die in de overlay en op de strip verschijnt."
      onClose={onClose}
      options={MASCOTS}
      selectedId={mascot.id}
      onSelect={setMascotId}
      showSummaryCard={false}
      getOptionKey={(item) => item.id}
      getOptionLabel={(item) => item.name}
      renderOption={(item, isSelected) => (
        <div className={`relative w-full max-w-[9rem] overflow-hidden rounded-lg border ${isSelected ? "border-white/35 bg-white/[0.08]" : "border-white/10 bg-white/[0.03]"}`}>
          <div className="flex items-center justify-center bg-[radial-gradient(circle_at_top,rgba(230,193,137,0.12),transparent_55%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent)] p-4">
            <Image
              src={item.thumbnail}
              alt={item.name}
              width={80}
              height={80}
              sizes="80px"
              loading="eager"
              unoptimized
              className={`h-20 w-20 object-contain transition-transform duration-300 ${isSelected ? "scale-105" : "scale-100"}`}
              draggable={false}
            />
          </div>
          <div className="border-t border-white/10 px-3 py-2 text-center">
            <p className="text-[0.65rem] uppercase tracking-[0.18em] text-white/45">Overlay</p>
            <p className="mt-1 text-xs font-medium text-white/80">{isSelected ? "Actief" : "Kies deze"}</p>
          </div>
        </div>
      )}
    />
  )
}