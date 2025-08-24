import React, { useEffect, useState } from 'react';
import { ImageMapper } from './components/ImageMapper';
import { DrawingTools } from './components/DrawingTools';
import { ImageUploader } from './components/ImageUploader';
import { FloorSelector } from './components/FloorSelector';
import { RoomList } from './components/RoomList';
import { RoomForm } from './components/RoomForm';
import { ToastContainer } from './components/Toast';
import { useHotelStore } from './stores/hotelStore';
import { useUIStore } from './stores/uiStore';
import { Hotel as HotelIcon, Menu } from 'lucide-react';
import { clsx } from 'clsx';

function App() {
  const [showRoomForm, setShowRoomForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [pendingCoordinates, setPendingCoordinates] = useState(null);
  
  const {
    currentHotel,
    currentFloor,
    fetchHotels,
    createHotel,
    setCurrentHotel,
  } = useHotelStore();
  
  const {
    isSidebarOpen,
    toggleSidebar,
    showToast,
  } = useUIStore();
  
  // Debug log for currentHotel
  useEffect(() => {
    console.log('currentHotel changed:', currentHotel);
    if (currentHotel) {
      console.log('Hotel URLs:', {
        processedImageUrl: currentHotel.processedImageUrl,
        originalImageUrl: currentHotel.originalImageUrl,
        thumbnailUrl: currentHotel.thumbnailUrl,
      });
    }
  }, [currentHotel]);

  // Load hotels on mount
  useEffect(() => {
    fetchHotels();
  }, [fetchHotels]);

  // Handle room creation from canvas
  useEffect(() => {
    const handleCreateRoom = (e: CustomEvent) => {
      setPendingCoordinates(e.detail.coordinates);
      setShowRoomForm(true);
    };

    const handleEditRoom = (e: CustomEvent) => {
      setEditingRoom(e.detail);
      setShowRoomForm(true);
    };

    window.addEventListener('createRoom', handleCreateRoom as EventListener);
    window.addEventListener('editRoom', handleEditRoom as EventListener);

    return () => {
      window.removeEventListener('createRoom', handleCreateRoom as EventListener);
      window.removeEventListener('editRoom', handleEditRoom as EventListener);
    };
  }, []);

  const handleImageUpload = async (file: File, preview: string) => {
    try {
      const formData = new FormData();
      formData.append('name', `Hotel ${Date.now()}`);
      formData.append('image', file);
      
      console.log('Creating hotel with image upload...');
      const hotel = await createHotel(formData);
      console.log('Hotel created:', hotel);
      
      // The createHotel function already sets currentHotel and currentFloor
      // so we don't need to call setCurrentHotel again
      
      showToast({
        type: 'success',
        message: 'Hotel created successfully!',
      });
    } catch (error) {
      console.error('Error creating hotel:', error);
      showToast({
        type: 'error',
        message: 'Failed to create hotel',
      });
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed lg:relative inset-y-0 left-0 z-40 w-80 bg-white shadow-lg',
          'transform transition-transform duration-300 ease-in-out',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HotelIcon size={24} className="text-primary-600" />
                <h1 className="text-xl font-bold text-gray-900">Room Mapper</h1>
              </div>
              <button
                onClick={toggleSidebar}
                className="lg:hidden p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Menu size={20} className="text-gray-600" />
              </button>
            </div>
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {!currentHotel ? (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Upload Hotel Image
                </h2>
                <ImageUploader
                  onImageSelect={handleImageUpload}
                  onError={(error) => showToast({ type: 'error', message: error })}
                />
              </div>
            ) : (
              <>
                <div className="bg-gray-100 rounded-lg p-3">
                  <h3 className="font-medium text-gray-700 text-sm mb-1">Current Hotel</h3>
                  <p className="font-semibold text-gray-900">{currentHotel.name}</p>
                </div>
                
                <FloorSelector />
                
                {currentFloor && <RoomList />}
              </>
            )}
          </div>
        </div>
      </aside>
      
      {/* Sidebar overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={toggleSidebar}
        />
      )}
      
      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <button
              onClick={toggleSidebar}
              className="lg:hidden p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Menu size={20} className="text-gray-600" />
            </button>
            
            {currentHotel && currentFloor && (
              <div className="flex-1 flex justify-center">
                <DrawingTools />
              </div>
            )}
          </div>
        </div>
        
        {/* Canvas area */}
        <div className="flex-1 p-4">
          {currentHotel && currentHotel.processedImageUrl ? (
            <ImageMapper 
              imageUrl={currentHotel.processedImageUrl}
              className="w-full h-full rounded-lg shadow-lg" 
            />
          ) : (
            <div className="w-full h-full bg-white rounded-lg shadow-lg flex items-center justify-center">
              <div className="text-center">
                <HotelIcon size={48} className="text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Upload a hotel image to get started</p>
              </div>
            </div>
          )}
        </div>
      </main>
      
      {/* Room form modal */}
      {showRoomForm && (
        <RoomForm
          room={editingRoom}
          coordinates={pendingCoordinates}
          onClose={() => {
            setShowRoomForm(false);
            setEditingRoom(null);
            setPendingCoordinates(null);
          }}
          onSubmit={() => {
            showToast({
              type: 'success',
              message: editingRoom ? 'Room updated!' : 'Room created!',
            });
          }}
        />
      )}
      
      {/* Toast container */}
      <ToastContainer />
    </div>
  );
}

export default App
