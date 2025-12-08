import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '../services/notificationService';
import { useAuthStore } from '../store/authStore';
import { Notification } from '../types';
import './Notifications.css';
import toast from 'react-hot-toast';

export const Notifications = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications', user?.userId],
    queryFn: () => notificationService.getByUserId(user!.userId),
    enabled: !!user?.userId,
    refetchInterval: 5000, // Refetch every 5 seconds to get new notifications
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationService.markAllAsRead(user!.userId),
    onSuccess: () => {
      toast.success('All notifications marked as read');
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.userId] });
    },
    onError: () => toast.error('Failed to mark notifications as read'),
  });

  // Group notifications by date
  const groupedNotifications = useMemo(() => {
    if (!notifications) return {};

    const groups: Record<string, Notification[]> = {};

    notifications.forEach((notification) => {
      const date = new Date(notification.timestamp);
      const dateKey = date.toLocaleDateString('en-US', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });

      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(notification);
    });

    return groups;
  }, [notifications]);

  const getNotificationIcon = (type?: string) => {
    switch (type) {
      case 'READY_FOR_PICKUP':
        return 'fa-building';
      case 'ORDER_IN_PROGRESS':
        return 'fa-clock';
      case 'ORDER_CONFIRMED':
        return 'fa-check-circle';
      case 'PICKED_UP':
        return 'fa-hand-holding';
      case 'PROMO':
        return 'fa-percent';
      default:
        return 'fa-bell';
    }
  };

  const getNotificationTitle = (message: string, type?: string) => {
    // Extract title from message or use type-based title
    if (type === 'READY_FOR_PICKUP') return 'Ready for Pick-Up';
    if (type === 'ORDER_IN_PROGRESS') return 'Order in Progress';
    if (type === 'ORDER_CONFIRMED') return 'Order Confirmed';
    if (type === 'PICKED_UP') return 'Picked Up';
    if (type === 'PROMO') {
      // Try to extract promo title from message
      const lines = message.split('\n');
      return lines[0] || 'Promotional Deal';
    }
    return 'Notification';
  };

  const getNotificationDescription = (message: string, type?: string) => {
    if (type === 'PROMO') {
      // For promo, return the full message
      return message;
    }
    // For other types, return the message as-is
    return message;
  };

  if (isLoading) {
    return (
      <div className="notifications-page">
        <div className="loading-state">Loading notifications...</div>
      </div>
    );
  }

  const dateKeys = Object.keys(groupedNotifications).sort((a, b) => {
    // Sort dates descending (newest first)
    return new Date(b).getTime() - new Date(a).getTime();
  });

  return (
    <div className="notifications-page">
      <div className="notifications-container">
        <div className="notifications-header">
          <h1 className="notifications-title">Notifications</h1>
          {notifications && notifications.length > 0 && (
            <button
              className="mark-all-read-btn"
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
            >
              Mark All As Read
            </button>
          )}
        </div>

        <div className="notifications-content">
          {dateKeys.length > 0 ? (
            dateKeys.map((dateKey) => (
              <div key={dateKey} className="notification-group">
                <div className="date-header">{dateKey}</div>
                {groupedNotifications[dateKey].map((notification) => (
                  <div
                    key={notification.notificationId}
                    className={`notification-item ${notification.isRead ? 'read' : 'unread'}`}
                  >
                    <div className="notification-icon">
                      <i className={`fa-solid ${getNotificationIcon(notification.type)}`}></i>
                    </div>
                    <div className="notification-content">
                      <div className="notification-title">
                        {getNotificationTitle(notification.message, notification.type)}
                      </div>
                      <div className="notification-description">
                        {getNotificationDescription(notification.message, notification.type)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))
          ) : (
            <div className="no-notifications">No notifications yet</div>
          )}
        </div>
      </div>
    </div>
  );
};

