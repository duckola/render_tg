import apiClient from '../utils/api';
import { Cart, CartItem } from '../types';

export const cartService = {
  getCartByUserId: async (userId: number): Promise<Cart> => {
    const response = await apiClient.get<Cart>(`/api/carts/user/${userId}`);
    return response.data;
  },

  addItemToCart: async (userId: number, menuItemId: number, quantity: number, note?: string): Promise<Cart> => {
    const response = await apiClient.post<Cart>(`/api/carts/user/${userId}/items`, {
      menuItemId,
      quantity,
      note,
    });
    return response.data;
  },

  updateCartItemQuantity: async (cartItemId: number, quantity: number): Promise<Cart> => {
    const response = await apiClient.put<Cart>(`/api/carts/items/${cartItemId}`, { quantity });
    return response.data;
  },

  removeCartItem: async (cartItemId: number): Promise<void> => {
    await apiClient.delete(`/api/carts/items/${cartItemId}`);
  },
};

