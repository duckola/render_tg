import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { menuService } from '../services/menuService';
import { canteenService } from '../services/canteenService';
import { useCartStore } from '../store/cartStore';
import { MenuItem, Canteen } from '../types';
import { FoodCard } from '../components/FoodCard';
import { MenuHeader } from '../components/MenuHeader';
import { MenuSidebar } from '../components/MenuSidebar';
import { BasketSidebar } from '../components/BasketSidebar';
import { ItemDetailModal } from '../components/ItemDetailModal';
import toast from 'react-hot-toast';
import '../styles/menu.css';

export const Favorites = () => {
  const { addItem } = useCartStore();
  const [selectedCanteenId, setSelectedCanteenId] = useState<number | null>(null);
  const [selectedCanteenName, setSelectedCanteenName] = useState<string>('');
  const [isBasketOpen, setIsBasketOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [favorites, setFavorites] = useState<Set<number>>(() => {
    // Load favorites from localStorage
    const saved = localStorage.getItem('favorites');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  const { data: canteens } = useQuery({
    queryKey: ['canteens'],
    queryFn: canteenService.getAllCanteens,
  });

  // Set default canteen when canteens load
  useEffect(() => {
    if (canteens && canteens.length > 0 && !selectedCanteenId) {
      const firstCanteen = canteens[0];
      setSelectedCanteenId(firstCanteen.canteenId);
      setSelectedCanteenName(firstCanteen.name);
    }
  }, [canteens, selectedCanteenId]);

  const { data: menuItems, isLoading } = useQuery({
    queryKey: ['menuItems'],
    queryFn: menuService.getAllMenuItems,
  });

  // Filter to only show favorite items
  const favoriteItems = useMemo(() => {
    if (!menuItems) return [];
    return menuItems.filter((item: MenuItem) => {
      const isFavorite = favorites.has(item.itemId);
      const matchesCanteen = !selectedCanteenId || item.canteenId === selectedCanteenId;
      return isFavorite && matchesCanteen;
    });
  }, [menuItems, favorites, selectedCanteenId]);

  const handleCardClick = (item: MenuItem) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleQuickAdd = (item: MenuItem) => {
    addItem(item, 1);
    toast.success(`${item.name} added to basket!`);
  };

  const handleToggleFavorite = (itemId: number) => {
    setFavorites((prev) => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(itemId)) {
        newFavorites.delete(itemId);
        toast.success('Removed from favorites');
      } else {
        newFavorites.add(itemId);
        toast.success('Added to favorites');
      }
      // Save to localStorage
      localStorage.setItem('favorites', JSON.stringify(Array.from(newFavorites)));
      return newFavorites;
    });
  };

  if (isLoading) {
    return (
      <div className="menu-page">
        <div style={{ textAlign: 'center', padding: '50px', color: 'white' }}>
          Loading favorites...
        </div>
      </div>
    );
  }

  return (
    <div className="menu-page">
      <MenuHeader 
        isBasketOpen={isBasketOpen}
        onBasketOpen={() => setIsBasketOpen(true)}
      />
      <MenuSidebar 
        selectedCanteenName={selectedCanteenName}
        canteens={canteens || []}
        onCanteenChange={(canteenId: number, canteenName: string) => {
          setSelectedCanteenId(canteenId);
          setSelectedCanteenName(canteenName);
        }}
      />

      <main className="menu-main-content">
        {/* All Favorites Grid */}
        {favoriteItems.length > 0 ? (
          <section className="categorical-dishes">
            <div className="category-holder">
              <div className="dish-grid">
                {favoriteItems.map((item: MenuItem) => (
                  <FoodCard
                    key={item.itemId}
                    item={item}
                    onCardClick={handleCardClick}
                    onAddToCart={handleQuickAdd}
                    isFavorite={favorites.has(item.itemId)}
                    onToggleFavorite={handleToggleFavorite}
                  />
                ))}
              </div>
            </div>
          </section>
        ) : (
          <section className="categorical-dishes">
            <div className="category-holder" style={{ textAlign: 'center', padding: '50px', color: '#550508' }}>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>No favorites yet</h3>
              <p>Start adding items to your favorites by clicking the star icon!</p>
            </div>
          </section>
        )}
      </main>

      {/* Basket Sidebar */}
      <BasketSidebar 
        isOpen={isBasketOpen} 
        onClose={() => setIsBasketOpen(false)}
      />

      {/* Item Detail Modal */}
      {selectedItem && (
        <ItemDetailModal
          item={selectedItem}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedItem(null);
          }}
        />
      )}
    </div>
  );
};

