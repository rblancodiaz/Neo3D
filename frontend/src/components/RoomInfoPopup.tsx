import React, { useEffect, useRef } from 'react';
import type { Room, RoomType } from '../types';
import { 
  X, 
  Edit3, 
  Trash2, 
  Users, 
  Bed, 
  DollarSign, 
  Star,
  Wifi,
  Coffee,
  Car,
  Tv,
  Wind,
  ShowerHead
} from 'lucide-react';
import clsx from 'clsx';

interface RoomInfoPopupProps {
  room: Room;
  position: { x: number; y: number };
  onClose: () => void;
  onEdit: (room: Room) => void;
  onDelete: (roomId: string) => void;
}

const getRoomTypeDisplay = (type: string): { label: string; description: string; icon: string } => {
  switch (type) {
    case 'standard':
      return {
        label: 'Standard Room',
        description: 'Comfortable accommodation with essential amenities',
        icon: '🏠'
      };
    case 'deluxe':
      return {
        label: 'Deluxe Room',
        description: 'Spacious room with premium features and city view',
        icon: '🏨'
      };
    case 'suite':
      return {
        label: 'Suite',
        description: 'Luxury suite with separate living area',
        icon: '✨'
      };
    case 'presidential':
      return {
        label: 'Presidential Suite',
        description: 'Ultimate luxury with panoramic views and exclusive services',
        icon: '👑'
      };
    case 'accessible':
      return {
        label: 'Accessible Room',
        description: 'Specially designed for guests with mobility needs',
        icon: '♿'
      };
    default:
      return {
        label: 'Standard Room',
        description: 'Comfortable accommodation',
        icon: '🏠'
      };
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'available': return 'text-emerald-700 bg-emerald-100 border-emerald-200';
    case 'occupied': return 'text-red-700 bg-red-100 border-red-200';
    case 'maintenance': return 'text-amber-700 bg-amber-100 border-amber-200';
    case 'reserved': return 'text-blue-700 bg-blue-100 border-blue-200';
    default: return 'text-gray-700 bg-gray-100 border-gray-200';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'available': return 'Available';
    case 'occupied': return 'Occupied';
    case 'maintenance': return 'Under Maintenance';
    case 'reserved': return 'Reserved';
    default: return 'Unknown';
  }
};

const getBedConfiguration = (beds: number): string => {
  switch (beds) {
    case 1: return '1 Queen Bed';
    case 2: return '2 Single Beds';
    case 3: return '1 King Bed + 1 Sofa Bed';
    case 4: return '2 Queen Beds';
    default: return `${beds} Beds`;
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

  const roomTypeInfo = getRoomTypeDisplay(room.type);

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      <div
        ref={popupRef}
        className="absolute pointer-events-auto bg-white rounded-xl shadow-2xl border border-gray-200 w-96 max-w-[95vw] overflow-hidden"
        style={{
          left: popupPosition.left,
          top: popupPosition.top,
        }}
      >
        {/* Header with gradient background */}
        <div className="relative bg-gradient-to-r from-blue-500 to-purple-600 text-white p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-2xl">
                {roomTypeInfo.icon}
              </div>
              <div>
                <h3 className="text-xl font-bold">
                  Room {room.roomNumber}
                </h3>
                <p className="text-blue-100 text-sm font-medium">
                  {roomTypeInfo.label}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-all duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Status badge */}
          <div className="mt-3 flex justify-start">
            <span className={clsx(
              'px-3 py-1.5 text-xs font-semibold rounded-full border backdrop-blur-sm',
              getStatusColor(room.status)
            )}>
              {getStatusText(room.status)}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Room type description */}
          <div className="mb-6">
            <p className="text-gray-600 text-sm leading-relaxed">
              {roomTypeInfo.description}
            </p>
          </div>

          {/* Room details grid */}
          <div className="space-y-4">
            {/* Capacity */}
            {room.metadata?.capacity && (
              <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Capacity</p>
                  <p className="text-sm text-gray-600">
                    Up to {room.metadata.capacity} {room.metadata.capacity === 1 ? 'guest' : 'guests'}
                  </p>
                </div>
              </div>
            )}

            {/* Bed configuration */}
            {room.metadata?.beds && (
              <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <Bed className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Sleeping Arrangement</p>
                  <p className="text-sm text-gray-600">
                    {getBedConfiguration(room.metadata.beds)}
                  </p>
                </div>
              </div>
            )}

            {/* Price */}
            {room.metadata?.price && (
              <div className="flex items-center gap-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-100">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Rate</p>
                  <p className="text-lg font-bold text-green-700">
                    ${room.metadata.price}
                    <span className="text-sm font-normal text-gray-600 ml-1">per night</span>
                  </p>
                </div>
              </div>
            )}

            {/* Sample amenities (you can extend this based on actual amenities data) */}
            {room.metadata?.amenities && room.metadata.amenities.length > 0 && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-500" />
                  Amenities
                </p>
                <div className="flex flex-wrap gap-2">
                  {room.metadata.amenities.slice(0, 6).map((amenity, index) => (
                    <span 
                      key={index}
                      className="px-2 py-1 bg-white text-xs text-gray-600 rounded-full border"
                    >
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {room.metadata?.notes && (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                <p className="font-medium text-gray-900 mb-2">Additional Information</p>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {room.metadata.notes}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-5 bg-gray-50 border-t border-gray-100">
          <button
            onClick={() => onEdit(room)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 font-medium"
          >
            <Edit3 className="w-4 h-4" />
            Edit Details
          </button>
          <button
            onClick={() => onDelete(room.id)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all duration-200 font-medium"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};