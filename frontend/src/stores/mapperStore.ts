import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { DrawingTool } from '../types';
import type { Point, PixelCoordinates, DrawingState, ViewportState } from '../types';

interface MapperStore {
  // Canvas state
  canvasRef: HTMLCanvasElement | null;
  imageElement: HTMLImageElement | null;
  
  // Drawing state
  drawingState: DrawingState;
  currentTool: DrawingTool;
  
  // Viewport state
  viewportState: ViewportState;
  
  // Grid settings
  showGrid: boolean;
  gridSize: number;
  snapToGrid: boolean;
  
  // History for undo/redo
  history: any[];
  historyIndex: number;
  maxHistorySize: number;
  
  // Actions
  setCanvasRef: (canvas: HTMLCanvasElement | null) => void;
  setImageElement: (image: HTMLImageElement | null) => void;
  setCurrentTool: (tool: DrawingTool) => void;
  setDrawingState: (state: Partial<DrawingState>) => void;
  setViewportState: (state: Partial<ViewportState>) => void;
  
  // Drawing actions
  startDrawing: (point: Point) => void;
  updateDrawing: (point: Point) => void;
  endDrawing: () => void;
  cancelDrawing: () => void;
  
  // Viewport actions
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  pan: (deltaX: number, deltaY: number) => void;
  fitToScreen: () => void;
  
  // Grid actions
  toggleGrid: () => void;
  setGridSize: (size: number) => void;
  toggleSnapToGrid: () => void;
  
  // History actions
  undo: () => void;
  redo: () => void;
  addToHistory: (action: any) => void;
  clearHistory: () => void;
  
  // Selection actions
  selectRoom: (roomId: string | null) => void;
  hoverRoom: (roomId: string | null) => void;
  
  // Utility
  reset: () => void;
}

const initialDrawingState: DrawingState = {
  isDrawing: false,
  startPoint: null,
  currentRect: null,
  selectedRoomId: null,
  hoveredRoomId: null,
};

const initialViewportState: ViewportState = {
  scale: 1,
  offsetX: 0,
  offsetY: 0,
  isDragging: false,
  dragStart: null,
};

