import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Hotel, Floor, Room, RoomFormData } from '../types/hotel';
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
  createRoom: (floorId: string, data: RoomFormData) => Promise<Room>;
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
        set({ isLoadingHotels: true, error: null });
        try {
          const response = await hotelApi.getHotels();
          set({ hotels: response.data, isLoadingHotels: false });
        } catch (error: any) {
          set({
            error: error.message || 'Failed to fetch hotels',
            isLoadingHotels: false,
          });
        }
      },

      fetchHotel: async (id) => {
        set({ isLoadingHotels: true, error: null });
        try {
          const response = await hotelApi.getHotel(id);
          set({
            currentHotel: response.data,
            isLoadingHotels: false,
          });
        } catch (error: any) {
          set({
            error: error.message || 'Failed to fetch hotel',
            isLoadingHotels: false,
          });
        }
      },

      createHotel: async (data) => {
        set({ isLoadingHotels: true, error: null });
        try {
          const response = await hotelApi.createHotel(data);
          const newHotel = response.data;
          set((state) => ({
            hotels: [...state.hotels, newHotel],
            currentHotel: newHotel,
            isLoadingHotels: false,
          }));
          return newHotel;
        } catch (error: any) {
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
          const updatedHotel = response.data;
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

      setCurrentHotel: (hotel) => set({ currentHotel: hotel }),

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
          const newFloor = response.data;
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
          const updatedFloor = response.data;
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
          set({ rooms: response.data, isLoadingRooms: false });
        } catch (error: any) {
          set({
            error: error.message || 'Failed to fetch rooms',
            isLoadingRooms: false,
          });
        }
      },

      createRoom: async (floorId, data) => {
        set({ isSavingRoom: true, error: null });
        try {
          const response = await hotelApi.createRoom(floorId, data);
          const newRoom = response.data;
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
          const updatedRoom = response.data;
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
          const updatedRoom = response.data;
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