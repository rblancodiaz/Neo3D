import axios, { type AxiosInstance } from 'axios';
import type { Hotel, Floor, Room, RoomFormData, NormalizedCoordinates, ApiResponse, PaginatedResponse } from '../types';

// Create axios instance with base configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Hotel API endpoints
export const hotelApi = {
  // Hotels
  getHotels: (params?: any) =>
    apiClient.get<PaginatedResponse<Hotel>>('/hotels', { params }),
  
  getHotel: (id: string) =>
    apiClient.get<ApiResponse<Hotel>>(`/hotels/${id}`),
  
  createHotel: (data: FormData) => {
    console.log('API: Creating hotel with FormData');
    return apiClient.post<ApiResponse<Hotel>>('/hotels', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }).then(response => {
      console.log('API: Hotel creation response:', response);
      return response;
    }).catch(error => {
      console.error('API: Hotel creation error:', error.response || error);
      throw error;
    });
  },
  
  updateHotel: (id: string, data: Partial<Hotel>) =>
    apiClient.put<ApiResponse<Hotel>>(`/hotels/${id}`, data),
  
  deleteHotel: (id: string) =>
    apiClient.delete<ApiResponse<void>>(`/hotels/${id}`),
  
  uploadHotelImage: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return apiClient.post<ApiResponse<Hotel>>(
      `/hotels/${id}/image`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
  },

  // Floors
  createFloor: (hotelId: string, data: Partial<Floor>) =>
    apiClient.post<ApiResponse<Floor>>(`/hotels/${hotelId}/floors`, data),
  
  updateFloor: (id: string, data: Partial<Floor>) =>
    apiClient.put<ApiResponse<Floor>>(`/floors/${id}`, data),
  
  deleteFloor: (id: string) =>
    apiClient.delete<ApiResponse<void>>(`/floors/${id}`),

  // Rooms
  getRooms: (floorId: string) =>
    apiClient.get<ApiResponse<Room[]>>(`/floors/${floorId}/rooms`),
  
  getRoom: (id: string) =>
    apiClient.get<ApiResponse<Room>>(`/rooms/${id}`),
  
  createRoom: (floorId: string, data: RoomFormData & { coordinates: NormalizedCoordinates }) =>
    apiClient.post<ApiResponse<Room>>(`/floors/${floorId}/rooms`, data),
  
  updateRoom: (id: string, data: Partial<Room>) =>
    apiClient.put<ApiResponse<Room>>(`/rooms/${id}`, data),
  
  deleteRoom: (id: string) =>
    apiClient.delete<ApiResponse<void>>(`/rooms/${id}`),
  
  updateRoomCoordinates: (id: string, coordinates: NormalizedCoordinates) =>
    apiClient.patch<ApiResponse<Room>>(`/rooms/${id}/coordinates`, {
      coordinates,
    }),
  
  batchUpdateRooms: (rooms: Partial<Room>[]) =>
    apiClient.put<ApiResponse<Room[]>>('/rooms/batch', { rooms }),
};

// Image processing utilities
export const imageApi = {
  validateImage: (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!file.type.match(/^image\/(jpeg|jpg|png)$/)) {
        resolve(false);
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) { // 10MB
        resolve(false);
        return;
      }
      
      const img = new Image();
      img.onload = () => {
        resolve(img.width >= 800 && img.height >= 600);
      };
      img.onerror = () => resolve(false);
      img.src = URL.createObjectURL(file);
    });
  },
  
  getImageDimensions: (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  },
  
  createThumbnail: (file: File, maxWidth: number = 200): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        const scale = maxWidth / img.width;
        canvas.width = maxWidth;
        canvas.height = img.height * scale;
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create thumbnail'));
          }
        }, 'image/jpeg', 0.8);
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  },
};

// Export configured axios instance for custom requests
export default apiClient;