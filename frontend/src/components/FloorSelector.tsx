import React from 'react';
import { Layers, Plus } from 'lucide-react';
import { useHotelStore } from '../stores/hotelStore';
import { clsx } from 'clsx';

export const FloorSelector: React.FC = () => {
  const { currentHotel, currentFloor, setCurrentFloor, createFloor } = useHotelStore();

  const handleAddFloor = async () => {
    if (!currentHotel) return;
    
    const floorNumber = (currentHotel.floors?.length || 0) + 1;
    const newFloor = await createFloor(currentHotel.id, {
      number: floorNumber,
      name: `Floor ${floorNumber}`,
    });
    
    setCurrentFloor(newFloor);
  };

  if (!currentHotel) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Layers size={20} className="text-gray-600" />
          <h3 className="font-medium text-gray-900">Floors</h3>
        </div>
        <button
          onClick={handleAddFloor}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          title="Add floor"
        >
          <Plus size={18} className="text-gray-600" />
        </button>
      </div>
      
      <div className="space-y-1">
        {currentHotel.floors?.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            No floors added yet
          </p>
        ) : (
          currentHotel.floors?.map((floor) => (
            <button
              key={floor.id}
              onClick={() => setCurrentFloor(floor)}
              className={clsx(
                'w-full text-left px-3 py-2 rounded-lg transition-all duration-200',
                'hover:bg-gray-50',
                currentFloor?.id === floor.id
                  ? 'bg-primary-100 text-primary-700 hover:bg-primary-200'
                  : 'text-gray-700'
              )}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{floor.name}</span>
                <span className="text-sm text-gray-500">
                  {floor.rooms?.length || 0} rooms
                </span>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};