import Image from "next/image"
import { MASCOTS } from "@/lib/config"
import { useOverlayStore, selectMascot } from "@/stores/overlayStore"
import { cn } from "@/lib/styles/cn"
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
        <div
          className={cn(
            "relative flex w-full max-w-40 items-center justify-center overflow-hidden rounded-2xl border p-5 transition-all duration-300",
            isSelected
              ? "border-gold/55 bg-[radial-gradient(circle_at_center,rgba(230,193,137,0.28),transparent_65%)]"
              : "border-hairline bg-[radial-gradient(circle_at_top,rgba(230,193,137,0.1),transparent_60%)]",
          )}
        >
          <Image
            src={item.thumbnail}
            alt={item.name}
            width={104}
            height={104}
            sizes="104px"
            loading="eager"
            unoptimized
            className={cn(
              "h-24 w-24 object-contain transition-transform duration-300",
              isSelected ? "scale-110" : "scale-100",
            )}
            draggable={false}
          />
        </div>
      )}
    />
  )
}