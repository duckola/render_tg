import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { cartService } from '../services/cartService';
import { useAuthStore } from '../store/authStore';
// BasketSidebar is handled in Menu.tsx to support onEditItem
import { NotificationsModal } from './NotificationsModal';

interface MenuHeaderProps {
  isBasketOpen?: boolean;
  onBasketOpen?: () => void;
}

export const MenuHeader = ({ isBasketOpen = false, onBasketOpen }: MenuHeaderProps) => {
  const { user } = useAuthStore();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notificationButtonRef = useRef<HTMLButtonElement>(null);

  const { data: cart } = useQuery({
    queryKey: ['cart', user?.userId],
    queryFn: () => cartService.getCartByUserId(user!.userId),
    enabled: !!user?.userId,
  });

  const cartItemCount = cart?.cartItems?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  return (
    <>
      <header className="menu-header">
        <div className="logo">
          <h1>
            TEKNO<span>GRUB</span>
          </h1>
        </div>
        <div className="header-icons">
          <button 
            ref={notificationButtonRef}
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            style={{ border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', position: 'relative' }}
            aria-label="Notifications"
          >
            <i className="fa-solid fa-bell"></i>
          </button>
          <i className="fa-solid fa-bars"></i>
        </div>
      </header>

      {/* Notifications Modal */}
      <NotificationsModal 
        isOpen={isNotificationsOpen} 
        onClose={() => setIsNotificationsOpen(false)}
        anchorElement={notificationButtonRef.current}
      />

      {/* Floating Basket */}
      {!isBasketOpen && (
        <div className="floating-basket" onClick={() => onBasketOpen?.()}>
          <div style={{
            width: '100%',
            height: '100%',
            background: '#F4C430',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            color: '#520000',
            fontWeight: 'bold'
          }}>
            <i className="fa-solid fa-basket-shopping"></i>
          </div>
          {cartItemCount > 0 && (
            <div className="basket-badge">{cartItemCount}</div>
          )}
        </div>
      )}

      {/* Basket Sidebar is handled in Menu.tsx to support onEditItem */}
    </>
  );
};

