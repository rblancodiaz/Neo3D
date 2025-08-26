import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useCanvasDrawing } from '../hooks/useCanvasDrawing';
import { useMapperStore } from '../stores/mapperStore';
import { useHotelStore } from '../stores/hotelStore';
import { DrawingTool, type Room } from '../types';
import { RoomInfoPopup } from './RoomInfoPopup';
import { denormalizeCoordinates } from '../utils/coordinates';
import { clsx } from 'clsx';
import { hotelApi } from '../services/api';

interface ImageMapperProps {
  imageUrl?: string;
  className?: string;
}

export const ImageMapper: React.FC<ImageMapperProps> = ({ imageUrl, className }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [showPopup, setShowPopup] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const [selectedRoomForPopup, setSelectedRoomForPopup] = useState<Room | null>(null);
  
  const { currentTool, setCanvasRef, viewportState, imageElement, drawingState } = useMapperStore();
  const { currentHotel, deleteRoom, currentFloor } = useHotelStore();
  
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

  // Handle room selection and popup display
  useEffect(() => {
    if (selectedRoom && drawingState.selectedRoomId) {
      // Calculate popup position based on room coordinates
      if (imageElement && canvasRef.current && containerRef.current) {
        const pixelCoords = denormalizeCoordinates(
          selectedRoom.coordinates,
          imageElement.width,
          imageElement.height
        );
        
        // Transform to canvas coordinates
        const canvasX = pixelCoords.x * viewportState.scale + viewportState.offsetX;
        const canvasY = pixelCoords.y * viewportState.scale + viewportState.offsetY;
        const canvasWidth = pixelCoords.width * viewportState.scale;
        const canvasHeight = pixelCoords.height * viewportState.scale;
        
        // Get container position
        const containerRect = containerRef.current.getBoundingClientRect();
        
        // Position popup to the right of the room, centered vertically
        const popupX = containerRect.left + canvasX + canvasWidth + 20;
        const popupY = containerRect.top + canvasY + canvasHeight / 2;
        
        setPopupPosition({ x: popupX, y: popupY });
        setSelectedRoomForPopup(selectedRoom);
        setShowPopup(true);
      }
    } else {
      setShowPopup(false);
      setSelectedRoomForPopup(null);
    }
  }, [selectedRoom, drawingState.selectedRoomId, imageElement, viewportState]);

  // Get cursor style based on current tool and hover state
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
      case DrawingTool.SELECT:
        return drawingState.hoveredRoomId ? 'pointer' : 'default';
      default:
        return drawingState.hoveredRoomId ? 'pointer' : 'default';
    }
  };

  // Handle room edit
  const handleEditRoom = useCallback((room: Room) => {
    // Dispatch event to open edit form
    window.dispatchEvent(new CustomEvent('editRoom', { detail: room }));
    // Close the popup
    setShowPopup(false);
  }, []);

  // Handle room deletion
  const handleDeleteRoom = useCallback(async (roomId: string) => {
    try {
      if (!currentFloor) return;
      
      // Delete from backend
      await hotelApi.deleteRoom(roomId);
      
      // Delete from local store
      deleteRoom(roomId);
      
      // Close popup
      setShowPopup(false);
      
      // Reset selection
      useMapperStore.getState().selectRoom(null);
    } catch (error) {
      console.error('Failed to delete room:', error);
      alert('Failed to delete room. Please try again.');
    }
  }, [currentFloor, deleteRoom]);

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
      
      {/* Room Info Popup */}
      {showPopup && selectedRoomForPopup && (
        <RoomInfoPopup
          room={selectedRoomForPopup}
          position={popupPosition}
          onClose={() => {
            setShowPopup(false);
            useMapperStore.getState().selectRoom(null);
          }}
          onEdit={handleEditRoom}
          onDelete={handleDeleteRoom}
        />
      )}
    </div>
  );
};