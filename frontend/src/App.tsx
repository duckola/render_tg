import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { SignUp } from './pages/SignUp';
import { About } from './pages/About';
import { Menu } from './pages/Menu';
import { Favorites } from './pages/Favorites';
import { Promos } from './pages/Promos';
import { History } from './pages/History';
import { Settings } from './pages/Settings';
import { MenuList } from './pages/MenuList';
import { Cart } from './pages/Cart';
import { Orders } from './pages/Orders';
import { AdminLayout } from './components/AdminLayout';
import { Categories as AdminCategories } from './pages/admin/Categories';
import { AdminDashboard } from './pages/admin/Dashboard';
import { EditCategory } from './pages/admin/EditCategory';
import { InventoryPage } from './pages/admin/Inventory';
import { EditMenuItem } from './pages/admin/EditMenuItem';
import { OrdersPage } from './pages/admin/Orders';
import { AdminNotifications } from './pages/admin/AdminNotifications';
import { AdminSettings } from './pages/admin/Settings';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function AppRoutes() {
  const { loadUser, isAuthenticated, isAdmin, isStaff } = useAuthStore();

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  // Determine redirect path based on user role
  const getRedirectPath = () => {
    if (isAuthenticated) {
      if (isAdmin()) {
        return '/admin/dashboard';
      } else if (isStaff()) {
        return '/admin/orders';
      }
    }
    return '/menu';
  };

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={isAuthenticated ? <Navigate to={getRedirectPath()} /> : <Login />} />
      <Route path="/signup" element={isAuthenticated ? <Navigate to={getRedirectPath()} /> : <SignUp />} />
      <Route path="/about" element={<About />} />

      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/menu" element={<Menu />} />
              <Route path="/favorites" element={<Favorites />} />
              <Route path="/promos" element={<Promos />} />
              <Route path="/history" element={<History />} />
              <Route path="/settings" element={<Settings />} />
        <Route
          path="/menu/admin"
          element={
            <Layout>
              <MenuList />
            </Layout>
          }
        />
        <Route
          path="/cart"
          element={
            <Layout>
              <Cart />
            </Layout>
          }
        />
        <Route
          path="/orders"
          element={
            <Layout>
              <Orders />
            </Layout>
          }
        />
      </Route>

      {/* Staff routes - Order management only */}
      <Route element={<ProtectedRoute requireStaff />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin/orders" element={<OrdersPage />} />
        </Route>
      </Route>

      {/* Admin routes - Full access */}
      <Route element={<ProtectedRoute requireAdmin />}>
        <Route
          path="/users"
          element={
            <Layout>
              <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold">User Management (Admin Only)</h1>
                <p className="mt-4 text-gray-600">User management page coming soon...</p>
              </div>
            </Layout>
          }
        />
        <Route
          path="/payments"
          element={
            <Layout>
              <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold">Payment Management (Admin Only)</h1>
                <p className="mt-4 text-gray-600">Payment management page coming soon...</p>
              </div>
            </Layout>
          }
        />
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/categories" element={<AdminCategories />} />
          <Route path="/admin/categories/new" element={<EditCategory />} />
          <Route path="/admin/categories/edit/:id" element={<EditCategory />} />
          <Route path="/admin/inventory" element={<InventoryPage />} />
          <Route path="/admin/inventory/new" element={<EditMenuItem />} />
          <Route path="/admin/inventory/edit/:id" element={<EditMenuItem />} />
          <Route path="/admin/orders" element={<OrdersPage />} />
          <Route path="/admin/notifications" element={<AdminNotifications />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
        </Route>
      </Route>

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
        <Toaster position="top-right" />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;

