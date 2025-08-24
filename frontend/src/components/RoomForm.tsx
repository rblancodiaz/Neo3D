import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { RoomType, RoomStatus } from '../types';
import type { RoomFormData, Room } from '../types';
import { useHotelStore } from '../stores/hotelStore';
import { clsx } from 'clsx';

const roomSchema = z.object({
  roomNumber: z.string().min(1, 'Room number is required'),
  type: z.nativeEnum(RoomType),
  status: z.nativeEnum(RoomStatus),
  capacity: z.number().min(1).max(10).optional(),
  beds: z.number().min(1).max(5).optional(),
  price: z.number().min(0).optional(),
  amenities: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

interface RoomFormProps {
  room?: Room;
  coordinates?: any;
  onClose: () => void;
  onSubmit: (data: RoomFormData) => void;
}

export const RoomForm: React.FC<RoomFormProps> = ({
  room,
  coordinates,
  onClose,
  onSubmit,
}) => {
  const { currentFloor, createRoom, updateRoom } = useHotelStore();
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RoomFormData>({
    resolver: zodResolver(roomSchema),
    defaultValues: room || {
      roomNumber: '',
      type: RoomType.STANDARD,
      status: RoomStatus.AVAILABLE,
      capacity: 2,
      beds: 1,
    },
  });

  const handleFormSubmit = async (data: RoomFormData) => {
    try {
      if (room) {
        await updateRoom(room.id, data);
      } else if (currentFloor && coordinates) {
        await createRoom(currentFloor.id, { ...data, coordinates });
      }
      onSubmit(data);
      onClose();
    } catch (error) {
      console.error('Failed to save room:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            {room ? 'Edit Room' : 'Add New Room'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-4 space-y-4">
          {/* Room Number */}
          <div>
            <label htmlFor="roomNumber" className="block text-sm font-medium text-gray-700 mb-1">
              Room Number *
            </label>
            <input
              {...register('roomNumber')}
              type="text"
              id="roomNumber"
              className={clsx(
                'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500',
                errors.roomNumber ? 'border-red-500' : 'border-gray-300'
              )}
              placeholder="e.g., 101, A12"
            />
            {errors.roomNumber && (
              <p className="mt-1 text-sm text-red-600">{errors.roomNumber.message}</p>
            )}
          </div>
          
          {/* Room Type */}
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
              Room Type
            </label>
            <select
              {...register('type')}
              id="type"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value={RoomType.STANDARD}>Standard</option>
              <option value={RoomType.DELUXE}>Deluxe</option>
              <option value={RoomType.SUITE}>Suite</option>
              <option value={RoomType.PRESIDENTIAL}>Presidential</option>
              <option value={RoomType.ACCESSIBLE}>Accessible</option>
            </select>
          </div>
          
          {/* Room Status */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              {...register('status')}
              id="status"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value={RoomStatus.AVAILABLE}>Available</option>
              <option value={RoomStatus.OCCUPIED}>Occupied</option>
              <option value={RoomStatus.MAINTENANCE}>Maintenance</option>
              <option value={RoomStatus.RESERVED}>Reserved</option>
            </select>
          </div>
          
          {/* Capacity and Beds */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="capacity" className="block text-sm font-medium text-gray-700 mb-1">
                Capacity
              </label>
              <input
                {...register('capacity', { valueAsNumber: true })}
                type="number"
                id="capacity"
                min="1"
                max="10"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            
            <div>
              <label htmlFor="beds" className="block text-sm font-medium text-gray-700 mb-1">
                Beds
              </label>
              <input
                {...register('beds', { valueAsNumber: true })}
                type="number"
                id="beds"
                min="1"
                max="5"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          
          {/* Price */}
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
              Price per Night
            </label>
            <input
              {...register('price', { valueAsNumber: true })}
              type="number"
              id="price"
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="0.00"
            />
          </div>
          
          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              {...register('notes')}
              id="notes"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Additional information..."
            />
          </div>
          
          {/* Submit buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={clsx(
                'px-4 py-2 bg-primary-600 text-white rounded-lg transition-colors',
                'hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {isSubmitting ? 'Saving...' : room ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};