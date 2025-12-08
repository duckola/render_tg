import { useMemo, useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '../services/notificationService';
import { useAuthStore } from '../store/authStore';
import { Notification } from '../types';
import './NotificationsModal.css';
import toast from 'react-hot-toast';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  anchorElement?: HTMLElement | null;
}

export const NotificationsModal = ({ isOpen, onClose, anchorElement }: NotificationsModalProps) => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications', user?.userId],
    queryFn: () => notificationService.getByUserId(user!.userId),
    enabled: !!user?.userId && isOpen,
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
    const dateMap: Record<string, Date> = {}; // Store actual dates for sorting

    notifications.forEach((notification) => {
      const date = new Date(notification.timestamp);
      const weekday = date.toLocaleDateString('en-US', { weekday: 'short' });
      const day = date.getDate().toString().padStart(2, '0');
      const month = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
      const year = date.getFullYear();
      const dateKey = `${weekday}, ${day} ${month} ${year}`;

      if (!groups[dateKey]) {
        groups[dateKey] = [];
        dateMap[dateKey] = date;
      }
      groups[dateKey].push(notification);
    });

    // Sort groups by date (most recent first)
    const sortedGroups: Record<string, Notification[]> = {};
    Object.keys(groups)
      .sort((a, b) => dateMap[b].getTime() - dateMap[a].getTime())
      .forEach((key) => {
        sortedGroups[key] = groups[key];
      });

    return sortedGroups;
  }, [notifications]);

  const getNotificationIcon = (type?: string) => {
    switch (type) {
      case 'READY_FOR_PICKUP':
        return 'fa-check-circle';
      case 'ORDER_IN_PROGRESS':
        return 'fa-clock';
      case 'ORDER_CONFIRMED':
        return 'fa-check-circle';
      case 'PICKED_UP':
        return 'fa-bag-shopping';
      case 'PROMO':
        return 'fa-mug-hot';
      default:
        return 'fa-bell'; // Default to bell icon
    }
  };

  const getNotificationTitle = (message: string, type?: string) => {
    if (type === 'READY_FOR_PICKUP') return 'Ready for Pick-Up';
    if (type === 'ORDER_IN_PROGRESS') return 'Order in Progress';
    if (type === 'ORDER_CONFIRMED') return 'Order Confirmed';
    if (type === 'PICKED_UP') return 'Picked Up';
    if (type === 'PROMO') {
      const lines = message.split('\n');
      return lines[0] || 'Promotional Deal';
    }
    return 'Notification';
  };

  const getNotificationDescription = (message: string, type?: string) => {
    if (type === 'PROMO') {
      return message;
    }
    return message;
  };

  const [position, setPosition] = useState<{ top: number; right: number } | null>(null);

  // Calculate position relative to anchor element
  useEffect(() => {
    if (!isOpen) {
      setPosition(null);
      return;
    }

    if (!anchorElement) {
      // Fallback position if anchor is not available
      setPosition({ top: 60, right: 25 });
      return;
    }

    const updatePosition = () => {
      const rect = anchorElement.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 10,
        right: window.innerWidth - rect.right,
      });
    };

    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
      updatePosition();
    });
    
    // Update on scroll and resize
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen, anchorElement]);

  if (!isOpen) return null;
  
  // Use fallback position if calculation hasn't completed yet
  const modalPosition = position || { top: 60, right: 25 };

  const dateKeys = Object.keys(groupedNotifications);

  return (
    <>
      <div className="notifications-modal-overlay" onClick={onClose} />
      <div 
        className="notifications-modal-container" 
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'fixed',
          top: `${modalPosition.top}px`,
          right: `${modalPosition.right}px`,
        }}
      >
        <div className="notifications-modal-header">
          <h1 className="notifications-modal-title">Notifications</h1>
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

        <div className="notifications-modal-content">
          {isLoading ? (
            <div className="loading-state">Loading notifications...</div>
          ) : dateKeys.length > 0 ? (
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
    </>
  );
};

