export interface OverlayConfig {
  path: string;
  position:
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right"
    | "middle-right"
    | "full";
  maxWidth: number;
  maxHeight: number;
  opacity: number;
  padding: number;
  invert?: boolean;
  fixedSize?: boolean;
}

export interface PhotoEntry {
  id: string;
  dataUrl: string;
  createdAt: number;
}

export interface SendPhotoRequest {
  imageBase64: string;
}

export interface ApiResponse {
  success: boolean;
  error?: string;
}
