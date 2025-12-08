import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import '../styles/admin.css';

export const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAdmin } = useAuthStore();

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
          <Link to="/admin/orders" className={`admin-nav-link ${isActive('/admin/orders') ? 'active' : ''}`}>
            <i className="fa-solid fa-receipt"></i> Orders
          </Link>
          {isAdmin() && (
            <>
              <Link to="/admin/categories" className={`admin-nav-link ${isActive('/admin/categories') ? 'active' : ''}`}>
                <i className="fa-solid fa-utensils"></i> Menu Categories
              </Link>
              <Link to="/admin/inventory" className={`admin-nav-link ${isActive('/admin/inventory') ? 'active' : ''}`}>
                <i className="fa-solid fa-box"></i> Inventory
              </Link>
              <Link to="/admin/notifications" className={`admin-nav-link ${isActive('/admin/notifications') ? 'active' : ''}`}>
                <i className="fa-solid fa-bell"></i> Notifications
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

