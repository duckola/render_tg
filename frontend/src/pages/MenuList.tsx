import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { menuService } from '../services/menuService';
import { useAuthStore } from '../store/authStore';
import { MenuItem } from '../types';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export const MenuList = () => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: menuItems, isLoading } = useQuery({
    queryKey: ['menuItems'],
    queryFn: menuService.getAllMenuItems,
  });

  const deleteMutation = useMutation({
    mutationFn: menuService.deleteMenuItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
      toast.success('Menu item deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete menu item');
    },
  });

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center">Loading menu items...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Menu Items</h1>
        {isAdmin() && (
          <button
            onClick={() => navigate('/menu/new')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Add New Item
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menuItems?.map((item: MenuItem) => (
          <div
            key={item.itemId}
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
          >
            {item.imageUrl && (
              <img
                src={item.imageUrl}
                alt={item.name}
                className="w-full h-48 object-cover"
              />
            )}
            <div className="p-4">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{item.name}</h3>
              {item.description && (
                <p className="text-gray-600 text-sm mb-3">{item.description}</p>
              )}
              <div className="flex justify-between items-center">
                <span className="text-2xl font-bold text-indigo-600">
                  ₱{item.price.toFixed(2)}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/menu/${item.itemId}`)}
                    className="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 text-sm"
                  >
                    View
                  </button>
                  {isAdmin() && (
                    <>
                      <button
                        onClick={() => navigate(`/menu/${item.itemId}/edit`)}
                        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item.itemId)}
                        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
              {!item.isAvailable && (
                <span className="inline-block mt-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                  Unavailable
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {menuItems?.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No menu items available.
        </div>
      )}
    </div>
  );
};

