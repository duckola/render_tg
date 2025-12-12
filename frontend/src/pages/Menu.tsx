import { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { menuService } from '../services/menuService';
import { categoryService } from '../services/categoryService';
import { canteenService } from '../services/canteenService';
import { cartService } from '../services/cartService';
import { useAuthStore } from '../store/authStore';
import { MenuItem, Category, Canteen } from '../types';
import { FoodCard } from '../components/FoodCard';
import { MenuHeader } from '../components/MenuHeader';
import { MenuSidebar } from '../components/MenuSidebar';
import { BasketSidebar } from '../components/BasketSidebar';
import { ItemDetailModal } from '../components/ItemDetailModal';
import toast from 'react-hot-toast';
import '../styles/menu.css';

export const Menu = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedCanteenId, setSelectedCanteenId] = useState<number | null>(null);
  const [selectedCanteenName, setSelectedCanteenName] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBasketOpen, setIsBasketOpen] = useState(false);
  const [favorites, setFavorites] = useState<Set<number>>(() => {
    const saved = localStorage.getItem('favorites');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  // Cart item count is now handled in MenuHeader

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

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryService.getAll,
  });

  const { data: popularItems, isLoading: isLoadingPopular } = useQuery({
    queryKey: ['popularItems'],
    queryFn: () => menuService.getPopularMenuItems(4),
  });

  // Filter menu items
  const filteredItems = useMemo(() => {
    if (!menuItems) return [];
    return menuItems.filter((item: MenuItem) => {
      const searchLower = searchQuery.trim().toLowerCase();
      const matchesSearch = searchQuery.trim() === '' || 
        item.name.toLowerCase().includes(searchLower) ||
        (item.description && item.description.toLowerCase().includes(searchLower));
      const matchesCategory =
        selectedCategory === 'All' ||
        !selectedCategory ||
        (item.categoryId &&
          categories?.find((c: Category) => c.categoryId === item.categoryId)?.categoryName === selectedCategory);
      const matchesCanteen = !selectedCanteenId || item.canteenId === selectedCanteenId;
      // Only show available items
      return matchesSearch && matchesCategory && matchesCanteen && (item.isAvailable !== false);
    });
  }, [menuItems, searchQuery, selectedCategory, selectedCanteenId, categories]);

  // Popular items are now fetched from the API based on actual order data

  // Category carousel scroll functionality
  const categoryContainerRef = useRef<HTMLDivElement>(null);
  
  const scrollCategories = (direction: 'left' | 'right') => {
    if (categoryContainerRef.current) {
      const container = categoryContainerRef.current;
      const buttonWidth = 200; // Approximate width of each category button including gap
      const scrollAmount = buttonWidth; // Scroll by one button width
      
      const currentScroll = container.scrollLeft;
      const maxScroll = container.scrollWidth - container.clientWidth;
      
      let targetScroll: number;
      if (direction === 'left') {
        targetScroll = Math.max(0, currentScroll - scrollAmount);
      } else {
        targetScroll = Math.min(maxScroll, currentScroll + scrollAmount);
      }
      
      container.scrollTo({
        left: targetScroll,
        behavior: 'smooth',
      });
    }
  };
  
  // Handle manual category click
  const handleCategoryClick = (categoryName: string) => {
    setSelectedCategory(categoryName);
    // Scroll the clicked category to center, but handle edge cases
    if (categoryContainerRef.current) {
      const container = categoryContainerRef.current;
      const buttons = container.querySelectorAll('.category');
      const maxScroll = container.scrollWidth - container.clientWidth;
      
      buttons.forEach((button) => {
        const buttonElement = button as HTMLButtonElement;
        if (buttonElement.textContent?.trim() === categoryName) {
          const isLastButton = buttonElement === buttons[buttons.length - 1];
          const isFirstButton = buttonElement === buttons[0];
          
          if (isLastButton) {
            // For the last button, scroll to the end
            container.scrollTo({
              left: maxScroll,
              behavior: 'smooth',
            });
          } else if (isFirstButton) {
            // For the first button, scroll to the start
            container.scrollTo({
              left: 0,
              behavior: 'smooth',
            });
          } else {
            const containerRect = container.getBoundingClientRect();
            const buttonRect = buttonElement.getBoundingClientRect();
            const scrollLeft = container.scrollLeft;
            const buttonCenterX = buttonRect.left + buttonRect.width / 2 - containerRect.left + scrollLeft;
            const containerCenterX = container.offsetWidth / 2;
            let targetScroll = scrollLeft + (buttonCenterX - containerCenterX);
            
            targetScroll = Math.max(0, Math.min(maxScroll, targetScroll));
            
            container.scrollTo({
              left: targetScroll,
              behavior: 'smooth',
            });
          }
        }
      });
    }
  };

  const handleCardClick = (item: MenuItem) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleQuickAdd = async (item: MenuItem) => {
    if (!user) {
      toast.error('Please log in to add items to cart');
      return;
    }
    try {
      await cartService.addItemToCart(user.userId, item.itemId, 1);
      queryClient.invalidateQueries({ queryKey: ['cart', user.userId] });
      toast.success(`${item.name} added to basket!`);
    } catch (error: any) {
      console.error('Add to cart error:', error);
      toast.error(error?.response?.data?.message || error?.message || 'Failed to add item to cart');
    }
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
          Loading menu...
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

      {/* Main Content */}
      <main className="menu-main-content">
        <div className="menu-topbar">
          <input
            type="text"
            placeholder="Search menu items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.currentTarget.blur();
              }
            }}
          />
          <button 
            onClick={() => {
              if (searchQuery.trim()) {
                setSearchQuery('');
              }
            }}
            title={searchQuery.trim() ? 'Clear search' : 'Search'}
          >
            {searchQuery.trim() ? (
              <i className="fa-solid fa-xmark"></i>
            ) : (
              <i className="fa-solid fa-magnifying-glass"></i>
            )}
            {searchQuery.trim() ? ' Clear' : ' Search'}
          </button>
        </div>

        {/* Popular Section */}
        {!isLoadingPopular && popularItems && popularItems.length > 0 && (
          <section className="popular-section">
            <h3>Most Popular</h3>
            <div className="popular-holder">
              <div className="scroll-container">
                {popularItems.map((item: MenuItem) => (
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
        )}

        {/* Category Section */}
        <section className="categorical-dishes">
          <div className="category-header">
            <button className="arrow-btn" onClick={() => scrollCategories('left')}>
              <i className="fa-solid fa-chevron-left"></i>
            </button>
            <div 
              className="categories" 
              ref={categoryContainerRef}
            >
              <button
                className={`category ${selectedCategory === 'All' ? 'active' : ''}`}
                onClick={() => handleCategoryClick('All')}
              >
                All
              </button>
              {categories && categories.length > 0 ? (
                categories.map((cat) => (
                  <button
                    key={cat.categoryId}
                    className={`category ${selectedCategory === cat.categoryName ? 'active' : ''}`}
                    onClick={() => handleCategoryClick(cat.categoryName)}
                  >
                    {cat.categoryName}
                  </button>
                ))
              ) : (
                <div style={{ color: 'white', padding: '10px 20px' }}>No categories available</div>
              )}
            </div>
            <button className="arrow-btn" onClick={() => scrollCategories('right')}>
              <i className="fa-solid fa-chevron-right"></i>
            </button>
          </div>

          {/* Single container for categorical items */}
          <div className="category-holder">
            <div className="dish-grid">
              {filteredItems.length > 0 ? (
                filteredItems.map((item: MenuItem) => (
                  <FoodCard
                    key={item.itemId}
                    item={item}
                    onCardClick={handleCardClick}
                    onAddToCart={handleQuickAdd}
                    isFavorite={favorites.has(item.itemId)}
                    onToggleFavorite={handleToggleFavorite}
                  />
                ))
              ) : (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#888' }}>
                  {(() => {
                    if (!menuItems || menuItems.length === 0) {
                      return 'No menu items available. Please check back later.';
                    }
                    if (searchQuery.trim() !== '' || selectedCategory !== 'All') {
                      return 'No items found matching your search or category filter.';
                    }
                    return 'No items found';
                  })()}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Basket Sidebar */}
      <BasketSidebar 
        isOpen={isBasketOpen} 
        onClose={() => setIsBasketOpen(false)}
        onEditItem={(item) => {
          setSelectedItem(item);
          setIsModalOpen(true);
          setIsBasketOpen(false);
        }}
      />

      {/* Item Detail Modal */}
      <ItemDetailModal
        item={selectedItem}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedItem(null);
        }}
      />
    </div>
  );
};

