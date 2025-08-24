import { useEffect, useRef, useCallback } from 'react';
import { useMapperStore } from '../stores/mapperStore';
import { useHotelStore } from '../stores/hotelStore';
import { DrawingTool } from '../types';
import type { Point, PixelCoordinates, NormalizedCoordinates } from '../types';
import { normalizeCoordinates, denormalizeCoordinates } from '../utils/coordinates';

interface UseCanvasDrawingOptions {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  imageUrl?: string;
}

export const useCanvasDrawing = ({ canvasRef, imageUrl }: UseCanvasDrawingOptions) => {
  const animationFrameRef = useRef<number>();
  const imageRef = useRef<HTMLImageElement | null>(null);
  
  const {
    drawingState,
    viewportState,
    currentTool,
    showGrid,
    gridSize,
    startDrawing,
    updateDrawing,
    endDrawing,
    cancelDrawing,
    selectRoom,
    hoverRoom,
    setImageElement,
    pan,
  } = useMapperStore();
  
  const { rooms, currentFloor } = useHotelStore();

  // Load image
  useEffect(() => {
    if (!imageUrl) {
      console.log('No imageUrl provided to useCanvasDrawing');
      return;
    }
    
    console.log('Loading image from URL:', imageUrl);
    const img = new Image();
    img.onload = () => {
      console.log('Image loaded successfully:', imageUrl, 'Dimensions:', img.width, 'x', img.height);
      imageRef.current = img;
      setImageElement(img);
      render();
    };
    img.onerror = (error) => {
      console.error('Failed to load image:', imageUrl, error);
    };
    img.src = imageUrl;
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [imageUrl, setImageElement]);

  // Get mouse position relative to canvas
  const getMousePosition = useCallback(
    (e: MouseEvent): Point => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    },
    [canvasRef]
  );

  // Convert canvas coordinates to image coordinates
  const canvasToImage = useCallback(
    (point: Point): Point => {
      return {
        x: (point.x - viewportState.offsetX) / viewportState.scale,
        y: (point.y - viewportState.offsetY) / viewportState.scale,
      };
    },
    [viewportState]
  );

  // Convert image coordinates to canvas coordinates
  const imageToCanvas = useCallback(
    (point: Point): Point => {
      return {
        x: point.x * viewportState.scale + viewportState.offsetX,
        y: point.y * viewportState.scale + viewportState.offsetY,
      };
    },
    [viewportState]
  );

  // Check if point is inside rectangle
  const isPointInRect = (point: Point, rect: PixelCoordinates): boolean => {
    return (
      point.x >= rect.x &&
      point.x <= rect.x + rect.width &&
      point.y >= rect.y &&
      point.y <= rect.y + rect.height
    );
  };

  // Find room at position
  const getRoomAtPosition = useCallback(
    (point: Point): string | null => {
      if (!imageRef.current) return null;
      
      const imagePoint = canvasToImage(point);
      const normalizedPoint = {
        x: imagePoint.x / imageRef.current.width,
        y: imagePoint.y / imageRef.current.height,
      };
      
      for (const room of rooms) {
        const coords = room.coordinates;
        if (
          normalizedPoint.x >= coords.x &&
          normalizedPoint.x <= coords.x + coords.width &&
          normalizedPoint.y >= coords.y &&
          normalizedPoint.y <= coords.y + coords.height
        ) {
          return room.id;
        }
      }
      
      return null;
    },
    [rooms, canvasToImage]
  );

  // Render canvas
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const image = imageRef.current;
    
    if (!canvas || !ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Save context state
    ctx.save();
    
    // Apply viewport transformation
    ctx.translate(viewportState.offsetX, viewportState.offsetY);
    ctx.scale(viewportState.scale, viewportState.scale);
    
    // Draw image
    if (image) {
      ctx.drawImage(image, 0, 0);
      
      // Draw grid
      if (showGrid) {
        ctx.strokeStyle = 'rgba(200, 200, 200, 0.3)';
        ctx.lineWidth = 1 / viewportState.scale;
        
        for (let x = 0; x <= image.width; x += gridSize) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, image.height);
          ctx.stroke();
        }
        
        for (let y = 0; y <= image.height; y += gridSize) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(image.width, y);
          ctx.stroke();
        }
      }
      
      // Draw existing rooms
      rooms.forEach((room) => {
        const pixelCoords = denormalizeCoordinates(
          room.coordinates,
          image.width,
          image.height
        );
        
        // Set styles based on state
        if (room.id === drawingState.selectedRoomId) {
          ctx.fillStyle = 'rgba(59, 130, 246, 0.3)';
          ctx.strokeStyle = '#3b82f6';
          ctx.lineWidth = 2 / viewportState.scale;
        } else if (room.id === drawingState.hoveredRoomId) {
          ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
          ctx.strokeStyle = '#60a5fa';
          ctx.lineWidth = 2 / viewportState.scale;
        } else {
          ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
          ctx.strokeStyle = '#93c5fd';
          ctx.lineWidth = 1 / viewportState.scale;
        }
        
        // Draw rectangle
        ctx.fillRect(
          pixelCoords.x,
          pixelCoords.y,
          pixelCoords.width,
          pixelCoords.height
        );
        ctx.strokeRect(
          pixelCoords.x,
          pixelCoords.y,
          pixelCoords.width,
          pixelCoords.height
        );
        
        // Draw room number
        ctx.fillStyle = '#1e40af';
        ctx.font = `${14 / viewportState.scale}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
          room.roomNumber,
          pixelCoords.x + pixelCoords.width / 2,
          pixelCoords.y + pixelCoords.height / 2
        );
      });
      
      // Draw current drawing rectangle
      if (drawingState.currentRect && image) {
        const imageRect = canvasToImage({
          x: drawingState.currentRect.x,
          y: drawingState.currentRect.y,
        });
        const imageEndPoint = canvasToImage({
          x: drawingState.currentRect.x + drawingState.currentRect.width,
          y: drawingState.currentRect.y + drawingState.currentRect.height,
        });
        
        ctx.fillStyle = 'rgba(34, 197, 94, 0.2)';
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 2 / viewportState.scale;
        ctx.setLineDash([5 / viewportState.scale, 5 / viewportState.scale]);
        
        ctx.fillRect(
          imageRect.x,
          imageRect.y,
          imageEndPoint.x - imageRect.x,
          imageEndPoint.y - imageRect.y
        );
        ctx.strokeRect(
          imageRect.x,
          imageRect.y,
          imageEndPoint.x - imageRect.x,
          imageEndPoint.y - imageRect.y
        );
        ctx.setLineDash([]);
      }
    }
    
    // Restore context state
    ctx.restore();
    
    // Request next frame
    animationFrameRef.current = requestAnimationFrame(render);
  }, [
    canvasRef,
    viewportState,
    showGrid,
    gridSize,
    rooms,
    drawingState,
    canvasToImage,
  ]);

  // Start render loop
  useEffect(() => {
    render();
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [render]);

  // Mouse event handlers
  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
      const point = getMousePosition(e);
      
      if (currentTool === DrawingTool.RECTANGLE) {
        startDrawing(point);
      } else if (currentTool === DrawingTool.SELECT) {
        const roomId = getRoomAtPosition(point);
        selectRoom(roomId);
      } else if (currentTool === DrawingTool.PAN) {
        // Start panning
        useMapperStore.setState({
          viewportState: {
            ...viewportState,
            isDragging: true,
            dragStart: point,
          },
        });
      }
    },
    [currentTool, getMousePosition, startDrawing, getRoomAtPosition, selectRoom, viewportState]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      const point = getMousePosition(e);
      
      if (drawingState.isDrawing && currentTool === DrawingTool.RECTANGLE) {
        updateDrawing(point);
      } else if (viewportState.isDragging && currentTool === DrawingTool.PAN) {
        if (viewportState.dragStart) {
          const deltaX = point.x - viewportState.dragStart.x;
          const deltaY = point.y - viewportState.dragStart.y;
          pan(deltaX, deltaY);
          useMapperStore.setState({
            viewportState: {
              ...viewportState,
              dragStart: point,
            },
          });
        }
      } else {
        // Check for hover
        const roomId = getRoomAtPosition(point);
        hoverRoom(roomId);
      }
    },
    [
      currentTool,
      drawingState.isDrawing,
      viewportState,
      getMousePosition,
      updateDrawing,
      pan,
      getRoomAtPosition,
      hoverRoom,
    ]
  );

  const handleMouseUp = useCallback(
    (e: MouseEvent) => {
      if (drawingState.isDrawing && currentTool === DrawingTool.RECTANGLE) {
        endDrawing();
        
        // Create room with the drawn rectangle
        if (drawingState.currentRect && imageRef.current && currentFloor) {
          const imageRect = canvasToImage({
            x: drawingState.currentRect.x,
            y: drawingState.currentRect.y,
          });
          const imageEndPoint = canvasToImage({
            x: drawingState.currentRect.x + drawingState.currentRect.width,
            y: drawingState.currentRect.y + drawingState.currentRect.height,
          });
          
          const normalizedCoords = normalizeCoordinates(
            {
              x: imageRect.x,
              y: imageRect.y,
              width: imageEndPoint.x - imageRect.x,
              height: imageEndPoint.y - imageRect.y,
            },
            imageRef.current.width,
            imageRef.current.height
          );
          
          // Emit event to create room
          window.dispatchEvent(
            new CustomEvent('createRoom', {
              detail: { coordinates: normalizedCoords },
            })
          );
        }
      } else if (viewportState.isDragging) {
        useMapperStore.setState({
          viewportState: {
            ...viewportState,
            isDragging: false,
            dragStart: null,
          },
        });
      }
    },
    [
      currentTool,
      drawingState,
      viewportState,
      currentFloor,
      endDrawing,
      canvasToImage,
    ]
  );

  const handleMouseLeave = useCallback(() => {
    if (drawingState.isDrawing) {
      cancelDrawing();
    }
    hoverRoom(null);
  }, [drawingState.isDrawing, cancelDrawing, hoverRoom]);

  // Attach event listeners
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [handleMouseDown, handleMouseMove, handleMouseUp, handleMouseLeave]);

  return {
    isDrawing: drawingState.isDrawing,
    currentRect: drawingState.currentRect,
    selectedRoom: rooms.find((r) => r.id === drawingState.selectedRoomId),
    hoveredRoom: rooms.find((r) => r.id === drawingState.hoveredRoomId),
  };
};