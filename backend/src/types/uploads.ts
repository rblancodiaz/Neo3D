export interface ImageMetadata {
  width: number;
  height: number;
  format: string;
  size: number;
  density?: number;
  channels?: number;
  hasAlpha?: boolean;
  orientation?: number;
}

export interface ImageProcessingOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  position?: 'top' | 'right top' | 'right' | 'right bottom' | 'bottom' | 'left bottom' | 'left' | 'left top' | 'center';
  background?: string;
  withoutEnlargement?: boolean;
}

export interface ThumbnailOptions {
  width: number;
  height: number;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  position?: string;
  quality?: number;
}

export interface ProcessedImage {
  buffer: Buffer;
  info: {
    width: number;
    height: number;
    format: string;
    size: number;
  };
}

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  fileInfo?: {
    size: number;
    mimeType: string;
    extension: string;
  };
}

export interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  destination: string;
  filename: string;
  path: string;
  size: number;
}

export interface ImageUrls {
  original: string;
  processed: string;
  thumbnail: string;
}

export interface ImageDimensions {
  width: number;
  height: number;
  aspectRatio: number;
}