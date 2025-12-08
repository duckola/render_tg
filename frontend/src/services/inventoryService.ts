import apiClient from '../utils/api';
import { Inventory } from '../types';

export const inventoryService = {
  getAll: async (): Promise<Inventory[]> => {
    const response = await apiClient.get<Inventory[]>('/api/inventory');
    return response.data;
  },

  getByItemId: async (itemId: number): Promise<Inventory | null> => {
    const response = await apiClient.get<Inventory>(`/api/inventory/item/${itemId}`);
    return response.data || null;
  },

  create: async (payload: Partial<Inventory>): Promise<Inventory> => {
    const response = await apiClient.post<Inventory>('/api/inventory', payload);
    return response.data;
  },

  update: async (id: number, payload: Partial<Inventory>): Promise<Inventory> => {
    const response = await apiClient.put<Inventory>(`/api/inventory/${id}`, payload);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/inventory/${id}`);
  },
};

