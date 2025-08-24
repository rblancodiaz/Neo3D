// Canvas and drawing specific types
export interface Point {
  x: number;
  y: number;
}

export interface PixelCoordinates {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface NormalizedCoordinates {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DrawingState {
  isDrawing: boolean;
  startPoint: Point | null;
  currentRect: PixelCoordinates | null;
  selectedRoomId: string | null;
  hoveredRoomId: string | null;
}

export interface ViewportState {
  scale: number;
  offsetX: number;
  offsetY: number;
  isDragging: boolean;
  dragStart: Point | null;
}

export enum DrawingTool {
  SELECT = 'select',
  RECTANGLE = 'rectangle',
  PAN = 'pan',
  ZOOM_IN = 'zoom_in',
  ZOOM_OUT = 'zoom_out',
}