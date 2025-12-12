import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '../../services/notificationService';
import { useAuthStore } from '../../store/authStore';
import { Notification } from '../../types';
import '../../styles/admin.css';
import './AdminNotifications.css';
import toast from 'react-hot-toast';

export const AdminNotifications = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications', user?.userId],
    queryFn: () => notificationService.getByUserId(user!.userId),
    enabled: !!user?.userId,
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationService.markAllAsRead(user!.userId),
    onSuccess: () => {
      toast.success('All notifications marked as read');
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.userId] });
    },
    onError: () => toast.error('Failed to mark notifications as read'),
  });

  const getNotificationIcon = (type?: string) => {
    switch (type) {
      case 'ORDER_READY':
        return 'fa-check-circle';
      case 'ORDER_CONFIRMED':
        return 'fa-check-circle';
      case 'NEW_ORDER':
        return 'fa-shopping-cart';
      case 'LOW_STOCK':
        return 'fa-exclamation-triangle';
      case 'OUT_OF_STOCK':
        return 'fa-times-circle';
      default:
        return 'fa-bell';
    }
  };

  const getNotificationTitle = (type?: string) => {
    switch (type) {
      case 'ORDER_READY':
        return 'Order Ready';
      case 'ORDER_CONFIRMED':
        return 'Order Confirmed';
      case 'NEW_ORDER':
        return 'New Order';
      case 'LOW_STOCK':
        return 'Low Stock Alert';
      case 'OUT_OF_STOCK':
        return 'Out of Stock';
      default:
        return 'Notification';
    }
  };

  // Format date
  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).toUpperCase();
  };

  // Sort notifications by date (newest first)
  const sortedNotifications = notifications 
    ? [...notifications].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    : [];
  
  return (
    <div className="admin-notifications-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 className="notifications-page-title">Notifications</h2>
        {sortedNotifications.length > 0 && (
          <button
            onClick={() => markAllAsReadMutation.mutate()}
            disabled={markAllAsReadMutation.isPending}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#666',
              cursor: 'pointer',
              textDecoration: 'underline',
              fontSize: '0.9rem'
            }}
          >
            Mark All As Read
          </button>
        )}
      </div>
      <div className="admin-card notifications-card">
        <div className="notifications-list">
          {isLoading ? (
            <div className="no-notifications">Loading notifications...</div>
          ) : sortedNotifications.length > 0 ? (
            sortedNotifications.map((notification, index) => (
              <div
                key={notification.notificationId}
                className={`notification-card ${!notification.isRead ? 'unread' : ''} ${index === 0 ? 'selected' : ''}`}
              >
                <div className="notification-card-left">
                  <div className={`notification-icon-red ${notification.type === 'OUT_OF_STOCK' ? 'out-of-stock' : ''}`}>
                    <i className={`fa-solid ${getNotificationIcon(notification.type)}`}></i>
                  </div>
                  <div className="notification-card-content">
                    <h3 className="notification-card-title">{getNotificationTitle(notification.type)}</h3>
                    <p className="notification-card-description">{notification.message}</p>
                  </div>
                </div>
                <div className="notification-card-date">{formatDate(notification.timestamp)}</div>
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

