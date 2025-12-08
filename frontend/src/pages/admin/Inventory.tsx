import { useState, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { inventoryService } from '../../services/inventoryService';
import { Inventory } from '../../types';
import { useNavigate } from 'react-router-dom';
import { ConfirmDeleteModal } from '../../components/ConfirmDeleteModal';
import '../../styles/admin.css';
import './Inventory.css';
import toast from 'react-hot-toast';

export const InventoryPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; item: Inventory | null }>({
    isOpen: false,
    item: null,
  });

  const { data: inventory, isLoading } = useQuery({
    queryKey: ['inventory'],
    queryFn: inventoryService.getAll,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => inventoryService.delete(id),
    onSuccess: () => {
      toast.success('Inventory item deleted');
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setDeleteModal({ isOpen: false, item: null });
    },
    onError: (e: any) => {
      toast.error(e.response?.data?.message || 'Failed to delete inventory item');
      setDeleteModal({ isOpen: false, item: null });
    },
  });

  const filtered = useMemo(() => {
    if (!inventory) return [];
    return inventory.filter((item) =>
      item.itemName.toLowerCase().includes(search.toLowerCase())
    );
  }, [inventory, search]);

  const handleDelete = (item: Inventory) => {
    setDeleteModal({ isOpen: true, item });
  };

  const confirmDelete = () => {
    if (deleteModal.item) {
      deleteMutation.mutate(deleteModal.item.inventoryId);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Stock':
        return '#2e7d32';
      case 'Low Stock':
        return '#ff9800';
      case 'Out of Stock':
        return '#c62828';
      default:
        return '#666';
    }
  };

  if (isLoading) return <div className="loading-state">Loading inventory...</div>;

  return (
    <div className="inventory-page">
      <div className="inventory-header">
          <h2 className="inventory-title">Inventory Management</h2>
        </div>
        
      <div className="admin-card">
        <div className="inventory-toolbar">
          <div className="search-container">
            <i className="fa-solid fa-search search-icon"></i>
            <input
              className="search-input"
              placeholder="Search inventory items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="btn-add-item" onClick={() => navigate('/admin/inventory/new')}>
            <i className="fa-solid fa-plus"></i> Add New Item
          </button>
        </div>

        <div className="inventory-table-container">
          <table className="inventory-table">
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Current Stock</th>
                <th>Threshold Level</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? (
                filtered.map((item) => (
                  <tr key={item.inventoryId}>
                    <td className="item-name-cell">{item.itemName}</td>
                    <td>{item.currentStock}</td>
                    <td>{item.thresholdLevel}</td>
                    <td>
                      <span
                        className="status-badge"
                        style={{ color: getStatusColor(item.status) }}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="action-btn edit-btn"
                          onClick={() => navigate(`/admin/inventory/edit/${item.itemId}`)}
                          title="Edit"
                        >
                          <i className="fa-solid fa-pencil"></i>
                        </button>
                        <button
                          className="action-btn delete-btn"
                          onClick={() => handleDelete(item)}
                          title="Delete"
                        >
                          <i className="fa-solid fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="no-data">
                    No inventory items found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <ConfirmDeleteModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, item: null })}
        onConfirm={confirmDelete}
        title="Delete Inventory Item"
        message="Are you sure you want to delete the inventory for this item?"
        itemName={deleteModal.item?.itemName}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

