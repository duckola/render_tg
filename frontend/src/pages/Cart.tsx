import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cartService } from '../services/cartService';
import { orderService } from '../services/orderService';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

export const Cart = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const { data: cart, isLoading } = useQuery({
    queryKey: ['cart', user?.userId],
    queryFn: () => cartService.getCartByUserId(user!.userId),
    enabled: !!user?.userId,
  });

  const updateQuantityMutation = useMutation({
    mutationFn: ({ cartItemId, quantity }: { cartItemId: number; quantity: number }) =>
      cartService.updateCartItemQuantity(cartItemId, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart', user?.userId] });
    },
  });

  const removeItemMutation = useMutation({
    mutationFn: cartService.removeCartItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart', user?.userId] });
      toast.success('Item removed from cart');
    },
  });

  const checkoutMutation = useMutation({
    mutationFn: () => orderService.createOrderFromCart(user!.userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart', user?.userId] });
      queryClient.invalidateQueries({ queryKey: ['orders', user?.userId] });
      toast.success('Order placed successfully!');
      navigate('/orders');
    },
    onError: () => {
      toast.error('Failed to place order');
    },
  });

  const handleCheckout = async () => {
    if (!cart?.cartItems || cart.cartItems.length === 0) {
      toast.error('Cart is empty');
      return;
    }
    setIsCheckingOut(true);
    checkoutMutation.mutate();
    setIsCheckingOut(false);
  };

  const calculateTotal = () => {
    if (!cart?.cartItems) return 0;
    return cart.cartItems.reduce((total, item) => {
      const itemPrice = item.menuItem?.price || 0;
      return total + itemPrice * item.quantity;
    }, 0);
  };

  if (isLoading) {
    return <div className="p-8 text-center">Loading cart...</div>;
  }

  if (!cart || !cart.cartItems || cart.cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Your Cart</h1>
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500 mb-4">Your cart is empty</p>
          <button
            onClick={() => navigate('/menu')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Browse Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Your Cart</h1>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="space-y-4">
          {cart.cartItems.map((item) => (
            <div key={item.cartItemId} className="flex items-center justify-between border-b pb-4">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{item.menuItem?.name || 'Item'}</h3>
                {item.note && (
                  <p className="text-sm text-gray-500">Note: {item.note}</p>
                )}
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        if (item.quantity > 1) {
                          updateQuantityMutation.mutate({
                            cartItemId: item.cartItemId,
                            quantity: item.quantity - 1,
                          });
                        }
                      }}
                      className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                      disabled={item.quantity <= 1}
                    >
                      -
                    </button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <button
                      onClick={() => {
                        updateQuantityMutation.mutate({
                          cartItemId: item.cartItemId,
                          quantity: item.quantity + 1,
                        });
                      }}
                      className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-gray-700">
                    ₱{((item.menuItem?.price || 0) * item.quantity).toFixed(2)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => removeItemMutation.mutate(item.cartItemId)}
                className="ml-4 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-6 border-t">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xl font-semibold">Total:</span>
            <span className="text-2xl font-bold text-indigo-600">
              ₱{calculateTotal().toFixed(2)}
            </span>
          </div>
          <button
            onClick={handleCheckout}
            disabled={isCheckingOut}
            className="w-full px-4 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 font-semibold"
          >
            {isCheckingOut ? 'Processing...' : 'Checkout'}
          </button>
        </div>
      </div>
    </div>
  );
};

