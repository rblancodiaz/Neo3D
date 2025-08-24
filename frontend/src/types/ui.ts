// UI related types
export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

export interface Modal {
  id: string;
  type: 'room-details' | 'room-form' | 'confirm' | 'image-upload';
  data?: any;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}