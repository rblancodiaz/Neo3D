import React from 'react';
import { Bed, Trash2, Edit2 } from 'lucide-react';
import { useHotelStore } from '../stores/hotelStore';
import { useMapperStore } from '../stores/mapperStore';
import { RoomStatus, RoomType } from '../types/hotel';
import { clsx } from 'clsx';

export const RoomList: React.FC = () => {
  const { rooms, currentFloor, deleteRoom, isLoadingRooms } = useHotelStore();
  const { selectRoom, drawingState } = useMapperStore();

  const getStatusColor = (status: RoomStatus) => {
    switch (status) {
      case RoomStatus.AVAILABLE:
        return 'bg-green-100 text-green-700';
      case RoomStatus.OCCUPIED:
        return 'bg-red-100 text-red-700';
      case RoomStatus.MAINTENANCE:
        return 'bg-yellow-100 text-yellow-700';
      case RoomStatus.RESERVED:
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getTypeIcon = (type: RoomType) => {
    switch (type) {
      case RoomType.SUITE:
      case RoomType.PRESIDENTIAL:
        return '👑';
      case RoomType.DELUXE:
        return '⭐';
      case RoomType.ACCESSIBLE:
        return '♿';
      default:
        return '🛏️';
    }
  };

  if (!currentFloor) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4">
        <p className="text-sm text-gray-500 text-center">
          Select a floor to view rooms
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bed size={20} className="text-gray-600" />
            <h3 className="font-medium text-gray-900">Rooms</h3>
          </div>
          <span className="text-sm text-gray-500">
            {rooms.length} room{rooms.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
      
      <div className="max-h-96 overflow-y-auto">
        {isLoadingRooms ? (
          <div className="p-4 text-center text-gray-500">
            Loading rooms...
          </div>
        ) : rooms.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p className="mb-2">No rooms added yet</p>
            <p className="text-sm">Draw rectangles on the image to add rooms</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {rooms.map((room) => (
              <div
                key={room.id}
                className={clsx(
                  'p-3 hover:bg-gray-50 cursor-pointer transition-colors',
                  drawingState.selectedRoomId === room.id && 'bg-primary-50'
                )}
                onClick={() => selectRoom(room.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg" title={room.type}>
                        {getTypeIcon(room.type)}
                      </span>
                      <span className="font-medium text-gray-900">
                        Room {room.roomNumber}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={clsx(
                          'px-2 py-0.5 text-xs font-medium rounded-full',
                          getStatusColor(room.status)
                        )}
                      >
                        {room.status}
                      </span>
                      <span className="text-xs text-gray-500">
                        {room.type}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Open edit modal
                        window.dispatchEvent(
                          new CustomEvent('editRoom', { detail: room })
                        );
                      }}
                      className="p-1.5 hover:bg-gray-200 rounded transition-colors"
                      title="Edit room"
                    >
                      <Edit2 size={16} className="text-gray-600" />
                    </button>
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (confirm(`Delete room ${room.roomNumber}?`)) {
                          await deleteRoom(room.id);
                        }
                      }}
                      className="p-1.5 hover:bg-red-100 rounded transition-colors"
                      title="Delete room"
                    >
                      <Trash2 size={16} className="text-red-600" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};