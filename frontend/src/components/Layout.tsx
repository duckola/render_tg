import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const { user, logout, isAdmin, isStaff, isCustomer } = useAuthStore();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <Link to="/menu" className="text-xl font-bold text-indigo-600">
                TeknoGrub
              </Link>
              <div className="flex space-x-4">
                <Link
                  to="/menu"
                  className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Menu
                </Link>
                {isCustomer() && (
                  <>
                    <Link
                      to="/cart"
                      className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Cart
                    </Link>
                    <Link
                      to="/orders"
                      className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      My Orders
                    </Link>
                  </>
                )}
                {(isStaff() || isAdmin()) && (
                  <Link
                    to="/orders/manage"
                    className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Manage Orders
                  </Link>
                )}
                {isAdmin() && (
                  <>
                    <Link
                      to="/users"
                      className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Users
                    </Link>
                    <Link
                      to="/payments"
                      className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Payments
                    </Link>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {user && (
                <span className="text-sm text-gray-700">
                  {user.fullName} ({user.roleName})
                </span>
              )}
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main>{children}</main>
    </div>
  );
};

