import apiClient from '../utils/api';
import { MenuItem } from '../types';

export const menuService = {
  getAllMenuItems: async (): Promise<MenuItem[]> => {
    const response = await apiClient.get<MenuItem[]>('/api/menu');
    return response.data;
  },

  getMenuItemById: async (id: number): Promise<MenuItem> => {
    const response = await apiClient.get<MenuItem>(`/api/menu/${id}`);
    return response.data;
  },

  createMenuItem: async (item: Partial<MenuItem>): Promise<MenuItem> => {
    const response = await apiClient.post<MenuItem>('/api/menu', item);
    return response.data;
  },

  updateMenuItem: async (id: number, item: Partial<MenuItem>): Promise<MenuItem> => {
    const response = await apiClient.put<MenuItem>(`/api/menu/${id}`, item);
    return response.data;
  },

  deleteMenuItem: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/menu/${id}`);
  },

  getPopularMenuItems: async (limit: number = 4): Promise<MenuItem[]> => {
    const response = await apiClient.get<MenuItem[]>(`/api/menu/popular?limit=${limit}`);
    return response.data;
  },
};

