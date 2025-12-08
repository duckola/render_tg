import { useQuery } from '@tanstack/react-query';
import { orderService } from '../../services/orderService';
import { inventoryService } from '../../services/inventoryService';
import '../../styles/admin.css';
import './AdminNotifications.css';

interface Notification {
  id: string;
  title: string;
  description: string;
  date: string;
  type: string;
}

export const AdminNotifications = () => {
  const { data: orders } = useQuery({
    queryKey: ['orders'],
    queryFn: orderService.getAllOrders,
  });

  const { data: inventory } = useQuery({
    queryKey: ['inventory'],
    queryFn: inventoryService.getAll,
  });

  // Get order number format
  const getOrderNumber = (orderId: number) => {
    return `#${String(orderId).padStart(5, '0')}`;
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).toUpperCase();
  };

  // Generate notifications from orders and inventory
  const notifications: Notification[] = [];

  // New orders
  const newOrders = orders?.filter((o) => o.status === 'Pending') || [];
  newOrders.forEach((order) => {
    notifications.push({
      id: `order-${order.orderId}`,
      title: `New Order ${getOrderNumber(order.orderId)}`,
      description: `A new order has been placed: ₱${order.totalPrice?.toFixed(2) || '0.00'} - collect items for the customer.`,
      date: formatDate(order.orderTime),
      type: 'NEW_ORDER',
    });
  });

  // Completed orders
  const completedOrders = orders?.filter((o) => o.status === 'Completed') || [];
  completedOrders.slice(0, 5).forEach((order) => {
    notifications.push({
      id: `completed-${order.orderId}`,
      title: `Order ${getOrderNumber(order.orderId)} Completed`,
      description: `Order ${getOrderNumber(order.orderId)} has been completed successfully.`,
      date: formatDate(order.pickupTime || order.orderTime),
      type: 'ORDER_COMPLETED',
    });
  });

  // Low stock alerts
  const lowStockItems = inventory?.filter((item) => item.status === 'Low Stock' || item.status === 'Out of Stock') || [];
  lowStockItems.forEach((item) => {
    notifications.push({
      id: `stock-${item.inventoryId}`,
      title: 'Low Stock Alert',
      description: `${item.itemName} is low in stock - consider restocking soon.`,
      date: formatDate(new Date().toISOString()),
      type: 'LOW_STOCK',
    });
  });

  // Sort by date (newest first)
  notifications.sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
  
  return (
    <div className="admin-notifications-page">
      <h2 className="notifications-page-title">Notification</h2>
      <div className="admin-card notifications-card">
        <div className="notifications-list">
          {notifications.length > 0 ? (
            notifications.map((notification, index) => (
              <div
                key={notification.id}
                className={`notification-card ${index === 1 ? 'selected' : ''}`}
              >
                <div className="notification-card-left">
                  <div className="notification-icon-red">
                    <i className="fa-solid fa-exclamation-circle"></i>
                  </div>
                  <div className="notification-card-content">
                    <h3 className="notification-card-title">{notification.title}</h3>
                    <p className="notification-card-description">{notification.description}</p>
                  </div>
                </div>
                <div className="notification-card-date">{notification.date}</div>
              </div>
            ))
          ) : (
            <div className="no-notifications">No notifications</div>
          )}
        </div>
      </div>
    </div>
  );
};

