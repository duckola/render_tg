import apiClient from '../utils/api';
import { Category } from '../types';

export const categoryService = {
  getAll: async (): Promise<Category[]> => {
    const res = await apiClient.get<Category[]>('/api/categories');
    return res.data;
  },
  getOne: async (id: number): Promise<Category> => {
    const res = await apiClient.get<Category>(`/api/categories/${id}`);
    return res.data;
  },
  create: async (payload: Partial<Category>): Promise<Category> => {
    const res = await apiClient.post<Category>('/api/categories', payload);
    return res.data;
  },
  update: async (id: number, payload: Partial<Category>): Promise<Category> => {
    const res = await apiClient.put<Category>(`/api/categories/${id}`, payload);
    return res.data;
  },
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/categories/${id}`);
  },
};

