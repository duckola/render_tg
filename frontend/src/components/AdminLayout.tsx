import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { notificationService } from '../services/notificationService';
import { orderService } from '../services/orderService';
import { useAuthStore } from '../store/authStore';
import '../styles/admin.css';

export const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAdmin } = useAuthStore();

  const { data: notifications } = useQuery({
    queryKey: ['notifications', user?.userId],
    queryFn: () => notificationService.getByUserId(user!.userId),
    enabled: !!user?.userId,
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  const { data: orders } = useQuery({
    queryKey: ['allOrders'],
    queryFn: orderService.getAllOrders,
    enabled: !!user?.userId,
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  const unreadCount = notifications?.filter(n => !n.isRead).length || 0;
  
  // Count pending/new orders for badge (case-insensitive)
  const pendingOrdersCount = orders?.filter((o: any) => {
    const status = (o.status || '').trim().toUpperCase();
    return status === 'PENDING' || status === 'PENDING_PAYMENT' || status === 'PAID';
  }).length || 0;
  const isActive = (path: string) => location.pathname.startsWith(path);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <h1>
            <span className="brand-tekno">TEKNO</span>
            <span className="brand-grub">GRUB</span>
          </h1>
        </div>
        <div className="admin-user">
          <div className="user-name">{user?.fullName || 'Admin'}</div>
          <div className="user-id">{user?.schoolId || ''}</div>
        </div>
        <nav className="admin-nav">
          {isAdmin() && (
            <Link to="/admin/dashboard" className={`admin-nav-link ${isActive('/admin/dashboard') ? 'active' : ''}`}>
              <i className="fa-solid fa-chart-line"></i> Dashboard
            </Link>
          )}
          <Link to="/admin/orders" className={`admin-nav-link ${isActive('/admin/orders') ? 'active' : ''}`} style={{ position: 'relative' }}>
            <i className="fa-solid fa-receipt"></i> Orders
            {pendingOrdersCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '8px',
                right: '12px',
                background: '#dc2626',
                color: 'white',
                borderRadius: '50%',
                width: '18px',
                height: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.65rem',
                fontWeight: 'bold',
                border: '2px solid white'
              }}>
                {pendingOrdersCount > 99 ? '99+' : pendingOrdersCount}
              </span>
            )}
          </Link>
          {/* Notifications visible to both staff and admin */}
          <Link to="/admin/notifications" className={`admin-nav-link ${isActive('/admin/notifications') ? 'active' : ''}`} style={{ position: 'relative' }}>
            <i className="fa-solid fa-bell"></i> Notifications
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '8px',
                right: '12px',
                background: '#dc2626',
                color: 'white',
                borderRadius: '50%',
                width: '18px',
                height: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.65rem',
                fontWeight: 'bold',
                border: '2px solid white'
              }}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Link>
          {isAdmin() && (
            <>
              <Link to="/admin/categories" className={`admin-nav-link ${isActive('/admin/categories') ? 'active' : ''}`}>
                <i className="fa-solid fa-utensils"></i> Menu Categories
              </Link>
              <Link to="/admin/inventory" className={`admin-nav-link ${isActive('/admin/inventory') ? 'active' : ''}`}>
                <i className="fa-solid fa-box"></i> Inventory
              </Link>
              <Link to="/admin/settings" className={`admin-nav-link ${isActive('/admin/settings') ? 'active' : ''}`}>
                <i className="fa-solid fa-gear"></i> Settings
              </Link>
            </>
          )}
          <button className="admin-nav-link logout" onClick={handleLogout}>
            <i className="fa-solid fa-right-from-bracket"></i> Logout
          </button>
        </nav>
      </aside>

      <main className="admin-main">
        <div className="admin-header">
          <div className="header-actions" style={{ marginLeft: 'auto' }}>
            <i className="fa-solid fa-bars"></i>
          </div>
        </div>
        <div className="admin-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

