import { useState, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { orderService } from '../../services/orderService';
import { notificationService } from '../../services/notificationService';
import { Order } from '../../types';
import '../../styles/admin.css';
import './Orders.css';
import toast from 'react-hot-toast';

export const OrdersPage = () => {
  const queryClient = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'preparing' | 'completed'>('pending');

  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: orderService.getAllOrders,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: number; status: string }) =>
      orderService.updateOrderStatus(orderId, status),
        onSuccess: (updatedOrder) => {
          console.log('Mutation success - Updated order:', updatedOrder);
          console.log('Updated order status:', updatedOrder.status, 'Type:', typeof updatedOrder.status);
          console.log('Status after trim/upper:', (updatedOrder.status || '').trim().toUpperCase());
          
          // Invalidate and refetch orders
          queryClient.invalidateQueries({ queryKey: ['orders'] });
          setSelectedOrder(null);
          
          // Auto-switch to appropriate tab based on new status
          const newStatus = (updatedOrder.status || '').trim().toUpperCase();
          console.log('Checking if status matches preparing:', newStatus, 'in', ['PREPARING', 'ACCEPTED', 'READY'], '=', ['PREPARING', 'ACCEPTED', 'READY'].includes(newStatus));
          if (['PREPARING', 'ACCEPTED', 'READY'].includes(newStatus)) {
            setActiveTab('preparing');
          } else if (['COMPLETED'].includes(newStatus)) {
            setActiveTab('completed');
          }
        },
    onError: (e: any) => {
      console.error('Mutation error:', e);
      toast.error(e.response?.data?.message || 'Failed to update order status');
    },
  });

  // Filter orders by status (handling case sensitivity and trimming)
  const pendingOrders = useMemo(() => {
    if (!orders) return [];
    return orders.filter((o) => {
      const status = (o.status || '').trim().toUpperCase();
      return ['PENDING', 'PENDING_PAYMENT'].includes(status);
    });
  }, [orders]);

  const preparingOrders = useMemo(() => {
    if (!orders) return [];
    return orders.filter((o) => {
      const status = (o.status || '').trim().toUpperCase();
      return ['PREPARING', 'ACCEPTED', 'READY'].includes(status);
    });
  }, [orders]);

  const completedOrders = useMemo(() => {
    if (!orders) return [];
    return orders.filter((o) => {
      const status = (o.status || '').trim().toUpperCase();
      return ['COMPLETED'].includes(status);
    });
  }, [orders]);

  // Debug logging
  if (orders) {
    console.log('All Orders:', orders);
    const statusMap = orders.map(o => ({ id: o.orderId, status: o.status, statusType: typeof o.status, statusLength: o.status?.length }));
    console.log('Order Statuses (detailed):', statusMap);
    console.log('Pending Orders:', pendingOrders.map(o => ({ id: o.orderId, status: o.status })));
    console.log('Preparing Orders:', preparingOrders.map(o => ({ id: o.orderId, status: o.status })));
    console.log('Completed Orders:', completedOrders.map(o => ({ id: o.orderId, status: o.status })));
    
    // Check for any orders that should be in preparing but aren't
    const allStatuses = orders.map(o => o.status?.trim().toUpperCase()).filter(Boolean);
    const uniqueStatuses = [...new Set(allStatuses)];
    console.log('All unique status values:', uniqueStatuses);
    console.log('Expected preparing statuses:', ['PREPARING', 'ACCEPTED', 'READY']);
  }

  // Get order number (TG-XXXX format)
  const getOrderNumber = (orderId: number) => {
    return `TG-${String(orderId).padStart(4, '0')}`;
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleStatusChange = (orderId: number, newStatus: string, order: Order) => {
    const statusUpper = newStatus.toUpperCase();
    console.log('Changing order status:', { orderId, from: order.status, to: statusUpper });
    
    // Update order status
    updateStatusMutation.mutate(
      { orderId, status: statusUpper },
      {
        onSuccess: async (updatedOrder) => {
          console.log('Order status updated successfully:', updatedOrder);
          // If status is READY, send notification to customer
          if (statusUpper === 'READY' && order.userId) {
            try {
              const orderNumber = getOrderNumber(orderId);
              await notificationService.create({
                userId: order.userId,
                message: `Your order ${orderNumber} is ready for pickup!`,
                type: 'READY_FOR_PICKUP',
              });
              toast.success('Order marked as ready and customer notified');
            } catch (error: any) {
              console.error('Failed to send notification:', error);
              toast.error('Order updated but failed to notify customer');
            }
          } else {
            toast.success('Order status updated');
          }
        },
        onError: (error: any) => {
          console.error('Failed to update order status:', error);
        },
      }
    );
  };

  // Display orders based on active tab
  const displayOrders = useMemo(() => {
    if (!orders) return [];
    
    switch (activeTab) {
      case 'pending':
        return pendingOrders;
      case 'preparing':
        return preparingOrders;
      case 'completed':
        return completedOrders;
      default:
        return pendingOrders;
    }
  }, [orders, activeTab, pendingOrders, preparingOrders, completedOrders]);

  if (isLoading) return <div className="loading-state">Loading orders...</div>;

  return (
    <div className="orders-page">
      {/* Statistics Cards / Tabs */}
      <div className="order-stats">
        <div 
          className={`stat-card ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => { setActiveTab('pending'); setSelectedOrder(null); }}
        >
          <div className="stat-icon">
            <i className="fa-solid fa-file-lines"></i>
          </div>
          <div className="stat-content">
            <div className="stat-label">New Orders</div>
            <div className="stat-value">{pendingOrders.length}</div>
          </div>
        </div>
        <div 
          className={`stat-card ${activeTab === 'preparing' ? 'active' : ''}`}
          onClick={() => { setActiveTab('preparing'); setSelectedOrder(null); }}
        >
          <div className="stat-icon">
            <i className="fa-solid fa-clock"></i>
          </div>
          <div className="stat-content">
            <div className="stat-label">Preparing</div>
            <div className="stat-value">{preparingOrders.length}</div>
          </div>
        </div>
        <div 
          className={`stat-card ${activeTab === 'completed' ? 'active' : ''}`}
          onClick={() => { setActiveTab('completed'); setSelectedOrder(null); }}
        >
          <div className="stat-icon">
            <i className="fa-solid fa-check"></i>
          </div>
          <div className="stat-content">
            <div className="stat-label">Completed</div>
            <div className="stat-value">{completedOrders.length}</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="orders-content">
        {/* Order List */}
        <div className="order-list-card">
          <h3 className="card-title">Order List</h3>
          <div className="order-cards-container">
            {displayOrders.length > 0 ? (
              displayOrders.map((order) => (
                <div
                  key={order.orderId}
                  className={`order-card ${selectedOrder?.orderId === order.orderId ? 'selected' : ''}`}
                  onClick={() => setSelectedOrder(order)}
                >
                  <div className="order-card-header">
                    <span className="order-number">{getOrderNumber(order.orderId)}</span>
                    <span className={`order-status status-${order.status.toLowerCase()}`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="order-card-customer">
                    {order.user?.fullName || `User ${order.userId}`}
                  </div>
                </div>
              ))
            ) : (
              <div className="no-orders">No orders found</div>
            )}
          </div>
        </div>

        {/* Order Details */}
        <div className="order-details-card">
          <h3 className="card-title">Order Details</h3>
          {selectedOrder ? (
            <div className="order-details-content">
              <div className="order-details-header">
                <span className="order-number-large">{getOrderNumber(selectedOrder.orderId)}</span>
                <span className="order-customer-name">
                  {selectedOrder.user?.fullName || `User ${selectedOrder.userId}`}
                </span>
              </div>

              <div className="order-items-section">
                <h4>Items:</h4>
                <ul className="order-items-list">
                  {(selectedOrder.orderItems || selectedOrder.items)?.map((item, idx) => (
                    <li key={item.orderItemId || idx}>
                      {item.quantity}x {item.menuItem?.name || `Item ${item.itemId}`}
                      {item.note && <span className="item-note"> ({item.note})</span>}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="order-info-section">
                <div className="info-row">
                  <span className="info-label">Payment:</span>
                  <span className="info-value">{selectedOrder.paymentMethod || 'Cash'}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Pickup:</span>
                  <span className="info-value">Main Canteen</span>
                </div>
              </div>

              {/* Action Buttons */}
              {['PENDING', 'pending', 'PENDING_PAYMENT', 'pending_payment'].includes((selectedOrder.status || '').trim()) && (
                <div className="order-actions">
                  <button
                    className="btn-accept"
                    onClick={() => handleStatusChange(selectedOrder.orderId, 'PREPARING', selectedOrder)}
                    disabled={updateStatusMutation.isPending}
                  >
                    Accept
                  </button>
                  <button
                    className="btn-decline"
                    onClick={() => handleStatusChange(selectedOrder.orderId, 'DECLINED', selectedOrder)}
                    disabled={updateStatusMutation.isPending}
                  >
                    Decline
                  </button>
                </div>
              )}

              {['PREPARING', 'preparing', 'ACCEPTED', 'accepted'].includes((selectedOrder.status || '').trim()) && (
                <div className="order-actions">
                  <button
                    className="btn-ready"
                    onClick={() => handleStatusChange(selectedOrder.orderId, 'READY', selectedOrder)}
                    disabled={updateStatusMutation.isPending}
                  >
                    Ready
                  </button>
                  <button
                    className="btn-complete"
                    onClick={() => handleStatusChange(selectedOrder.orderId, 'COMPLETED', selectedOrder)}
                    disabled={updateStatusMutation.isPending}
                  >
                    Complete
                  </button>
                </div>
              )}

              {['READY', 'ready'].includes((selectedOrder.status || '').trim()) && (
                <div className="order-actions">
                  <button
                    className="btn-complete"
                    onClick={() => handleStatusChange(selectedOrder.orderId, 'COMPLETED', selectedOrder)}
                    disabled={updateStatusMutation.isPending}
                  >
                    Complete
                  </button>
                </div>
              )}

              {['COMPLETED', 'completed'].includes((selectedOrder.status || '').trim()) && (
                <div className="order-completed-info">
                  <p>
                    Date Completed: {selectedOrder.pickupTime ? formatDate(selectedOrder.pickupTime) : formatDate(selectedOrder.orderTime)}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="no-selection">Select an order to view details</div>
          )}
        </div>
      </div>
    </div>
  );
};

