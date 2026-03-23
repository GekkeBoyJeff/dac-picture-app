import { MASCOTS } from "@/lib/config";
import { BottomDrawer } from "../BottomDrawer";

interface MascotPickerProps {
  currentId: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}

export function MascotPicker({ currentId, onSelect, onClose }: MascotPickerProps) {
  return (
    <BottomDrawer title="Mascot" onClose={onClose} closeOnSelect>
      <div className="flex gap-4 overflow-x-auto pb-2 px-3 scrollbar-none">
        {MASCOTS.map((m) => (
          <button
            key={m.id}
            onClick={() => { onSelect(m.id); }}
            className={`shrink-0 flex flex-col items-center gap-2 cursor-pointer transition-all ${
              m.id === currentId ? "opacity-100" : "opacity-50 hover:opacity-75"
            }`}
          >
            <div className={`w-20 h-20 rounded-2xl overflow-hidden border-2 ${
              m.id === currentId ? "border-white" : "border-transparent"
            }`}>
              <img
                src={m.thumbnail}
                alt={m.name}
                className="w-full h-full object-contain"
                draggable={false}
              />
            </div>
            <span className="text-white text-[11px] font-medium">{m.name}</span>
          </button>
        ))}
      </div>
    </BottomDrawer>
  );
}
