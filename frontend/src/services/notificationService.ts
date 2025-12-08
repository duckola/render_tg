import apiClient from '../utils/api';
import { Notification } from '../types';

export interface CreateNotificationRequest {
  userId: number;
  message: string;
  type?: string;
}

export const notificationService = {
  getByUserId: async (userId: number): Promise<Notification[]> => {
    const response = await apiClient.get<Notification[]>(`/api/notifications/user/${userId}`);
    return response.data;
  },

  create: async (payload: CreateNotificationRequest): Promise<Notification> => {
    const response = await apiClient.post<Notification>('/api/notifications', payload);
    return response.data;
  },

  markAsRead: async (notificationId: number): Promise<Notification> => {
    const response = await apiClient.put<Notification>(`/api/notifications/${notificationId}/read`);
    return response.data;
  },

  markAllAsRead: async (userId: number): Promise<void> => {
    await apiClient.put(`/api/notifications/user/${userId}/read-all`);
  },
};

