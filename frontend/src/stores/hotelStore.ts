import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Hotel, Floor, Room, RoomFormData, NormalizedCoordinates } from '../types';
import { hotelApi } from '../services/api';

interface HotelStore {
  // Data
  hotels: Hotel[];
  currentHotel: Hotel | null;
  currentFloor: Floor | null;
  rooms: Room[];
  
  // Loading states
  isLoadingHotels: boolean;
  isLoadingRooms: boolean;
  isSavingRoom: boolean;
  
  // Error states
  error: string | null;
  
  // Actions - Hotels
  fetchHotels: () => Promise<void>;
  fetchHotel: (id: string) => Promise<void>;
  createHotel: (data: FormData) => Promise<Hotel>;
  updateHotel: (id: string, data: Partial<Hotel>) => Promise<void>;
  deleteHotel: (id: string) => Promise<void>;
  setCurrentHotel: (hotel: Hotel | null) => void;
  
  // Actions - Floors
  setCurrentFloor: (floor: Floor | null) => void;
  createFloor: (hotelId: string, data: Partial<Floor>) => Promise<Floor>;
  updateFloor: (id: string, data: Partial<Floor>) => Promise<void>;
  deleteFloor: (id: string) => Promise<void>;
  
  // Actions - Rooms
  fetchRooms: (floorId: string) => Promise<void>;
  createRoom: (floorId: string, data: RoomFormData, coordinates: NormalizedCoordinates) => Promise<Room>;
  updateRoom: (id: string, data: Partial<Room>) => Promise<void>;
  deleteRoom: (id: string) => Promise<void>;
  updateRoomCoordinates: (id: string, coordinates: any) => Promise<void>;
  
  // Utility
  clearError: () => void;
  reset: () => void;
}

