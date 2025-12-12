import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { orderService } from '../services/orderService';
import { cartService } from '../services/cartService';
import { canteenService } from '../services/canteenService';
import { useAuthStore } from '../store/authStore';
import { MenuHeader } from '../components/MenuHeader';
import { MenuSidebar } from '../components/MenuSidebar';
import { BasketSidebar } from '../components/BasketSidebar';
import { Canteen, Order, OrderItem } from '../types';
import toast from 'react-hot-toast';
import '../styles/menu.css';
import './History.css';

export const History = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedCanteenId, setSelectedCanteenId] = useState<number | null>(null);
  const [selectedCanteenName, setSelectedCanteenName] = useState<string>('');
  const [isBasketOpen, setIsBasketOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'ongoing' | 'completed' | 'cancelled'>(() => {
    const tabParam = searchParams.get('tab');
    return (tabParam === 'ongoing' ? 'ongoing' : tabParam === 'cancelled' ? 'cancelled' : 'completed') as 'ongoing' | 'completed' | 'cancelled';
  });

  const { data: canteens } = useQuery({
    queryKey: ['canteens'],
    queryFn: canteenService.getAllCanteens,
  });

  // Set default canteen when canteens load
  useEffect(() => {
    if (canteens && canteens.length > 0 && !selectedCanteenId) {
      const firstCanteen = canteens[0];
      setSelectedCanteenId(firstCanteen.canteenId);
      setSelectedCanteenName(firstCanteen.name);
    }
  }, [canteens, selectedCanteenId]);

  // Update tab when URL parameter changes
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'ongoing' || tabParam === 'completed' || tabParam === 'cancelled') {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders', user?.userId],
    queryFn: () => orderService.getOrdersByUserId(user!.userId),
    enabled: !!user?.userId,
  });

  const ongoingOrders = orders?.filter((order: Order) => 
    ['PENDING', 'PENDING_PAYMENT', 'PREPARING', 'READY'].includes(order.status)
  ) || [];

  const completedOrders = orders?.filter((order: Order) => 
    order.status === 'COMPLETED'
  ) || [];

  const cancelledOrders = orders?.filter((order: Order) => 
    ['CANCELLED', 'CANCELED', 'DECLINED'].includes(order.status)
  ) || [];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price: number) => {
    return `P ${price.toFixed(2)}`;
  };

  const handleReorder = async (order: Order) => {
    if (!user) {
      toast.error('Please log in to reorder');
      return;
    }

    const orderItems = order.orderItems || order.items || [];
    
    if (orderItems.length === 0) {
      toast.error('No items to reorder');
      return;
    }

    try {
      let addedCount = 0;
      let failedCount = 0;

      // Add each item from the order back to the cart
      for (const item of orderItems) {
        try {
          // Try menuItem.itemId first (if menuItem is populated), then fall back to itemId
          const menuItemId = item.menuItem?.itemId || item.itemId;
          
          if (!menuItemId) {
            console.error('Missing menuItemId in order item:', item);
            failedCount++;
            continue;
          }

          await cartService.addItemToCart(
            user.userId,
            menuItemId,
            item.quantity || 1,
            item.note || undefined
          );
          addedCount++;
        } catch (itemError: any) {
          console.error('Error adding item to cart:', itemError);
          failedCount++;
        }
      }
      
      // Invalidate cart query to refresh the cart
      queryClient.invalidateQueries({ queryKey: ['cart', user.userId] });
      
      if (addedCount > 0) {
        toast.success(`${addedCount} item${addedCount > 1 ? 's' : ''} added to basket!`);
        setIsBasketOpen(true); // Open the basket sidebar to show added items
      }
      
      if (failedCount > 0) {
        toast.error(`Failed to add ${failedCount} item${failedCount > 1 ? 's' : ''} to basket`);
      }
    } catch (error: any) {
      console.error('Reorder error:', error);
      toast.error(error?.response?.data?.message || 'Failed to add items to basket');
    }
  };

  const handleTabChange = (tab: 'ongoing' | 'completed' | 'cancelled') => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  if (isLoading) {
    return (
      <div className="menu-page">
        <MenuHeader 
          isBasketOpen={isBasketOpen}
          onBasketOpen={() => setIsBasketOpen(true)}
        />
        <MenuSidebar 
          selectedCanteenName={selectedCanteenName}
          canteens={canteens || []}
          onCanteenChange={(canteenId: number, canteenName: string) => {
            setSelectedCanteenId(canteenId);
            setSelectedCanteenName(canteenName);
          }}
        />
        <div style={{ textAlign: 'center', padding: '50px', color: 'white' }}>
          Loading order history...
        </div>
      </div>
    );
  }

  const getDisplayOrders = () => {
    switch (activeTab) {
      case 'ongoing':
        return ongoingOrders;
      case 'completed':
        return completedOrders;
      case 'cancelled':
        return cancelledOrders;
      default:
        return [];
    }
  };

  const displayOrders = getDisplayOrders();

  return (
    <div className="menu-page">
      <MenuHeader 
        isBasketOpen={isBasketOpen}
        onBasketOpen={() => setIsBasketOpen(true)}
      />
      <MenuSidebar 
        selectedCanteenName={selectedCanteenName}
        canteens={canteens || []}
        onCanteenChange={(canteenId: number, canteenName: string) => {
          setSelectedCanteenId(canteenId);
          setSelectedCanteenName(canteenName);
        }}
      />

      <main className="menu-main-content">
        <section className="history-section">
          <h3 className="section-title">Order History</h3>
          
          <div className="history-tabs-container">
            <button className="tab-nav-arrow" onClick={() => {
              const tabs: ('ongoing' | 'completed' | 'cancelled')[] = ['ongoing', 'completed', 'cancelled'];
              const currentIndex = tabs.indexOf(activeTab);
              const prevIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
              handleTabChange(tabs[prevIndex]);
            }}>
              <i className="fa-solid fa-chevron-left"></i>
            </button>
            <div className="history-tabs">
              <button
                className={`history-tab ${activeTab === 'ongoing' ? 'active' : ''}`}
                onClick={() => handleTabChange('ongoing')}
              >
                Ongoing
              </button>
              <button
                className={`history-tab ${activeTab === 'completed' ? 'active' : ''}`}
                onClick={() => handleTabChange('completed')}
              >
                Completed
              </button>
              <button
                className={`history-tab ${activeTab === 'cancelled' ? 'active' : ''}`}
                onClick={() => handleTabChange('cancelled')}
              >
                Cancelled
              </button>
            </div>
            <button className="tab-nav-arrow" onClick={() => {
              const tabs: ('ongoing' | 'completed' | 'cancelled')[] = ['ongoing', 'completed', 'cancelled'];
              const currentIndex = tabs.indexOf(activeTab);
              const nextIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
              handleTabChange(tabs[nextIndex]);
            }}>
              <i className="fa-solid fa-chevron-right"></i>
            </button>
          </div>

          <div className="history-content">
            <div className="order-list">
              {displayOrders.length > 0 ? (
                displayOrders.map((order: Order) => (
                  <div key={order.orderId} className="order-card">
                    <div className="order-header">
                      <div className="order-info">
                        <h4 className="order-name">{selectedCanteenName || 'Order'}</h4>
                        <p className="order-date">{formatDate(order.orderTime)}</p>
                      </div>
                    </div>
                    <div className="order-body">
                      <div className="order-items-section">
                        {(order.items || order.orderItems) && (order.items || order.orderItems)!.length > 0 && (
                          <div className="order-items">
                            {(order.items || order.orderItems)!.map((item, index) => (
                              <div key={item.orderItemId || index} className="order-item">
                                {item.menuItem?.name || 'Unknown Item'} {item.quantity || 0}x
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="order-right-section">
                        <div className="order-price">{formatPrice(order.totalPrice)}</div>
                        <div className="order-status">
                          <span className={`status-badge status-${order.status.toLowerCase().replace('_', '-')}`}>
                            {order.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="order-footer">
                      <button 
                        className="reorder-btn"
                        onClick={() => handleReorder(order)}
                      >
                        Reorder
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <p>No {activeTab} orders</p>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Basket Sidebar */}
      <BasketSidebar 
        isOpen={isBasketOpen} 
        onClose={() => setIsBasketOpen(false)}
      />
    </div>
  );
};
