import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { menuService } from '../../services/menuService';
import { categoryService } from '../../services/categoryService';
import { canteenService } from '../../services/canteenService';
import { inventoryService } from '../../services/inventoryService';
import { MenuItem } from '../../types';
import '../../styles/admin.css';
import './EditMenuItem.css';
import toast from 'react-hot-toast';

export const EditMenuItem = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  // Check if we're on the "new" route - the route doesn't have :id param, so we check the pathname
  const isNew = !id || location.pathname.endsWith('/new');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    categoryId: '',
    canteenId: '',
    isAvailable: true,
    ingredients: '',
    imageUrl: '',
  });

  const [inventoryData, setInventoryData] = useState({
    currentStock: '',
    thresholdLevel: '',
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryService.getAll,
  });

  // Fetch canteens
  const { data: canteens } = useQuery({
    queryKey: ['canteens'],
    queryFn: canteenService.getAllCanteens,
  });

  // Fetch menu item if editing
  const { data: menuItem } = useQuery({
    queryKey: ['menuItem', id],
    queryFn: () => menuService.getMenuItemById(Number(id!)),
    enabled: !isNew && !!id,
  });

  // Fetch inventory if editing
  const { data: inventory } = useQuery({
    queryKey: ['inventory', id],
    queryFn: () => inventoryService.getByItemId(Number(id!)),
    enabled: !isNew && !!id,
  });

  // Update form when menu item loads
  useEffect(() => {
    if (menuItem) {
      setFormData({
        name: menuItem.name || '',
        description: menuItem.description || '',
        price: menuItem.price?.toString() || '',
        categoryId: menuItem.categoryId?.toString() || '',
        canteenId: menuItem.canteenId?.toString() || '',
        isAvailable: menuItem.isAvailable ?? true,
        ingredients: '', // Not stored in MenuItem, would need separate field
        imageUrl: menuItem.imageUrl || '',
      });
      setImagePreview(menuItem.imageUrl || null);
    }
  }, [menuItem]);

  // Update inventory form when inventory loads
  useEffect(() => {
    if (inventory) {
      setInventoryData({
        currentStock: inventory.currentStock?.toString() || '',
        thresholdLevel: inventory.thresholdLevel?.toString() || '',
      });
    }
  }, [inventory]);

  const createMenuItemMutation = useMutation({
    mutationFn: (payload: Partial<MenuItem>) => menuService.createMenuItem(payload),
    onSuccess: async (newItem) => {
      toast.success('Menu item created');
      // Create inventory if stock data provided
      if (inventoryData.currentStock && inventoryData.thresholdLevel) {
        try {
          const stock = inventoryData.currentStock && !Number.isNaN(Number(inventoryData.currentStock)) 
            ? Number.parseInt(inventoryData.currentStock, 10) 
            : 0;
          const threshold = inventoryData.thresholdLevel && !Number.isNaN(Number(inventoryData.thresholdLevel)) 
            ? Number.parseInt(inventoryData.thresholdLevel, 10) 
            : 0;
          if (stock > 0 || threshold > 0) {
            await inventoryService.create({
              itemId: newItem.itemId,
              currentStock: stock,
              thresholdLevel: threshold,
            });
          }
        } catch (error) {
          console.error('Failed to create inventory:', error);
          toast.error('Menu item created but failed to create inventory');
        }
      }
      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      navigate('/admin/inventory');
    },
    onError: (e: any) => {
      console.error('Menu item creation error:', e);
      toast.error(e.response?.data?.message || 'Failed to create menu item');
    },
  });

  const updateMenuItemMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<MenuItem> }) =>
      menuService.updateMenuItem(id, payload),
    onSuccess: async () => {
      toast.success('Menu item updated');
      // Update or create inventory
      if (inventoryData.currentStock && inventoryData.thresholdLevel) {
        try {
          const stock = inventoryData.currentStock && !Number.isNaN(Number(inventoryData.currentStock)) 
            ? Number.parseInt(inventoryData.currentStock, 10) 
            : 0;
          const threshold = inventoryData.thresholdLevel && !Number.isNaN(Number(inventoryData.thresholdLevel)) 
            ? Number.parseInt(inventoryData.thresholdLevel, 10) 
            : 0;
          if (inventory) {
            await inventoryService.update(inventory.inventoryId, {
              itemId: Number(id!),
              currentStock: stock,
              thresholdLevel: threshold,
            });
          } else if (stock > 0 || threshold > 0) {
            await inventoryService.create({
              itemId: Number(id!),
              currentStock: stock,
              thresholdLevel: threshold,
            });
          }
        } catch (error) {
          console.error('Failed to update inventory:', error);
        }
      }
      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      navigate('/admin/inventory');
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to update menu item'),
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // For now, just store the file name or URL
      // In production, you'd upload to a server and get the URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setFormData((prev) => ({ ...prev, imageUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Item name is required');
      return;
    }

    const priceValue = formData.price ? Number.parseFloat(formData.price) : Number.NaN;
    if (!formData.price || Number.isNaN(priceValue) || priceValue <= 0) {
      toast.error('Valid price is required');
      return;
    }

    // Handle categoryId - only include if it's a valid number, otherwise omit it (undefined)
    let categoryId: number | undefined = undefined;
    if (formData.categoryId && formData.categoryId.trim() !== '') {
      const parsed = Number.parseInt(formData.categoryId, 10);
      if (!Number.isNaN(parsed) && parsed > 0) {
        categoryId = parsed;
      }
    }

    // Handle canteenId - only include if it's a valid number, otherwise omit it (undefined)
    let canteenId: number | undefined = undefined;
    if (formData.canteenId && formData.canteenId.trim() !== '') {
      const parsed = Number.parseInt(formData.canteenId, 10);
      if (!Number.isNaN(parsed) && parsed > 0) {
        canteenId = parsed;
      }
    }

    const payload: Partial<MenuItem> = {
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      price: priceValue,
      ...(categoryId !== undefined ? { categoryId } : {}),
      ...(canteenId !== undefined ? { canteenId } : {}),
      isAvailable: formData.isAvailable,
      imageUrl: formData.imageUrl || undefined,
    };

    if (isNew) {
      createMenuItemMutation.mutate(payload);
    } else {
      // Validate id before using it
      if (!id || Number.isNaN(Number(id)) || Number(id) <= 0) {
        console.error('Invalid item id for update:', id);
        toast.error('Invalid item ID');
        return;
      }
      updateMenuItemMutation.mutate({ id: Number(id), payload });
    }
  };

  return (
    <div className="edit-menu-item-page">
      <div className="admin-card edit-item-card">
        <div className="form-header">
          <h1 className="form-title">
            {isNew ? 'Add New Item' : `Edit Item: ${menuItem?.name || ''}`}
          </h1>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={formData.isAvailable}
              onChange={(e) => setFormData((prev) => ({ ...prev, isAvailable: e.target.checked }))}
            />
            <span>Available</span>
          </label>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            {/* Item Name */}
            <div className="form-group full-width">
              <label htmlFor="item-name" className="form-label">
                Item Name
              </label>
              <input
                id="item-name"
                type="text"
                className="form-input"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Biggest Beepstek"
              />
            </div>

            {/* Category */}
            <div className="form-group">
              <label htmlFor="category" className="form-label">
                Category
              </label>
              <select
                id="category"
                className="form-select"
                value={formData.categoryId}
                onChange={(e) => setFormData((prev) => ({ ...prev, categoryId: e.target.value }))}
              >
                <option value="">Select Category</option>
                {categories?.map((cat) => (
                  <option key={cat.categoryId} value={String(cat.categoryId)}>
                    {cat.categoryName}
                  </option>
                ))}
              </select>
            </div>

            {/* Canteen */}
            <div className="form-group">
              <label htmlFor="canteen" className="form-label">
                Canteen
              </label>
              <select
                id="canteen"
                className="form-select"
                value={formData.canteenId}
                onChange={(e) => setFormData((prev) => ({ ...prev, canteenId: e.target.value }))}
              >
                <option value="">Select Canteen</option>
                {canteens?.map((canteen) => (
                  <option key={canteen.canteenId} value={String(canteen.canteenId)}>
                    {canteen.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Price */}
            <div className="form-group">
              <label htmlFor="price" className="form-label">
                Price (₱)
              </label>
              <input
                id="price"
                type="number"
                step="0.01"
                min="0"
                className="form-input"
                value={formData.price}
                onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
                placeholder="0.00"
              />
            </div>

            {/* Description */}
            <div className="form-group full-width">
              <label htmlFor="description" className="form-label">
                Description
              </label>
              <textarea
                id="description"
                className="form-textarea"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the dish..."
                rows={4}
              />
            </div>

            {/* Ingredients */}
            <div className="form-group full-width">
              <label htmlFor="ingredients" className="form-label">
                Ingredients (Comma separated)
              </label>
              <input
                id="ingredients"
                type="text"
                className="form-input"
                value={formData.ingredients}
                onChange={(e) => setFormData((prev) => ({ ...prev, ingredients: e.target.value }))}
                placeholder="e.g. Beef, Onions, Soy Sauce"
              />
            </div>

            {/* Image Upload */}
            <div className="form-group full-width">
              <label htmlFor="image" className="form-label">
                Item Image
              </label>
              <input
                id="image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="file-input"
              />
              <div
                className="image-preview-box"
                style={{
                  backgroundImage: imagePreview ? `url(${imagePreview})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                {!imagePreview && <span>No Image Selected</span>}
              </div>
            </div>

            {/* Inventory Fields */}
            <div className="form-group">
              <label htmlFor="current-stock" className="form-label">
                Current Stock
              </label>
              <input
                id="current-stock"
                type="number"
                min="0"
                className="form-input"
                value={inventoryData.currentStock}
                onChange={(e) =>
                  setInventoryData((prev) => ({ ...prev, currentStock: e.target.value }))
                }
                placeholder="0"
              />
            </div>

            <div className="form-group">
              <label htmlFor="threshold-level" className="form-label">
                Threshold Level
              </label>
              <input
                id="threshold-level"
                type="number"
                min="0"
                className="form-input"
                value={inventoryData.thresholdLevel}
                onChange={(e) =>
                  setInventoryData((prev) => ({ ...prev, thresholdLevel: e.target.value }))
                }
                placeholder="0"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="btn-row">
            <button
              type="button"
              className="btn btn-cancel"
              onClick={() => navigate('/admin/inventory')}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-save"
              disabled={createMenuItemMutation.isPending || updateMenuItemMutation.isPending}
            >
              {createMenuItemMutation.isPending || updateMenuItemMutation.isPending
                ? 'Saving...'
                : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