export const useHotelStore = create<HotelStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      hotels: [],
      currentHotel: null,
      currentFloor: null,
      rooms: [],
      isLoadingHotels: false,
      isLoadingRooms: false,
      isSavingRoom: false,
      error: null,

      // Hotel actions
      fetchHotels: async () => {
        console.log('🔥 FETCHHOTELS: Starting hotels fetch...');
        set({ isLoadingHotels: true, error: null });
        try {
          const response = await hotelApi.getHotels();
          console.log('🔥 FETCHHOTELS: Response received:', {
            status: response.status,
            dataType: typeof response.data,
            hasData: !!response.data,
            dataKeys: response.data ? Object.keys(response.data) : 'no data',
          });
          
          // The API returns { success: true, data: Hotel[], meta: {...} }
          const hotels = (response.data as any).data || [];
          console.log('🔥 FETCHHOTELS: Hotels extracted:', {
            hotelsCount: hotels.length,
            hotelsArray: Array.isArray(hotels),
            firstHotelId: hotels[0]?.id || 'no hotels',
          });
          
          set({ hotels, isLoadingHotels: false });
          console.log('🔥 FETCHHOTELS: Hotels state updated successfully');
        } catch (error: any) {
          console.error('🔥 FETCHHOTELS: Error fetching hotels:', error);
          set({
            error: error.message || 'Failed to fetch hotels',
            isLoadingHotels: false,
          });
        }
      },

      fetchHotel: async (id) => {
        console.log('🔥 FETCHHOTEL: Starting fetch for hotel ID:', id);
        set({ isLoadingHotels: true, error: null });
        try {
          const response = await hotelApi.getHotel(id);
          console.log('🔥 FETCHHOTEL: Response received:', {
            status: response.status,
            dataStructure: {
              hasData: !!response.data,
              dataType: typeof response.data,
              dataKeys: response.data ? Object.keys(response.data) : 'no data',
              hasNestedData: !!response.data?.data,
              nestedDataType: typeof response.data?.data,
              nestedDataKeys: response.data?.data ? Object.keys(response.data.data) : 'no nested data',
            },
          });
          
          // The API returns { success: true, data: Hotel }
          const hotel = (response.data as any).data;
          
          console.log('🔥 FETCHHOTEL: Hotel extracted:', {
            hotelFound: !!hotel,
            hotelId: hotel?.id || 'not found',
            hotelName: hotel?.name || 'not found',
            hotelType: typeof hotel,
          });
          
          if (!hotel) {
            console.error('🔥 FETCHHOTEL: No hotel data found in response');
            throw new Error('No hotel data received');
          }
          
          set({
            currentHotel: hotel,
            isLoadingHotels: false,
          });
          
          console.log('🔥 FETCHHOTEL: Hotel set as currentHotel successfully');
        } catch (error: any) {
          console.error('🔥 FETCHHOTEL: Error fetching hotel:', error);
          set({
            error: error.message || 'Failed to fetch hotel',
            isLoadingHotels: false,
          });
        }
      },

      createHotel: async (data) => {
        console.log('🔥 CREATEHOTEL: Starting hotel creation process');
        set({ isLoadingHotels: true, error: null });
        try {
          console.log('🔥 CREATEHOTEL: Sending hotel creation request with FormData...');
          const response = await hotelApi.createHotel(data);
          console.log('🔥 CREATEHOTEL: Raw API response:', response);
          console.log('🔥 CREATEHOTEL: Response status:', response.status);
          console.log('🔥 CREATEHOTEL: Response data:', response.data);
          console.log('🔥 CREATEHOTEL: Response data type:', typeof response.data);
          
          // Check if we have a successful response
          if (!response.data) {
            console.error('🔥 CREATEHOTEL: No response.data received');
            throw new Error('No response data received from server');
          }
          
          // Detailed analysis of response structure
          console.log('🔥 CREATEHOTEL: Response data structure analysis:');
          console.log('  - response.data.success:', response.data.success);
          console.log('  - response.data.data:', response.data.data);
          console.log('  - response.data.error:', response.data.error);
          console.log('  - response.data.message:', response.data.message);
          
          // Parse hotel from response with robust fallback logic
          let newHotel = null;
          
          // Try multiple parsing strategies
          if (response.data?.data?.hotel && typeof response.data.data.hotel === 'object' && (response.data.data.hotel as any).id) {
            // Structure: { success: true, data: { hotel: Hotel } }
            newHotel = response.data.data.hotel as Hotel;
            console.log('🔥 CREATEHOTEL: Parsed using strategy 1 (data.hotel)');
          } else if (response.data?.data && typeof response.data.data === 'object' && (response.data.data as any).id) {
            // Structure: { success: true, data: Hotel }
            newHotel = response.data.data as Hotel;
            console.log('🔥 CREATEHOTEL: Parsed using strategy 2 (data)');
          } else if (response.data && (response.data as any).id && !(response.data as any).success && !(response.data as any).data) {
            // Structure: Hotel (direct object)
            newHotel = response.data as unknown as Hotel;
            console.log('🔥 CREATEHOTEL: Parsed using strategy 3 (direct)');
          }
          
          if (!newHotel || !newHotel.id) {
            console.error('🔥 CREATEHOTEL: Failed to parse hotel from all strategies');
            console.log('🔥 CREATEHOTEL: Full response.data:', JSON.stringify(response.data, null, 2));
            console.log('🔥 CREATEHOTEL: Response.data type:', typeof response.data);
            console.log('🔥 CREATEHOTEL: Response.data keys:', response.data ? Object.keys(response.data) : 'no keys');
            throw new Error('Invalid response structure from API: no hotel data found');
          }
          
          console.log('🔥 CREATEHOTEL: Successfully parsed hotel data:');
          console.log('  - Hotel ID:', newHotel.id);
          console.log('  - Hotel name:', newHotel.name);
          console.log('  - Hotel type:', typeof newHotel);
          console.log('  - Hotel keys:', Object.keys(newHotel));
          console.log('🔥 CREATEHOTEL: Hotel image URLs:', {
            processedImageUrl: newHotel.processedImageUrl,
            originalImageUrl: newHotel.originalImageUrl,
            thumbnailUrl: newHotel.thumbnailUrl,
          });
          
          // Initialize hotel with empty floors array if not present
          if (!newHotel.floors) {
            console.log('🔥 CREATEHOTEL: Initializing empty floors array');
            newHotel.floors = [];
          } else {
            console.log('🔥 CREATEHOTEL: Hotel already has floors:', newHotel.floors.length);
          }
          
          // Create a default floor for the new hotel
          try {
            console.log('🔥 CREATEHOTEL: Creating default floor for hotel ID:', newHotel.id);
            const floorResponse = await hotelApi.createFloor(newHotel.id, {
              floorNumber: 1,
              name: 'Ground Floor',
            });
            console.log('🔥 CREATEHOTEL: Floor API response:', floorResponse);
            console.log('🔥 CREATEHOTEL: Floor response data:', floorResponse.data);
            
            // Parse floor from response with robust fallback logic
            let newFloor = null;
            
            // Try multiple parsing strategies for floor
            if (floorResponse.data?.data?.floor && typeof floorResponse.data.data.floor === 'object' && (floorResponse.data.data.floor as any).id) {
              // Structure: { success: true, data: { floor: Floor } }
              newFloor = floorResponse.data.data.floor as Floor;
              console.log('🔥 CREATEHOTEL: Floor parsed using strategy 1 (data.floor)');
            } else if (floorResponse.data?.data && typeof floorResponse.data.data === 'object' && (floorResponse.data.data as any).id) {
              // Structure: { success: true, data: Floor }
              newFloor = floorResponse.data.data as Floor;
              console.log('🔥 CREATEHOTEL: Floor parsed using strategy 2 (data)');
            } else if (floorResponse.data && (floorResponse.data as any).id && !(floorResponse.data as any).success && !(floorResponse.data as any).data) {
              // Structure: Floor (direct object)
              newFloor = floorResponse.data as unknown as Floor;
              console.log('🔥 CREATEHOTEL: Floor parsed using strategy 3 (direct)');
            }
            
            if (!newFloor || !newFloor.id) {
              console.error('🔥 CREATEHOTEL: Failed to parse floor from all strategies');
              console.log('🔥 CREATEHOTEL: Full floorResponse.data:', JSON.stringify(floorResponse.data, null, 2));
              throw new Error('Invalid floor response structure from API');
            }
            
            console.log('🔥 CREATEHOTEL: Successfully created floor:', newFloor);
            newHotel.floors.push(newFloor);
            
            console.log('🔥 CREATEHOTEL: About to update store state...');
            console.log('  - Setting currentHotel to:', newHotel.id);
            console.log('  - Setting currentFloor to:', newFloor.id);
            
            // CRITICAL: Set the new hotel and floor as current
            console.log('🔥 CREATEHOTEL: About to create new state object...');
            const currentState = get();
            console.log('🔥 CREATEHOTEL: Current state before update:', {
              currentHotelsCount: currentState.hotels.length,
              currentHotelId: currentState.currentHotel?.id || 'null',
              currentFloorId: currentState.currentFloor?.id || 'null',
            });
            
            const newState = {
              hotels: [...currentState.hotels, newHotel],
              currentHotel: newHotel,
              currentFloor: newFloor,
              isLoadingHotels: false,
            };
            
            console.log('🔥 CREATEHOTEL: New state to set:', {
              hotelsCount: newState.hotels.length,
              currentHotelId: newState.currentHotel?.id,
              currentHotelName: newState.currentHotel?.name,
              currentFloorId: newState.currentFloor?.id,
              currentFloorName: newState.currentFloor?.name,
              newHotelObjectType: typeof newState.currentHotel,
              newHotelHasRequiredProps: {
                hasId: !!newState.currentHotel?.id,
                hasName: !!newState.currentHotel?.name,
                hasProcessedImageUrl: !!newState.currentHotel?.processedImageUrl,
                hasFloors: !!newState.currentHotel?.floors,
              },
            });
            
            console.log('🔥 CREATEHOTEL: Calling set() with new state...');
            set(newState);
            console.log('🔥 CREATEHOTEL: set() call completed');
            
            // Use setTimeout to verify state after React's batch updates
            setTimeout(() => {
              console.log('🔥 CREATEHOTEL: Verifying state update with get() after timeout...');
              const updatedState = get();
              console.log('🔥 CREATEHOTEL: State verification after timeout:', {
                currentHotelId: updatedState.currentHotel?.id || 'null',
                currentHotelName: updatedState.currentHotel?.name || 'null',
                currentFloorId: updatedState.currentFloor?.id || 'null',
                hotelsCount: updatedState.hotels.length,
                stateUpdateSuccessful: !!updatedState.currentHotel,
                hotelObjectIntegrity: {
                  hasId: !!updatedState.currentHotel?.id,
                  hasName: !!updatedState.currentHotel?.name,
                  hasProcessedImageUrl: !!updatedState.currentHotel?.processedImageUrl,
                },
              });
              
              if (updatedState.currentHotel?.id === newHotel.id) {
                console.log('✅ CREATEHOTEL: State update SUCCESSFUL - currentHotel matches expected!');
              } else {
                console.error('❌ CREATEHOTEL: State update FAILED - currentHotel mismatch!');
                console.error('Expected hotel ID:', newHotel.id);
                console.error('Actual hotel ID:', updatedState.currentHotel?.id || 'null');
              }
            }, 50);
            
            // Immediate verification too
            const immediateState = get();
            console.log('🔥 CREATEHOTEL: Immediate state verification:', {
              currentHotelId: immediateState.currentHotel?.id || 'null',
              stateUpdateSuccessful: !!immediateState.currentHotel,
            });
            
            console.log('🔥 CREATEHOTEL: Hotel and floor created successfully!');
          } catch (floorError) {
            // If floor creation fails, still set the hotel
            console.error('🔥 CREATEHOTEL: Failed to create default floor:', floorError);
            const fallbackState = {
              hotels: [...get().hotels, newHotel],
              currentHotel: newHotel,
              currentFloor: null,
              isLoadingHotels: false,
            };
            
            console.log('🔥 CREATEHOTEL: Setting fallback state (no floor):', {
              currentHotelId: fallbackState.currentHotel?.id,
              currentFloor: fallbackState.currentFloor,
            });
            
            set(fallbackState);
          }
          
          console.log('🔥 CREATEHOTEL: Returning hotel:', newHotel.id);
          return newHotel;
        } catch (error: any) {
          console.error('🔥 CREATEHOTEL: ERROR in createHotel:', error);
          console.error('🔥 CREATEHOTEL: Error message:', error.message);
          console.error('🔥 CREATEHOTEL: Error stack:', error.stack);
          if (error.response) {
            console.error('🔥 CREATEHOTEL: Error response:', error.response);
            console.error('🔥 CREATEHOTEL: Error response data:', error.response.data);
            console.error('🔥 CREATEHOTEL: Error response status:', error.response.status);
          }
          set({
            error: error.message || 'Failed to create hotel',
            isLoadingHotels: false,
          });
          throw error;
        }
      },

      updateHotel: async (id, data) => {
        set({ isLoadingHotels: true, error: null });
        try {
          const response = await hotelApi.updateHotel(id, data);
          // The API returns { success: true, data: { hotel: Hotel } }
          const updatedHotel = (response.data as any).data;
          if (!updatedHotel) {
            throw new Error('No updated hotel data received');
          }
          set((state) => ({
            hotels: state.hotels.map((h) =>
              h.id === id ? updatedHotel : h
            ),
            currentHotel:
              state.currentHotel?.id === id
                ? updatedHotel
                : state.currentHotel,
            isLoadingHotels: false,
          }));
        } catch (error: any) {
          set({
            error: error.message || 'Failed to update hotel',
            isLoadingHotels: false,
          });
          throw error;
        }
      },

      deleteHotel: async (id) => {
        set({ isLoadingHotels: true, error: null });
        try {
          await hotelApi.deleteHotel(id);
          set((state) => ({
            hotels: state.hotels.filter((h) => h.id !== id),
            currentHotel:
              state.currentHotel?.id === id ? null : state.currentHotel,
            isLoadingHotels: false,
          }));
        } catch (error: any) {
          set({
            error: error.message || 'Failed to delete hotel',
            isLoadingHotels: false,
          });
          throw error;
        }
      },

      setCurrentHotel: (hotel) => {
        console.log('💾 STORE UPDATE: setCurrentHotel called with:', {
          hotelId: hotel?.id || 'null',
          hotelName: hotel?.name || 'null',
          hotelType: typeof hotel,
          timestamp: new Date().toISOString(),
          callStack: new Error().stack,
        });
        set({ currentHotel: hotel });
        console.log('💾 STORE UPDATE: setCurrentHotel completed');
      },

      // Floor actions
      setCurrentFloor: (floor) => {
        set({ currentFloor: floor });
        if (floor) {
          get().fetchRooms(floor.id);
        }
      },

      createFloor: async (hotelId, data) => {
        try {
          const response = await hotelApi.createFloor(hotelId, data);
          // The API returns { success: true, data: { floor: Floor } }
          const newFloor = (response.data as any).data;
          if (!newFloor) {
            throw new Error('No floor data received');
          }
          set((state) => {
            if (state.currentHotel?.id === hotelId) {
              return {
                currentHotel: {
                  ...state.currentHotel,
                  floors: [...(state.currentHotel.floors || []), newFloor],
                },
              };
            }
            return state;
          });
          return newFloor;
        } catch (error: any) {
          set({ error: error.message || 'Failed to create floor' });
          throw error;
        }
      },

      updateFloor: async (id, data) => {
        try {
          const response = await hotelApi.updateFloor(id, data);
          // The API returns { success: true, data: { floor: Floor } }
          const updatedFloor = (response.data as any).data;
          if (!updatedFloor) {
            throw new Error('No updated floor data received');
          }
          set((state) => {
            if (state.currentHotel) {
              return {
                currentHotel: {
                  ...state.currentHotel,
                  floors: state.currentHotel.floors.map((f) =>
                    f.id === id ? updatedFloor : f
                  ),
                },
                currentFloor:
                  state.currentFloor?.id === id
                    ? updatedFloor
                    : state.currentFloor,
              };
            }
            return state;
          });
        } catch (error: any) {
          set({ error: error.message || 'Failed to update floor' });
          throw error;
        }
      },

      deleteFloor: async (id) => {
        try {
          await hotelApi.deleteFloor(id);
          set((state) => {
            if (state.currentHotel) {
              return {
                currentHotel: {
                  ...state.currentHotel,
                  floors: state.currentHotel.floors.filter((f) => f.id !== id),
                },
                currentFloor:
                  state.currentFloor?.id === id ? null : state.currentFloor,
                rooms: state.currentFloor?.id === id ? [] : state.rooms,
              };
            }
            return state;
          });
        } catch (error: any) {
          set({ error: error.message || 'Failed to delete floor' });
          throw error;
        }
      },

      // Room actions
      fetchRooms: async (floorId) => {
        set({ isLoadingRooms: true, error: null });
        try {
          const response = await hotelApi.getRooms(floorId);
          // The API returns { success: true, data: { rooms: Room[] } }
          const rawRooms = (response.data as any).data?.rooms || (response.data as any).data || [];
          
          // Transform backend room format to frontend format
          const rooms = rawRooms.map((room: any) => ({
            ...room,
            coordinates: room.coordinates || {
              x: room.xCoordinate || room.x_coordinate || 0,
              y: room.yCoordinate || room.y_coordinate || 0,
              width: room.width || 0,
              height: room.height || 0
            }
          }));
          
          console.log('🔥 HOTELSTORE: Fetched and transformed rooms:', { 
            count: rooms.length,
            firstRoom: rooms[0],
            hasCoordinates: rooms.length > 0 ? !!rooms[0].coordinates : false
          });
          
          set({ rooms, isLoadingRooms: false });
        } catch (error: any) {
          set({
            error: error.message || 'Failed to fetch rooms',
            isLoadingRooms: false,
          });
        }
      },

      createRoom: async (floorId, data, coordinates) => {
        set({ isSavingRoom: true, error: null });
        try {
          console.log('🔥 HOTELSTORE: Creating room with coordinates:', { 
            floorId, 
            data, 
            coordinates,
            hasCoordinates: !!coordinates 
          });
          
          const roomData = { ...data, coordinates };
          const response = await hotelApi.createRoom(floorId, roomData);
          // The API returns { success: true, data: { room: Room } }
          const rawRoom = (response.data as any).data.room || (response.data as any).data;
          
          // Transform backend room format to frontend format
          const newRoom = {
            ...rawRoom,
            coordinates: rawRoom.coordinates || {
              x: rawRoom.xCoordinate || rawRoom.x_coordinate || 0,
              y: rawRoom.yCoordinate || rawRoom.y_coordinate || 0,
              width: rawRoom.width || 0,
              height: rawRoom.height || 0
            }
          };
          
          console.log('🔥 HOTELSTORE: Room created, response:', { 
            hasRoom: !!newRoom, 
            roomId: newRoom?.id,
            roomCoordinates: newRoom?.coordinates,
            hasCoordinates: !!newRoom?.coordinates
          });
          
          if (!newRoom) {
            throw new Error('No room data received');
          }
          
          if (!newRoom.coordinates) {
            console.warn('⚠️ HOTELSTORE: Room saved without coordinates!');
          }
          
          set((state) => ({
            rooms: [...state.rooms, newRoom],
            isSavingRoom: false,
          }));
          return newRoom;
        } catch (error: any) {
          set({
            error: error.message || 'Failed to create room',
            isSavingRoom: false,
          });
          throw error;
        }
      },

      updateRoom: async (id, data) => {
        set({ isSavingRoom: true, error: null });
        try {
          const response = await hotelApi.updateRoom(id, data);
          // The API returns { success: true, data: { room: Room } }
          const rawRoom = (response.data as any).data?.room || (response.data as any).data;
          if (!rawRoom) {
            throw new Error('No updated room data received');
          }
          
          // Transform backend room format to frontend format
          const updatedRoom = {
            ...rawRoom,
            coordinates: rawRoom.coordinates || {
              x: rawRoom.xCoordinate || rawRoom.x_coordinate || 0,
              y: rawRoom.yCoordinate || rawRoom.y_coordinate || 0,
              width: rawRoom.width || 0,
              height: rawRoom.height || 0
            }
          };
          
          set((state) => ({
            rooms: state.rooms.map((r) =>
              r.id === id ? updatedRoom : r
            ),
            isSavingRoom: false,
          }));
        } catch (error: any) {
          set({
            error: error.message || 'Failed to update room',
            isSavingRoom: false,
          });
          throw error;
        }
      },

      deleteRoom: async (id) => {
        set({ isSavingRoom: true, error: null });
        try {
          await hotelApi.deleteRoom(id);
          set((state) => ({
            rooms: state.rooms.filter((r) => r.id !== id),
            isSavingRoom: false,
          }));
        } catch (error: any) {
          set({
            error: error.message || 'Failed to delete room',
            isSavingRoom: false,
          });
          throw error;
        }
      },

      updateRoomCoordinates: async (id, coordinates) => {
        set({ isSavingRoom: true, error: null });
        try {
          const response = await hotelApi.updateRoomCoordinates(id, coordinates);
          // The API returns { success: true, data: { room: Room } }
          const updatedRoom = (response.data as any).data;
          if (!updatedRoom) {
            throw new Error('No updated room data received');
          }
          set((state) => ({
            rooms: state.rooms.map((r) =>
              r.id === id ? updatedRoom : r
            ),
            isSavingRoom: false,
          }));
        } catch (error: any) {
          set({
            error: error.message || 'Failed to update room coordinates',
            isSavingRoom: false,
          });
          throw error;
        }
      },

      // Utility
      clearError: () => set({ error: null }),
      
      reset: () =>
        set({
          hotels: [],
          currentHotel: null,
          currentFloor: null,
          rooms: [],
          isLoadingHotels: false,
          isLoadingRooms: false,
          isSavingRoom: false,
          error: null,
        }),
    }),
    {
      name: 'hotel-store',
    },
  ),
);