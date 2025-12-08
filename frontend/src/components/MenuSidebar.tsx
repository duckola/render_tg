import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useState, useEffect } from 'react';
import { Canteen } from '../types';

interface MenuSidebarProps {
  selectedCanteenName: string;
  canteens: Canteen[];
  onCanteenChange: (canteenId: number, canteenName: string) => void;
}

export const MenuSidebar = ({ selectedCanteenName, canteens, onCanteenChange }: MenuSidebarProps) => {
  const { user } = useAuthStore();
  const location = useLocation();
  const [isCanteenOpen, setIsCanteenOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isCanteenOpen && !target.closest('.canteen-selection')) {
        setIsCanteenOpen(false);
      }
    };

    if (isCanteenOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isCanteenOpen]);

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="menu-sidebar">
      <div className="sidebar-user">
        <p className="sidebar-name">{user?.fullName || 'Guest'}</p>
        <p className="sidebar-id">{user?.schoolId || 'N/A'}</p>
      </div>

      <div className={`canteen-selection ${isCanteenOpen ? 'open' : ''}`}>
        <div className="canteen-box" onClick={() => setIsCanteenOpen(!isCanteenOpen)}>
          <div className="canteen-left">
            <i className="fa-solid fa-store canteen-icon"></i>
            <span className="canteen-text">{selectedCanteenName || 'Select Canteen'}</span>
          </div>
          <i className="fa-solid fa-chevron-down canteen-arrow"></i>
        </div>

        <div className="canteen-dropdown">
          {canteens.length > 0 ? (
            canteens.map((canteen) => (
              <div
                key={canteen.canteenId}
                className="canteen-option"
                onClick={() => {
                  onCanteenChange(canteen.canteenId, canteen.name);
                  setIsCanteenOpen(false);
                }}
              >
                {canteen.name}
              </div>
            ))
          ) : (
            <div className="canteen-option" style={{ color: '#999', cursor: 'default' }}>
              No canteens available
            </div>
          )}
        </div>
      </div>

      <div className="menu-section">
        <nav>
          <ul>
            <li className={isActive('/menu') ? 'active' : ''}>
              <Link to="/menu">
                <i className="fa-solid fa-utensils"></i> Menu
              </Link>
            </li>
            <li className={isActive('/favorites') ? 'active' : ''}>
              <Link to="/favorites">
                <i className="fa-solid fa-star"></i> Favorites
              </Link>
            </li>
            <li className={isActive('/promos') ? 'active' : ''}>
              <Link to="/promos">
                <i className="fa-solid fa-tag"></i> Promos
              </Link>
            </li>
            <li className={isActive('/history') ? 'active' : ''}>
              <Link to="/history">
                <i className="fa-solid fa-clock-rotate-left"></i> History
              </Link>
            </li>
            <li className={isActive('/settings') ? 'active' : ''}>
              <Link to="/settings">
                <i className="fa-solid fa-gear"></i> Settings
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
};

