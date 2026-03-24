import { MASCOTS } from "@/lib/config";
import { BottomDrawer } from "../BottomDrawer";
import { useBooth } from "../BoothContext";

export function MascotPicker() {
  const { mascot, setMascotId, closeMascotPicker } = useBooth();

  return (
    <BottomDrawer title="Mascot" onClose={closeMascotPicker} closeOnSelect>
      <div className="flex gap-4 overflow-x-auto pb-2 px-3 scrollbar-none">
        {MASCOTS.map((m) => (
          <button
            key={m.id}
            onClick={() => { setMascotId(m.id); }}
            className={`shrink-0 flex flex-col items-center gap-2 cursor-pointer transition-all ${
              m.id === mascot.id ? "opacity-100" : "opacity-50 hover:opacity-75"
            }`}
          >
            <div className={`w-20 h-20 rounded-2xl overflow-hidden border-2 ${
              m.id === mascot.id ? "border-white" : "border-transparent"
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
