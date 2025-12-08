import { create } from 'zustand';
import { MenuItem } from '../types';

export interface CartItemWithDetails {
  cartItemId?: number;
  itemId: number;
  menuItem: MenuItem;
  quantity: number;
  note?: string;
  addonRice?: boolean;
}

interface CartState {
  items: CartItemWithDetails[];
  addItem: (item: MenuItem, quantity: number, note?: string, addonRice?: boolean) => void;
  removeItem: (itemId: number) => void;
  updateQuantity: (itemId: number, quantity: number) => void;
  updateNote: (itemId: number, note: string) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],

  addItem: (item, quantity, note, addonRice) => {
    set((state) => {
      const existingItemIndex = state.items.findIndex(
        (i) => i.itemId === item.itemId && i.addonRice === addonRice && i.note === note
      );

      if (existingItemIndex >= 0) {
        // Update existing item quantity
        const updatedItems = [...state.items];
        updatedItems[existingItemIndex].quantity += quantity;
        return { items: updatedItems };
      } else {
        // Add new item
        return {
          items: [
            ...state.items,
            {
              itemId: item.itemId,
              menuItem: item,
              quantity,
              note,
              addonRice,
            },
          ],
        };
      }
    });
  },

  removeItem: (itemId) => {
    set((state) => ({
      items: state.items.filter((item) => item.itemId !== itemId),
    }));
  },

  updateQuantity: (itemId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(itemId);
      return;
    }
    set((state) => ({
      items: state.items.map((item) =>
        item.itemId === itemId ? { ...item, quantity } : item
      ),
    }));
  },

  updateNote: (itemId, note) => {
    set((state) => ({
      items: state.items.map((item) =>
        item.itemId === itemId ? { ...item, note } : item
      ),
    }));
  },

  clearCart: () => {
    set({ items: [] });
  },

  getTotal: () => {
    const { items } = get();
    return items.reduce((total, item) => {
      let itemPrice = item.menuItem.price * item.quantity;
      if (item.addonRice) {
        itemPrice += 15 * item.quantity; // Rice addon price
      }
      return total + itemPrice;
    }, 0);
  },

  getItemCount: () => {
    return get().items.reduce((count, item) => count + item.quantity, 0);
  },
}));

