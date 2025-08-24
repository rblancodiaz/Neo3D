import React, { useRef, useEffect, useState } from 'react';
import { useCanvasDrawing } from '../hooks/useCanvasDrawing';
import { useMapperStore } from '../stores/mapperStore';
import { useHotelStore } from '../stores/hotelStore';
import { DrawingTool } from '../types';
import { clsx } from 'clsx';

interface ImageMapperProps {
  imageUrl?: string;
  className?: string;
}

export const ImageMapper: React.FC<ImageMapperProps> = ({ imageUrl, className }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  
  const { currentTool, setCanvasRef } = useMapperStore();
  const { currentHotel } = useHotelStore();
  
  const { isDrawing, currentRect, selectedRoom, hoveredRoom } = useCanvasDrawing({
    canvasRef,
    imageUrl: imageUrl || currentHotel?.processedImageUrl || currentHotel?.originalImageUrl || currentHotel?.imageUrl,
  });

  // Update canvas size on container resize
  useEffect(() => {
    const updateCanvasSize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setCanvasSize({ width, height });
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    
    const resizeObserver = new ResizeObserver(updateCanvasSize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    return () => {
      window.removeEventListener('resize', updateCanvasSize);
      resizeObserver.disconnect();
    };
  }, []);

  // Set canvas ref in store
  useEffect(() => {
    setCanvasRef(canvasRef.current);
    return () => setCanvasRef(null);
  }, [setCanvasRef]);

  // Get cursor style based on current tool
  const getCursorStyle = () => {
    switch (currentTool) {
      case DrawingTool.RECTANGLE:
        return 'crosshair';
      case DrawingTool.PAN:
        return 'move';
      case DrawingTool.ZOOM_IN:
        return 'zoom-in';
      case DrawingTool.ZOOM_OUT:
        return 'zoom-out';
      default:
        return hoveredRoom ? 'pointer' : 'default';
    }
  };

  return (
    <div
      ref={containerRef}
      className={clsx(
        'relative w-full h-full bg-gray-100 overflow-hidden',
        className
      )}
    >
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        className="absolute inset-0"
        style={{ cursor: getCursorStyle() }}
      />
      
      {/* Status overlay */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-md">
        <div className="flex items-center gap-4 text-sm">
          <span className="text-gray-600">
            Tool: <span className="font-medium text-gray-900">{currentTool}</span>
          </span>
          {isDrawing && (
            <span className="text-green-600 font-medium">Drawing...</span>
          )}
          {selectedRoom && (
            <span className="text-blue-600">
              Selected: <span className="font-medium">{selectedRoom.roomNumber}</span>
            </span>
          )}
          {hoveredRoom && !selectedRoom && (
            <span className="text-gray-600">
              Hover: <span className="font-medium">{hoveredRoom.roomNumber}</span>
            </span>
          )}
        </div>
      </div>
      
      {/* Coordinates display for current drawing */}
      {currentRect && (
        <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-md">
          <div className="text-sm text-gray-600">
            <span>
              {Math.round(currentRect.width)} × {Math.round(currentRect.height)}px
            </span>
          </div>
        </div>
      )}
    </div>
  );
};