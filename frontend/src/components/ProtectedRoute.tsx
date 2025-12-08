import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

interface ProtectedRouteProps {
  requireAdmin?: boolean;
  requireStaff?: boolean;
  requireCustomer?: boolean;
}

export const ProtectedRoute = ({
  requireAdmin = false,
  requireStaff = false,
  requireCustomer = false,
}: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading, isAdmin, isStaff, isCustomer } = useAuthStore();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !isAdmin()) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (requireStaff && !isStaff() && !isAdmin()) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (requireCustomer && !isCustomer() && !isStaff() && !isAdmin()) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};

