import { MenuItem } from '../types';

interface FoodCardProps {
  item: MenuItem;
  onCardClick: (item: MenuItem) => void;
  onAddToCart: (item: MenuItem) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (itemId: number) => void;
}

export const FoodCard = ({
  item,
  onCardClick,
  onAddToCart,
  isFavorite = false,
  onToggleFavorite,
}: FoodCardProps) => {
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleFavorite) {
      onToggleFavorite(item.itemId);
    }
  };

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart(item);
  };

  return (
    <div className="food-card" onClick={() => onCardClick(item)}>
      <div
        className={`favorite-star ${isFavorite ? 'active' : ''}`}
        onClick={handleFavoriteClick}
      >
        <i className="fa-solid fa-star"></i>
      </div>
      <img
        src={item.imageUrl || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="210" height="215"%3E%3Crect fill="%23f0f0f0" width="210" height="215"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-family="Arial" font-size="14"%3ENo Image%3C/text%3E%3C/svg%3E'}
        alt={item.name}
        onError={(e) => {
          (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="210" height="215"%3E%3Crect fill="%23f0f0f0" width="210" height="215"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-family="Arial" font-size="14"%3ENo Image%3C/text%3E%3C/svg%3E';
        }}
      />
      <div className="food-details">
        <p className="food-name">{item.name}</p>
        <p className="food-price">₱ {item.price.toFixed(2)}</p>
      </div>
      <button className="add-cart-btn" onClick={handleAddClick}>
        <i className="fa-solid fa-plus"></i>
      </button>
    </div>
  );
};

