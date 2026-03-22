import { FullscreenIcon, DownloadIcon, PhoneIcon, GridIcon } from "../icons";

export function ControlBar({
  onGalleryToggle,
  galleryCount,
  canInstall,
  onInstall,
  onPhoneQr,
}: {
  onGalleryToggle: () => void;
  galleryCount: number;
  canInstall: boolean;
  onInstall: () => void;
  onPhoneQr: () => void;
}) {
  return (
    <div className="absolute top-5 right-5 flex gap-2 z-10">
      <button
        onClick={onGalleryToggle}
        className="relative w-10 h-10 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer"
        aria-label="Galerij"
      >
        <GridIcon className="w-5 h-5 text-white/70" />
        {galleryCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-white/30 backdrop-blur-sm text-white text-[10px] flex items-center justify-center font-medium">
            {galleryCount}
          </span>
        )}
      </button>

      <button
        onClick={onPhoneQr}
        className="w-10 h-10 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 hidden md:flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer"
        aria-label="Open op telefoon"
      >
        <PhoneIcon className="w-5 h-5 text-white/70" />
      </button>

      {canInstall && (
        <button
          onClick={onInstall}
          className="w-10 h-10 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 hidden md:flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer"
          aria-label="Installeer app"
        >
          <DownloadIcon className="w-5 h-5 text-white/70" />
        </button>
      )}

      <button
        onClick={() => {
          if (document.fullscreenElement) {
            document.exitFullscreen();
          } else {
            document.documentElement.requestFullscreen().catch(() => {});
          }
        }}
        className="w-10 h-10 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 hidden md:flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer"
        aria-label="Volledig scherm"
      >
        <FullscreenIcon className="w-5 h-5 text-white/70" />
      </button>
    </div>
  );
}
