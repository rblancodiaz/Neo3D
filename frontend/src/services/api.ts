import axios, { type AxiosInstance } from 'axios';
import type { Hotel, Floor, Room, RoomFormData, NormalizedCoordinates, ApiResponse, PaginatedResponse } from '../types';

// Create axios instance with base configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: 'http://localhost:3001/api',  // Direct backend URL for now
  timeout: 60000,  // Increased timeout to 60 seconds for large files
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    console.log('🚀 AXIOS REQUEST: Outgoing request details:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`,
      headers: {
        'Content-Type': config.headers['Content-Type'],
        Authorization: !!config.headers.Authorization,
      },
      hasData: !!config.data,
      dataType: config.data instanceof FormData ? 'FormData' : typeof config.data,
      timestamp: new Date().toISOString(),
    });
    
    // Add auth token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('🚀 AXIOS REQUEST ERROR:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    console.log('🌐 AXIOS RESPONSE: Incoming response details:', {
      status: response.status,
      statusText: response.statusText,
      url: response.config.url,
      method: response.config.method?.toUpperCase(),
      headers: {
        'content-type': response.headers['content-type'],
        'content-length': response.headers['content-length'],
      },
      dataType: typeof response.data,
      hasData: !!response.data,
      timestamp: new Date().toISOString(),
    });
    
    // Log full response data for debugging
    if (response.data) {
      console.log('🌐 AXIOS RESPONSE: Response body structure:', {
        success: response.data.success,
        error: response.data.error,
        message: response.data.message,
        hasNestedData: !!response.data.data,
        nestedDataType: typeof response.data.data,
        nestedDataKeys: response.data.data ? Object.keys(response.data.data) : null,
      });
      console.log('🌐 AXIOS RESPONSE: Full response.data:', JSON.stringify(response.data, null, 2));
    }
    
    return response;
  },
  (error) => {
    console.error('🌐 AXIOS ERROR: Response error intercepted:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      method: error.config?.method?.toUpperCase(),
      responseData: error.response?.data,
      timestamp: new Date().toISOString(),
    });
    
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
    console.log('🌐 API CALL: Starting hotel creation request...');
    console.log('🌐 API CALL: FormData contents:', {
      hasName: data.has('name'),
      hasImage: data.has('image'),
      nameValue: data.get('name'),
      imageFileName: (data.get('image') as File)?.name || 'no file',
    });
    
    return apiClient.post<ApiResponse<Hotel>>('/hotels', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }).then(response => {
      console.log('🌐 API RESPONSE: Raw hotel creation response received');
      console.log('🌐 API RESPONSE: Response status:', response.status);
      console.log('🌐 API RESPONSE: Response headers:', response.headers);
      console.log('🌐 API RESPONSE: Response data structure:', {
        dataType: typeof response.data,
        hasData: !!response.data,
        dataKeys: response.data ? Object.keys(response.data) : 'no data',
      });
      console.log('🌐 API RESPONSE: Full response.data:', JSON.stringify(response.data, null, 2));
      
      // Detailed analysis of nested structure
      if (response.data) {
        console.log('🌐 API RESPONSE: Analyzing response.data structure:');
        console.log('  - success:', response.data.success);
        console.log('  - error:', response.data.error);
        console.log('  - message:', response.data.message);
        console.log('  - data field type:', typeof response.data.data);
        console.log('  - data field keys:', response.data.data ? Object.keys(response.data.data) : 'no nested data');
        
        if (response.data.data) {
          console.log('🌐 API RESPONSE: Analyzing nested response.data.data:');
          console.log('  - nested data type:', typeof response.data.data);
          console.log('  - nested data keys:', Object.keys(response.data.data));
          console.log('  - nested data:', JSON.stringify(response.data.data, null, 2));
        }
      }
      
      return response;
    }).catch(error => {
      console.error('🌐 API ERROR: Hotel creation failed');
      console.error('🌐 API ERROR: Error object:', error);
      console.error('🌐 API ERROR: Error message:', error.message);
      console.error('🌐 API ERROR: Error response:', error.response?.data);
      console.error('🌐 API ERROR: Error status:', error.response?.status);
      console.error('🌐 API ERROR: Error headers:', error.response?.headers);
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
  
  createRoom: (floorId: string, data: RoomFormData & { coordinates: NormalizedCoordinates }) => {
    // Transform coordinates to match backend expectations
    const { coordinates, ...roomData } = data;
    const transformedData = {
      ...roomData,
      coordinates: {
        x: coordinates.x,
        y: coordinates.y,
        width: coordinates.width,
        height: coordinates.height
      }
    };
    
    console.log('🚀 API: Creating room with transformed data:', transformedData);
    return apiClient.post<ApiResponse<Room>>(`/floors/${floorId}/rooms`, transformedData);
  },
  
  updateRoom: (id: string, data: Partial<Room>) => {
    // Transform coordinates if present
    const transformedData = data.coordinates ? {
      ...data,
      xCoordinate: data.coordinates.x,
      yCoordinate: data.coordinates.y,
      width: data.coordinates.width,
      height: data.coordinates.height
    } : data;
    
    return apiClient.put<ApiResponse<Room>>(`/rooms/${id}`, transformedData);
  },
  
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
      const objectUrl = URL.createObjectURL(file);
      
      img.onload = () => {
        const isValid = img.width >= 800 && img.height >= 600;
        URL.revokeObjectURL(objectUrl); // Clean up
        resolve(isValid);
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl); // Clean up
        resolve(false);
      };
      img.src = objectUrl;
    });
  },
  
  getImageDimensions: (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      
      img.onload = () => {
        const dimensions = { width: img.width, height: img.height };
        URL.revokeObjectURL(objectUrl); // Clean up
        resolve(dimensions);
      };
      img.onerror = (error) => {
        URL.revokeObjectURL(objectUrl); // Clean up
        reject(error);
      };
      img.src = objectUrl;
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