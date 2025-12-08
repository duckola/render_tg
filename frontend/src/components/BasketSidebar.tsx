import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cartService } from '../services/cartService';
import { orderService } from '../services/orderService';
import { paymentMethodService } from '../services/paymentMethodService';
import { useAuthStore } from '../store/authStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

interface BasketSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onEditItem?: (item: any) => void;
}

export const BasketSidebar = ({ isOpen, onClose, onEditItem }: BasketSidebarProps) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('cash');

  const { data: cart, isLoading } = useQuery({
    queryKey: ['cart', user?.userId],
    queryFn: () => cartService.getCartByUserId(user!.userId),
    enabled: !!user?.userId,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  // Debug logging
  if (cart && import.meta.env?.DEV) {
    console.log('=== CART DEBUG ===');
    console.log('Full cart object:', JSON.stringify(cart, null, 2));
    if (cart.cartItems && cart.cartItems.length > 0) {
      cart.cartItems.forEach((item, index) => {
        console.log(`Item ${index}:`, {
          cartItemId: item.cartItemId,
          quantity: item.quantity,
          menuItem: item.menuItem,
          price: item.menuItem?.price,
          priceType: typeof item.menuItem?.price,
        });
      });
    }
  }

  const { data: paymentMethods } = useQuery({
    queryKey: ['paymentMethods', user?.userId],
    queryFn: () => paymentMethodService.getAll(user!.userId),
    enabled: !!user?.userId && isOpen,
  });

  const updateQuantityMutation = useMutation({
    mutationFn: ({ cartItemId, quantity }: { cartItemId: number; quantity: number }) =>
      cartService.updateCartItemQuantity(cartItemId, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart', user?.userId] });
    },
    onError: () => {
      toast.error('Failed to update quantity');
    },
  });

  const removeItemMutation = useMutation({
    mutationFn: cartService.removeCartItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart', user?.userId] });
      toast.success('Item removed from cart');
    },
    onError: () => {
      toast.error('Failed to remove item');
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: () => {
      let paymentMethodString = 'Cash';
      if (selectedPaymentMethod !== 'cash' && paymentMethods) {
        const methodId = Number(selectedPaymentMethod.replace('payment-', ''));
        const method = paymentMethods.find(pm => pm.paymentMethodId === methodId);
        if (method) {
          paymentMethodString = `${method.methodType} ${method.maskedDetails || ''}`.trim();
        }
      }
      return orderService.createOrderFromCart(user!.userId, paymentMethodString);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart', user?.userId] });
      queryClient.invalidateQueries({ queryKey: ['orders', user?.userId] });
      queryClient.invalidateQueries({ queryKey: ['orders'] }); // Invalidate admin orders
      toast.success('Order placed successfully!');
      onClose();
      navigate('/history?tab=ongoing');
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || 'Failed to place order';
      toast.error(errorMessage);
    },
  });

  const handleQuantityChange = (cartItemId: number, currentQuantity: number, change: number) => {
    const newQuantity = currentQuantity + change;
    if (newQuantity <= 0) {
      removeItemMutation.mutate(cartItemId);
    } else {
      updateQuantityMutation.mutate({ cartItemId, quantity: newQuantity });
    }
  };

  const handleConfirmOrder = () => {
    if (!cart?.cartItems || cart.cartItems.length === 0) {
      toast.error('Cart is empty');
      return;
    }
    createOrderMutation.mutate();
  };

  const calculateTotal = () => {
    if (!cart?.cartItems) return 0;
    return cart.cartItems.reduce((total, item) => {
      // Safely extract price - handle both number and string (from BigDecimal)
      const rawPrice = item.menuItem?.price;
      let itemPrice = 0;
      
      if (rawPrice !== undefined && rawPrice !== null) {
        if (typeof rawPrice === 'number') {
          itemPrice = rawPrice;
        } else if (typeof rawPrice === 'string') {
          itemPrice = Number.parseFloat(rawPrice) || 0;
        } else if (typeof rawPrice === 'object') {
          // Handle BigDecimal object structure
          const priceValue = (rawPrice as any).value || (rawPrice as any).toString?.() || String(rawPrice);
          itemPrice = Number.parseFloat(String(priceValue)) || 0;
        }
      }
      
      const quantity = typeof item.quantity === 'number' 
        ? item.quantity 
        : typeof item.quantity === 'string' 
          ? Number.parseInt(item.quantity, 10) || 0
          : 0;
      
      return total + (itemPrice * quantity);
    }, 0);
  };

  // Payment method selection is handled by selectedPaymentMethod state

  if (!user) {
    return null;
  }

  return (
    <>
      {isOpen && (
        <div
          className="basket-backdrop"
          onClick={onClose}
        />
      )}
      <div
        className={`basket-overlay ${isOpen ? 'active' : ''}`}
      >
        <div className="basket-content">
          <div className="basket-header">
            <i className="fa-solid fa-basket-shopping"></i>
            <span>My Basket</span>
          </div>

          <div className="basket-main-section">
            <div className="basket-subheader">MAIN CANTEEN ORDER</div>

            <div className="basket-items">
              {isLoading ? (
                <div style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
                  Loading...
                </div>
              ) : !cart?.cartItems || cart.cartItems.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
                  Your basket is empty
                </div>
              ) : (
                cart.cartItems.map((item) => {
                  // Safely extract price - handle both number and string (from BigDecimal)
                  const rawPrice = item.menuItem?.price;
                  let price = 0;
                  
                  if (rawPrice !== undefined && rawPrice !== null) {
                    if (typeof rawPrice === 'number') {
                      price = rawPrice;
                    } else if (typeof rawPrice === 'string') {
                      price = parseFloat(rawPrice) || 0;
                    } else if (typeof rawPrice === 'object') {
                      // Handle BigDecimal object structure if it comes as {value: "29.99", scale: 2} or similar
                      const priceValue = (rawPrice as any).value || (rawPrice as any).toString?.() || String(rawPrice);
                      price = parseFloat(String(priceValue)) || 0;
                    }
                  }
                  
                  // Safely extract quantity - ensure it's a number
                  const quantity = typeof item.quantity === 'number' 
                    ? item.quantity 
                    : typeof item.quantity === 'string' 
                      ? parseInt(item.quantity, 10) || 0
                      : 0;
                  
                  // Calculate item total
                  const itemTotal = price * quantity;
                  
                  // Debug log for each item (only in development)
                  if (import.meta.env?.DEV) {
                    console.log('Basket Item:', {
                      cartItemId: item.cartItemId,
                      itemName: item.menuItem?.name,
                      rawPrice,
                      parsedPrice: price,
                      quantity,
                      itemTotal,
                      fullItem: item,
                    });
                  }
                  
                  return (
                    <div key={item.cartItemId} className="basket-item-card-new">
                      <img
                        src={item.menuItem?.imageUrl || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="70" height="70"%3E%3Crect fill="%23f0f0f0" width="70" height="70"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-family="Arial" font-size="10"%3ENo Image%3C/text%3E%3C/svg%3E'}
                        className="basket-item-img-new"
                        alt={item.menuItem?.name || 'Item'}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="70" height="70"%3E%3Crect fill="%23f0f0f0" width="70" height="70"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-family="Arial" font-size="10"%3ENo Image%3C/text%3E%3C/svg%3E';
                        }}
                      />
                      <div className="basket-item-details-new">
                        <h4>{item.menuItem?.name || 'Item'}</h4>
                        <p>Dine in</p>
                        <div className="edit-btn-new" onClick={() => {
                          if (onEditItem && item.menuItem) {
                            onEditItem(item.menuItem);
                          }
                        }}>
                          Edit
                        </div>
                      </div>
                      <div className="item-price-new" style={{ 
                        color: '#5d0c1d', 
                        fontWeight: 'bold',
                        fontSize: '0.9rem',
                        position: 'absolute',
                        top: '15px',
                        right: '15px',
                        zIndex: 10
                      }}>
                        ₱ {itemTotal.toFixed(2)}
                      </div>
                      <div className="basket-controls-new" style={{
                        position: 'absolute',
                        bottom: '15px',
                        right: '15px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        zIndex: 10
                      }}>
                        <button
                          className="qty-btn-new qty-minus"
                          onClick={() => handleQuantityChange(item.cartItemId, quantity, -1)}
                        >
                          -
                        </button>
                        <span className="qty-box-new" style={{
                          border: '2px solid #F4C430',
                          borderRadius: '8px',
                          padding: '5px 12px',
                          fontWeight: 'bold',
                          color: '#5d0c1d',
                          fontSize: '0.95rem',
                          background: 'white',
                          minWidth: '40px',
                          textAlign: 'center',
                          display: 'inline-block'
                        }}>
                          {quantity}
                        </span>
                        <button
                          className="qty-btn-new qty-plus"
                          onClick={() => handleQuantityChange(item.cartItemId, quantity, 1)}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {cart?.cartItems && cart.cartItems.length > 0 && (
              <div className="basket-footer-new">
                <div className="total-section-new">
                  <span className="total-label-new">Total Amount:</span>
                  <span className="total-amount-new">₱ {calculateTotal().toFixed(2)}</span>
                </div>

                <div className="payment-methods-section">
                  <div className="payment-option">
                    <label className="payment-label">
                      <span>Cash</span>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cash"
                        checked={selectedPaymentMethod === 'cash'}
                        onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                        className="payment-radio"
                      />
                    </label>
                  </div>
                  {paymentMethods && paymentMethods.length > 0 && (
                    <div className="payment-option">
                      <label className="payment-label">
                        <div className="payment-method-info">
                          <span>{paymentMethods[0].methodType} {paymentMethods[0].maskedDetails || ''}</span>
                          <span className="change-link">Change</span>
                        </div>
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={`payment-${paymentMethods[0].paymentMethodId}`}
                          checked={selectedPaymentMethod === `payment-${paymentMethods[0].paymentMethodId}`}
                          onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                          className="payment-radio"
                        />
                      </label>
                    </div>
                  )}
                </div>

                <button 
                  className="confirm-order-btn" 
                  onClick={handleConfirmOrder}
                  disabled={createOrderMutation.isPending}
                >
                  {createOrderMutation.isPending ? 'Processing...' : 'Confirm Order'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
