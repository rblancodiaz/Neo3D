import React, { useEffect, useRef } from 'react';
import type { Room } from '../types';
import { X, Edit3, Trash2, User, Bed, DollarSign, MapPin } from 'lucide-react';
import clsx from 'clsx';

interface RoomInfoPopupProps {
  room: Room;
  position: { x: number; y: number };
  onClose: () => void;
  onEdit: (room: Room) => void;
  onDelete: (roomId: string) => void;
}

const getRoomTypeIcon = (type: string) => {
  switch (type) {
    case 'single': return '🛏️';
    case 'double': return '🛏️🛏️';
    case 'suite': return '🏨';
    case 'family': return '👨‍👩‍👧‍👦';
    default: return '🏠';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'available': return 'text-green-600 bg-green-50';
    case 'occupied': return 'text-red-600 bg-red-50';
    case 'maintenance': return 'text-yellow-600 bg-yellow-50';
    case 'cleaning': return 'text-blue-600 bg-blue-50';
    default: return 'text-gray-600 bg-gray-50';
  }
};

export const RoomInfoPopup: React.FC<RoomInfoPopupProps> = ({
  room,
  position,
  onClose,
  onEdit,
  onDelete
}) => {
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscKey);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [onClose]);

  // Calculate popup position to keep it within viewport
  const calculatePosition = () => {
    const popup = popupRef.current;
    if (!popup) return { left: position.x, top: position.y };

    const rect = popup.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let left = position.x;
    let top = position.y;

    // Adjust if popup would go off-screen
    if (left + rect.width > viewportWidth - 20) {
      left = viewportWidth - rect.width - 20;
    }
    if (left < 20) {
      left = 20;
    }
    if (top + rect.height > viewportHeight - 20) {
      top = position.y - rect.height - 10;
    }
    if (top < 20) {
      top = 20;
    }

    return { left, top };
  };

  const popupPosition = calculatePosition();

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      <div
        ref={popupRef}
        className="absolute pointer-events-auto bg-white rounded-xl shadow-2xl border border-gray-200 w-80 max-w-[90vw]"
        style={{
          left: popupPosition.left,
          top: popupPosition.top,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{getRoomTypeIcon(room.type)}</span>
            <div>
              <h3 className="font-semibold text-gray-900">
                Room {room.roomNumber}
              </h3>
              <p className="text-sm text-gray-600 capitalize">{room.type}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Status</span>
            <span className={clsx(
              'px-2.5 py-1 text-xs font-medium rounded-full capitalize',
              getStatusColor(room.status)
            )}>
              {room.status}
            </span>
          </div>

          {/* Room Details */}
          <div className="space-y-3">
            {room.metadata?.capacity && (
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">
                  Capacity: {room.metadata.capacity} guests
                </span>
              </div>
            )}
            
            {room.metadata?.beds && (
              <div className="flex items-center gap-3">
                <Bed className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">
                  {room.metadata.beds} beds
                </span>
              </div>
            )}

            {room.metadata?.price && (
              <div className="flex items-center gap-3">
                <DollarSign className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">
                  ${room.metadata.price} per night
                </span>
              </div>
            )}

            {room.coordinates && (
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">
                  Position: ({room.coordinates.x.toFixed(3)}, {room.coordinates.y.toFixed(3)})
                </span>
              </div>
            )}
          </div>

          {/* Description */}
          {room.metadata?.notes && (
            <div>
              <span className="text-sm font-medium text-gray-700 block mb-1">
                Notes
              </span>
              <p className="text-sm text-gray-600">{room.metadata.notes}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 p-4 border-t border-gray-100">
          <button
            onClick={() => onEdit(room)}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <Edit3 className="w-4 h-4" />
            Edit
          </button>
          <button
            onClick={() => onDelete(room.id)}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};