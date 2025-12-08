import apiClient from '../utils/api';
import { PaymentMethod } from '../types';

export interface CreatePaymentMethodRequest {
  methodType: string;
  maskedDetails: string;
  isDefault: boolean;
}

export interface UpdatePaymentMethodRequest {
  methodType?: string;
  maskedDetails?: string;
  isDefault?: boolean;
}

export const paymentMethodService = {
  getAll: async (userId: number): Promise<PaymentMethod[]> => {
    const response = await apiClient.get<PaymentMethod[]>(`/api/users/${userId}/payment-methods`);
    return response.data;
  },

  create: async (userId: number, payload: CreatePaymentMethodRequest): Promise<PaymentMethod> => {
    const response = await apiClient.post<PaymentMethod>(`/api/users/${userId}/payment-methods`, payload);
    return response.data;
  },

  update: async (userId: number, paymentMethodId: number, payload: UpdatePaymentMethodRequest): Promise<PaymentMethod> => {
    const response = await apiClient.put<PaymentMethod>(`/api/users/${userId}/payment-methods/${paymentMethodId}`, payload);
    return response.data;
  },

  delete: async (userId: number, paymentMethodId: number): Promise<void> => {
    await apiClient.delete(`/api/users/${userId}/payment-methods/${paymentMethodId}`);
  },
};

