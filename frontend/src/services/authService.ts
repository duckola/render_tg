import apiClient from '../utils/api';
import { AuthResponse, LoginRequest, SignUpRequest, User } from '../types';

export const authService = {
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/api/auth/login', credentials);
    return response.data;
  },

  signup: async (data: SignUpRequest): Promise<User> => {
    const response = await apiClient.post<User>('/api/auth/signup', data);
    return response.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get<User>('/api/users/me');
    return response.data;
  },

  updateProfile: async (userId: number, data: Partial<User>): Promise<User> => {
    const response = await apiClient.put<User>(`/api/users/${userId}`, data);
    return response.data;
  },
};

