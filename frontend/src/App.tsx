import { useEffect, useState } from 'react';
import { ImageMapper } from './components/ImageMapper';
import { DrawingTools } from './components/DrawingTools';
import { ImageUploader } from './components/ImageUploader';
import { SimpleImageUploader } from './components/SimpleImageUploader';
import { FloorSelector } from './components/FloorSelector';
import { RoomList } from './components/RoomList';
import { RoomForm } from './components/RoomForm';
import { ToastContainer } from './components/Toast';
import { useHotelStore } from './stores/hotelStore';
import { useUIStore } from './stores/uiStore';
import { Hotel as HotelIcon, Menu } from 'lucide-react';
import { clsx } from 'clsx';
import type { Room } from './types';

function App() {
  const [showRoomForm, setShowRoomForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [pendingCoordinates, setPendingCoordinates] = useState(null);
  
  const {
    currentHotel,
    currentFloor,
    hotels,
    fetchHotels,
    createHotel,
  } = useHotelStore();
  
  const {
    isSidebarOpen,
    toggleSidebar,
    showToast,
  } = useUIStore();
  
  // Debug log for currentHotel
  useEffect(() => {
    console.log('💾 APP STATE: currentHotel changed:', currentHotel);
    if (currentHotel) {
      console.log('💾 APP STATE: Hotel ID:', currentHotel.id);
      console.log('💾 APP STATE: Hotel Name:', currentHotel.name);
      console.log('💾 APP STATE: Processed Image URL:', currentHotel.processedImageUrl);
    } else {
      console.log('💾 APP STATE: currentHotel is null/undefined');
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

  const handleImageUpload = async (file: File) => {
    console.log('🔥 APP UPLOAD: Starting handleImageUpload with file:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      timestamp: new Date().toISOString(),
    });
    
    try {
      const formData = new FormData();
      const hotelName = `Hotel ${Date.now()}`;
      formData.append('name', hotelName);
      formData.append('image', file);
      
      console.log('🔥 APP UPLOAD: FormData created:', {
        hotelName,
        hasImageFile: formData.has('image'),
        hasNameField: formData.has('name'),
      });
      
      // Check current state before API call
      console.log('🔥 APP UPLOAD: Current state BEFORE createHotel call:', {
        currentHotelBefore: currentHotel?.id || 'null',
        currentFloorBefore: currentFloor?.id || 'null',
      });
      
      console.log('🔥 APP UPLOAD: Calling createHotel function...');
      const hotel = await createHotel(formData);
      console.log('🔥 APP UPLOAD: createHotel returned hotel object:', {
        hotelId: hotel?.id,
        hotelName: hotel?.name,
        hotelType: typeof hotel,
        hotelKeys: hotel ? Object.keys(hotel) : 'null',
        processedImageUrl: hotel?.processedImageUrl,
        floorsCount: hotel?.floors?.length || 0,
      });
      
      // Check current state after API call
      console.log('🔥 APP UPLOAD: Current state AFTER createHotel call:', {
        currentHotelAfter: currentHotel?.id || 'null',
        currentFloorAfter: currentFloor?.id || 'null',
      });
      
      // Force a small delay to see if state updates async
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('🔥 APP UPLOAD: Current state AFTER 100ms delay:', {
        currentHotelDelayed: currentHotel?.id || 'null',
        currentFloorDelayed: currentFloor?.id || 'null',
      });
      
      showToast({
        type: 'success',
        message: 'Hotel created successfully!',
      });
      
      console.log('🔥 APP UPLOAD: Upload process completed successfully!');
    } catch (error: any) {
      console.error('🔥 APP UPLOAD: ERROR in handleImageUpload:', error);
      console.error('🔥 APP UPLOAD: Error details:', {
        message: error?.message,
        stack: error?.stack,
        response: error?.response?.data,
        status: error?.response?.status,
      });
      showToast({
        type: 'error',
        message: 'Failed to create hotel',
      });
    }
  };

  // Test direct file upload function
  const testDirectUpload = async (file: File) => {
    console.log('🔥 TEST DIRECT: Testing direct upload with file:', {
      name: file.name,
      type: file.type,
      size: file.size,
    });
    
    try {
      await handleImageUpload(file);
      console.log('🔥 TEST DIRECT: Upload completed successfully!');
    } catch (error) {
      console.error('🔥 TEST DIRECT: Upload failed:', error);
    }
  };

  // Expose debug functions to window for testing
  useEffect(() => {
    (window as any).debugHotelUpload = async () => {
      console.log('🔥 DEBUG: Starting debug hotel upload...');
      
      // Create a fake image file for testing (800x600 to meet backend requirements)
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 600;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Create a gradient background
        const gradient = ctx.createLinearGradient(0, 0, 800, 600);
        gradient.addColorStop(0, '#FF6B6B');
        gradient.addColorStop(1, '#4ECDC4');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 800, 600);
        
        // Add debug text
        ctx.fillStyle = 'white';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('DEBUG TEST', 400, 250);
        ctx.fillText('800x600', 400, 320);
        
        // Add border
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 4;
        ctx.strokeRect(2, 2, 796, 596);
      }
      
      return new Promise((resolve) => {
        canvas.toBlob(async (blob) => {
          if (blob) {
            const file = new File([blob], 'debug-test.png', { type: 'image/png' });
            console.log('🔥 DEBUG: Created test file:', file);
            
            try {
              await handleImageUpload(file);
              resolve('Upload completed');
            } catch (error) {
              console.error('🔥 DEBUG: Upload failed:', error);
              resolve('Upload failed: ' + error);
            }
          }
        }, 'image/png');
      });
    };

    (window as any).debugCurrentState = () => {
      console.log('🔥 DEBUG: Current state:', {
        currentHotel: currentHotel,
        currentFloor: currentFloor,
        hotels: hotels,
        hotelsCount: hotels?.length || 0
      });
    };

    (window as any).testDirectUpload = testDirectUpload;

    console.log('🔥 DEBUG: Debug functions exposed:');
    console.log('  - window.debugHotelUpload(): Create synthetic image and test upload');
    console.log('  - window.debugCurrentState(): Check current app state');
    console.log('  - window.testDirectUpload(file): Test upload with provided file');
  }, [currentHotel, currentFloor, hotels, handleImageUpload, testDirectUpload]);

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
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-700">Simple Test Version:</h3>
                  <SimpleImageUploader
                    onImageSelect={handleImageUpload}
                    onError={(error) => showToast({ type: 'error', message: error })}
                  />
                  
                  <h3 className="text-sm font-medium text-gray-700">Original Complex Version:</h3>
                  <ImageUploader
                    onImageSelect={handleImageUpload}
                    onError={(error) => showToast({ type: 'error', message: error })}
                  />
                </div>
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
          room={editingRoom || undefined}
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
