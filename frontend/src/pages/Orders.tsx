import { useQuery } from '@tanstack/react-query';
import { orderService } from '../services/orderService';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';

export const Orders = () => {
  const navigate = useNavigate();
  const { user, isStaff, isAdmin } = useAuthStore();

  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders', user?.userId],
    queryFn: () => orderService.getOrdersByUserId(user!.userId),
    enabled: !!user?.userId,
  });

  if (isLoading) {
    return <div className="p-8 text-center">Loading orders...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
        {(isStaff() || isAdmin()) && (
          <button
            onClick={() => navigate('/orders/manage')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Manage Orders (Staff)
          </button>
        )}
      </div>

      <div className="space-y-4">
        {orders && orders.length > 0 ? (
          orders.map((order) => (
            <div
              key={order.orderId}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate(`/orders/${order.orderId}`)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Order #{order.orderId}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Placed on {new Date(order.orderTime).toLocaleString()}
                  </p>
                  {order.pickupTime && (
                    <p className="text-sm text-gray-500">
                      Pickup: {new Date(order.pickupTime).toLocaleString()}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                      order.status === 'COMPLETED'
                        ? 'bg-green-100 text-green-800'
                        : order.status === 'PREPARING'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {order.status}
                  </span>
                  <p className="text-xl font-bold text-indigo-600 mt-2">
                    ₱{order.totalPrice.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500 mb-4">No orders yet</p>
            <button
              onClick={() => navigate('/menu')}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Browse Menu
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

