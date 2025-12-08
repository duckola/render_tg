import { useState, useEffect } from 'react';
import { MenuItem } from '../types';
import { cartService } from '../services/cartService';
import { useAuthStore } from '../store/authStore';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

interface ItemDetailModalProps {
  item: MenuItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ItemDetailModal = ({ item, isOpen, onClose }: ItemDetailModalProps) => {
  const [quantity, setQuantity] = useState(1);
  const [addonRice, setAddonRice] = useState(false);
  const [note, setNote] = useState('');
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (item) {
      setQuantity(1);
      setAddonRice(false);
      setNote('');
    }
  }, [item]);

  if (!item) return null;

  const basePrice = item.price;
  const riceAddonPrice = 15;
  const totalPrice = (basePrice + (addonRice ? riceAddonPrice : 0)) * quantity;

  const handleAddToBasket = async () => {
    if (!user) {
      toast.error('Please log in to add items to cart');
      return;
    }
    try {
      await cartService.addItemToCart(user.userId, item.itemId, quantity, note || undefined);
      queryClient.invalidateQueries({ queryKey: ['cart', user.userId] });
      toast.success(`${item.name} added to basket!`);
      onClose();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to add item to cart');
    }
  };

  const changeQuantity = (delta: number) => {
    const newQuantity = quantity + delta;
    if (newQuantity >= 1) {
      setQuantity(newQuantity);
    }
  };

  return (
    <div
      className={`modal-overlay ${isOpen ? 'active' : ''}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="detail-card-popup" onClick={(e) => e.stopPropagation()}>
        <div className="close-modal-btn" onClick={onClose}>
          <i className="fa-solid fa-xmark"></i>
        </div>

        <img
          src={item.imageUrl || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="500" height="200"%3E%3Crect fill="%23f0f0f0" width="500" height="200"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-family="Arial" font-size="16"%3ENo Image%3C/text%3E%3C/svg%3E'}
          id="modalImg"
          className="popup-image"
          alt={item.name}
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="500" height="200"%3E%3Crect fill="%23f0f0f0" width="500" height="200"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-family="Arial" font-size="16"%3ENo Image%3C/text%3E%3C/svg%3E';
          }}
        />

        <div className="popup-content">
          <div className="popup-header-row">
            <h1 className="popup-title">{item.name}</h1>
            <span className="popup-price">₱ {basePrice.toFixed(2)}</span>
          </div>

          <p className="popup-category">Dish</p>

          <p className="popup-desc">{item.description || 'No description available.'}</p>

          <div className="section-title">
            Ingredients <i className="fa-solid fa-chevron-up"></i>
          </div>
          <div className="ingredients-box">Secret Ingredients...</div>

          <div className="section-title">Add-ons</div>
          <div className="addon-row">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={addonRice}
                onChange={(e) => setAddonRice(e.target.checked)}
              />
              Rice
            </label>
            <span style={{ textDecoration: 'underline' }}>+ {riceAddonPrice.toFixed(2)}</span>
          </div>

          <div className="section-title">Note</div>
          <textarea
            className="note-area"
            placeholder="Special requests..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />

          <div className="popup-footer-row">
            <div className="counter-box">
              <strong>Amount:</strong>
              <button className="qty-popup-btn" onClick={() => changeQuantity(-1)}>
                -
              </button>
              <div className="qty-display" style={{ color: '#5d0c1d' }}>{quantity}</div>
              <button className="qty-popup-btn" onClick={() => changeQuantity(1)}>
                +
              </button>
            </div>

            <div>
              <strong>Total:</strong>
              <span className="total-display">₱ {totalPrice.toFixed(2)}</span>
            </div>
          </div>

          <button className="add-popup-btn" onClick={handleAddToBasket}>
            Add to Basket
          </button>
        </div>
      </div>
    </div>
  );
};

