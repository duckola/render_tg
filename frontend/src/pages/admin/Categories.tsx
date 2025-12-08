import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { categoryService } from '../../services/categoryService';
import { Category } from '../../types';
import { useNavigate } from 'react-router-dom';
import { ConfirmDeleteModal } from '../../components/ConfirmDeleteModal';
import '../../styles/admin.css';
import './Categories.css';
import toast from 'react-hot-toast';

export const Categories = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; category: Category | null }>({
    isOpen: false,
    category: null,
  });

  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryService.getAll,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => categoryService.delete(id),
    onSuccess: () => {
      toast.success('Category deleted');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setDeleteModal({ isOpen: false, category: null });
    },
    onError: (e: any) => {
      toast.error(e.response?.data?.message || 'Failed to delete category');
      setDeleteModal({ isOpen: false, category: null });
    },
  });

  const filtered = useMemo(() => {
    if (!categories) return [];
    return categories.filter((cat) => cat.categoryName.toLowerCase().includes(search.toLowerCase()));
  }, [categories, search]);

  const handleDelete = (cat: Category) => {
    setDeleteModal({ isOpen: true, category: cat });
  };

  const confirmDelete = () => {
    if (deleteModal.category) {
      deleteMutation.mutate(deleteModal.category.categoryId);
    }
  };

  if (isLoading) return <div className="loading-state">Loading categories...</div>;

  return (
    <div className="categories-page">
      <div className="cat-header">
          <h2 className="cat-title">Category Management</h2>
        </div>
      <div className="admin-card">        
        <div className="toolbar">
          <div className="search-container">
            <i className="fa-solid fa-search search-icon"></i>
            <input
              className="search-input"
              placeholder="Filter by Category Name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="btn-add" onClick={() => navigate('/admin/categories/new')}>
            <i className="fa-solid fa-plus"></i> Add New Category
          </button>
        </div>

        <div className="categories-list">
          {filtered.length > 0 ? (
            filtered.map((cat) => (
              <article key={cat.categoryId} className="category-card">
                <div className="category-header">
                  <h2 className="category-title">{cat.categoryName}</h2>
                </div>
                <div className="category-body">
                  <p className="category-count">{cat.itemCount ?? 0} Items</p>
                </div>
                <div className="category-actions">
                  <button
                    className="action-link"
                    onClick={() => navigate(`/admin/categories/edit/${cat.categoryId}`)}
                  >
                    Edit
                  </button>
                  <span className="action-separator">|</span>
                  <button className="action-link delete-link" onClick={() => handleDelete(cat)}>
                    Delete
                  </button>
                </div>
              </article>
            ))
          ) : (
            <p className="no-categories">No categories found.</p>
          )}
        </div>
      </div>
      
      <ConfirmDeleteModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, category: null })}
        onConfirm={confirmDelete}
        title="Delete Category"
        message="Are you sure you want to delete this category?"
        itemName={deleteModal.category?.categoryName}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};
