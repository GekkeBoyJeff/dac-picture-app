/** All values in rem */
export interface OverlaySize {
  maxWidth: number;
  maxHeight: number;
  padding: number;
}

export interface OverlayConfig {
  path: string;
  position:
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right"
    | "middle-right"
    | "full";
  opacity: number;
  invert?: boolean;
  fixedSize?: boolean;
  /** Fixed rem sizes per breakpoint */
  sizes: {
    sm: OverlaySize;
    md: OverlaySize;
    lg: OverlaySize;
  };
}

export interface PhotoEntry {
  id: string;
  dataUrl: string;
  createdAt: number;
}
