import apiClient from '../utils/api';
import { Order } from '../types';

export const orderService = {
  createOrderFromCart: async (userId: number, paymentMethod?: string): Promise<Order> => {
    const response = await apiClient.post<Order>(`/api/orders/user/${userId}`, null, {
      params: { paymentMethod: paymentMethod || 'Cash' }
    });
    return response.data;
  },

  getOrderById: async (orderId: number): Promise<Order> => {
    const response = await apiClient.get<Order>(`/api/orders/${orderId}`);
    return response.data;
  },

  getOrdersByUserId: async (userId: number): Promise<Order[]> => {
    const response = await apiClient.get<Order[]>(`/api/orders/user/${userId}`);
    return response.data;
  },

  getAllOrders: async (): Promise<Order[]> => {
    const response = await apiClient.get<Order[]>('/api/orders');
    return response.data;
  },

  updateOrderStatus: async (orderId: number, status: string): Promise<Order> => {
    const response = await apiClient.put<Order>(`/api/orders/${orderId}/status`, { status });
    return response.data;
  },
};

