import apiClient from '../utils/api';
import { Canteen } from '../types';

export const canteenService = {
  getAllCanteens: async (): Promise<Canteen[]> => {
    const response = await apiClient.get<Canteen[]>('/api/canteens');
    return response.data;
  },

  getCanteenById: async (id: number): Promise<Canteen> => {
    const response = await apiClient.get<Canteen>(`/api/canteens/${id}`);
    return response.data;
  },
};