export const useMapperStore = create<MapperStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      canvasRef: null,
      imageElement: null,
      drawingState: initialDrawingState,
      currentTool: DrawingTool.SELECT,
      viewportState: initialViewportState,
      showGrid: false,
      gridSize: 20,
      snapToGrid: false,
      history: [],
      historyIndex: -1,
      maxHistorySize: 10,

      // Basic setters
      setCanvasRef: (canvas) => set({ canvasRef: canvas }),
      setImageElement: (image) => set({ imageElement: image }),
      setCurrentTool: (tool) => set({ currentTool: tool }),
      
      setDrawingState: (state) =>
        set((prev) => ({
          drawingState: { ...prev.drawingState, ...state },
        })),
      
      setViewportState: (state) =>
        set((prev) => ({
          viewportState: { ...prev.viewportState, ...state },
        })),

      // Drawing actions
      startDrawing: (point) => {
        const { currentTool } = get();
        if (currentTool === DrawingTool.RECTANGLE) {
          set((state) => ({
            drawingState: {
              ...state.drawingState,
              isDrawing: true,
              startPoint: point,
              currentRect: null,
            },
          }));
        }
      },

      updateDrawing: (point) => {
        const { drawingState, snapToGrid, gridSize } = get();
        if (!drawingState.isDrawing || !drawingState.startPoint) return;

        let adjustedPoint = point;
        if (snapToGrid) {
          adjustedPoint = {
            x: Math.round(point.x / gridSize) * gridSize,
            y: Math.round(point.y / gridSize) * gridSize,
          };
        }

        const rect: PixelCoordinates = {
          x: Math.min(drawingState.startPoint.x, adjustedPoint.x),
          y: Math.min(drawingState.startPoint.y, adjustedPoint.y),
          width: Math.abs(adjustedPoint.x - drawingState.startPoint.x),
          height: Math.abs(adjustedPoint.y - drawingState.startPoint.y),
        };

        set((state) => ({
          drawingState: {
            ...state.drawingState,
            currentRect: rect,
          },
        }));
      },

      endDrawing: () => {
        const { drawingState } = get();
        if (drawingState.currentRect) {
          get().addToHistory({
            type: 'draw',
            rect: drawingState.currentRect,
          });
        }
        set((state) => ({
          drawingState: {
            ...state.drawingState,
            isDrawing: false,
            startPoint: null,
            currentRect: null,
          },
        }));
      },

      cancelDrawing: () =>
        set((state) => ({
          drawingState: {
            ...state.drawingState,
            isDrawing: false,
            startPoint: null,
            currentRect: null,
          },
        })),

      // Viewport actions
      zoomIn: () => {
        const { viewportState } = get();
        const newScale = Math.min(viewportState.scale * 1.2, 5);
        set((state) => ({
          viewportState: {
            ...state.viewportState,
            scale: newScale,
          },
        }));
      },

      zoomOut: () => {
        const { viewportState } = get();
        const newScale = Math.max(viewportState.scale / 1.2, 0.1);
        set((state) => ({
          viewportState: {
            ...state.viewportState,
            scale: newScale,
          },
        }));
      },

      resetZoom: () =>
        set((state) => ({
          viewportState: {
            ...state.viewportState,
            scale: 1,
            offsetX: 0,
            offsetY: 0,
          },
        })),

      pan: (deltaX, deltaY) =>
        set((state) => ({
          viewportState: {
            ...state.viewportState,
            offsetX: state.viewportState.offsetX + deltaX,
            offsetY: state.viewportState.offsetY + deltaY,
          },
        })),

      fitToScreen: () => {
        const { canvasRef, imageElement } = get();
        if (!canvasRef || !imageElement) return;

        const scaleX = canvasRef.width / imageElement.width;
        const scaleY = canvasRef.height / imageElement.height;
        const scale = Math.min(scaleX, scaleY, 1);

        set((state) => ({
          viewportState: {
            ...state.viewportState,
            scale,
            offsetX: 0,
            offsetY: 0,
          },
        }));
      },

      // Grid actions
      toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),
      setGridSize: (size) => set({ gridSize: size }),
      toggleSnapToGrid: () => set((state) => ({ snapToGrid: !state.snapToGrid })),

      // History actions
      undo: () => {
        const { history, historyIndex } = get();
        if (historyIndex > 0) {
          set({ historyIndex: historyIndex - 1 });
          // Apply undo action
        }
      },

      redo: () => {
        const { history, historyIndex } = get();
        if (historyIndex < history.length - 1) {
          set({ historyIndex: historyIndex + 1 });
          // Apply redo action
        }
      },

      addToHistory: (action) => {
        const { history, historyIndex, maxHistorySize } = get();
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(action);
        
        if (newHistory.length > maxHistorySize) {
          newHistory.shift();
        }
        
        set({
          history: newHistory,
          historyIndex: newHistory.length - 1,
        });
      },

      clearHistory: () => set({ history: [], historyIndex: -1 }),

      // Selection actions
      selectRoom: (roomId) =>
        set((state) => ({
          drawingState: {
            ...state.drawingState,
            selectedRoomId: roomId,
          },
        })),

      hoverRoom: (roomId) =>
        set((state) => ({
          drawingState: {
            ...state.drawingState,
            hoveredRoomId: roomId,
          },
        })),

      // Reset
      reset: () =>
        set({
          canvasRef: null,
          imageElement: null,
          drawingState: initialDrawingState,
          currentTool: DrawingTool.SELECT,
          viewportState: initialViewportState,
          showGrid: false,
          gridSize: 20,
          snapToGrid: false,
          history: [],
          historyIndex: -1,
        }),
    }),
    {
      name: 'mapper-store',
    },
  ),
);