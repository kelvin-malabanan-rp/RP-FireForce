import { apiService, ApiResponse } from './apiService';

// Example types - replace with your actual data types
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  avatar?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

// User service methods
export const userService = {
  // Get all users
  getUsers: async (): Promise<ApiResponse<User[]>> => {
    return apiService.get<User[]>('/users');
  },

  // Get user by ID
  getUserById: async (id: string): Promise<ApiResponse<User>> => {
    return apiService.get<User>(`/users/${id}`);
  },

  // Create new user
  createUser: async (userData: CreateUserData): Promise<ApiResponse<User>> => {
    return apiService.post<User>('/users', userData);
  },

  // Update user
  updateUser: async (id: string, userData: UpdateUserData): Promise<ApiResponse<User>> => {
    return apiService.put<User>(`/users/${id}`, userData);
  },

  // Delete user
  deleteUser: async (id: string): Promise<ApiResponse<void>> => {
    return apiService.delete<void>(`/users/${id}`);
  },

  // Upload user avatar
  uploadAvatar: async (
    userId: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse<{ avatarUrl: string }>> => {
    return apiService.uploadFile<{ avatarUrl: string }>(
      `/users/${userId}/avatar`,
      file,
      (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      }
    );
  },
};

// Auth service methods
export const authService = {
  // Login
  login: async (credentials: LoginData): Promise<ApiResponse<AuthResponse>> => {
    const response = await apiService.post<AuthResponse>('/auth/login', credentials);
    
    // Store token if login successful
    if (response.success && response.data.token) {
      apiService.setAuthToken(response.data.token);
      localStorage.setItem('refreshToken', response.data.refreshToken);
    }
    
    return response;
  },

  // Register
  register: async (userData: CreateUserData): Promise<ApiResponse<AuthResponse>> => {
    const response = await apiService.post<AuthResponse>('/auth/register', userData);
    
    // Store token if registration successful
    if (response.success && response.data.token) {
      apiService.setAuthToken(response.data.token);
      localStorage.setItem('refreshToken', response.data.refreshToken);
    }
    
    return response;
  },

  // Logout
  logout: async (): Promise<void> => {
    try {
      await apiService.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      apiService.removeAuthToken();
      localStorage.removeItem('refreshToken');
    }
  },

  // Refresh token
  refreshToken: async (): Promise<ApiResponse<{ token: string }>> => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await apiService.post<{ token: string }>('/auth/refresh', {
      refreshToken,
    });

    if (response.success && response.data.token) {
      apiService.setAuthToken(response.data.token);
    }

    return response;
  },

  // Get current user profile
  getProfile: async (): Promise<ApiResponse<User>> => {
    return apiService.get<User>('/auth/profile');
  },
};

// Export all services
export const services = {
  user: userService,
  auth: authService,
  // Add more services here as needed
};
