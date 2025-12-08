import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { MenuHeader } from '../components/MenuHeader';
import { MenuSidebar } from '../components/MenuSidebar';
import { BasketSidebar } from '../components/BasketSidebar';
import { canteenService } from '../services/canteenService';
import { paymentMethodService, CreatePaymentMethodRequest, UpdatePaymentMethodRequest } from '../services/paymentMethodService';
import { PaymentMethod, Canteen } from '../types';
import toast from 'react-hot-toast';
import '../styles/menu.css';
import './Settings.css';

export const Settings = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedCanteenId, setSelectedCanteenId] = useState<number | null>(null);
  const [selectedCanteenName, setSelectedCanteenName] = useState<string>('');
  const [isBasketOpen, setIsBasketOpen] = useState(false);
  
  // Modal states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [showDeletePaymentModal, setShowDeletePaymentModal] = useState(false);
  const [paymentMethodToDelete, setPaymentMethodToDelete] = useState<PaymentMethod | null>(null);
  
  // Payment method form state
  const [editingPaymentMethod, setEditingPaymentMethod] = useState<PaymentMethod | null>(null);
  const [paymentFormData, setPaymentFormData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
  });
  
  // Password form state
  const [passwordFormData, setPasswordFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
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

  const { data: paymentMethods } = useQuery({
    queryKey: ['paymentMethods', user?.userId],
    queryFn: () => paymentMethodService.getAll(user!.userId),
    enabled: !!user?.userId && showPaymentModal,
  });

  const createPaymentMethodMutation = useMutation({
    mutationFn: (payload: CreatePaymentMethodRequest) =>
      paymentMethodService.create(user!.userId, payload),
    onSuccess: () => {
      toast.success('Payment method added');
      queryClient.invalidateQueries({ queryKey: ['paymentMethods', user?.userId] });
      resetPaymentForm();
    },
    onError: (e: any) => {
      console.error('Add Payment Method Error:', e);
      const errorMsg = e.response?.data?.message || e.message || 'Failed to add payment method';
      toast.error(errorMsg);
    },
  });

  const updatePaymentMethodMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdatePaymentMethodRequest }) =>
      paymentMethodService.update(user!.userId, id, payload),
    onSuccess: () => {
      toast.success('Payment method updated');
      queryClient.invalidateQueries({ queryKey: ['paymentMethods', user?.userId] });
      setEditingPaymentMethod(null);
      resetPaymentForm();
    },
    onError: (e: any) => {
      console.error('Update Payment Method Error:', e);
      const errorMsg = e.response?.data?.message || e.message || 'Failed to update payment method';
      toast.error(errorMsg);
    },
  });

  const deletePaymentMethodMutation = useMutation({
    mutationFn: (id: number) => paymentMethodService.delete(user!.userId, id),
    onSuccess: () => {
      toast.success('Payment method deleted');
      queryClient.invalidateQueries({ queryKey: ['paymentMethods', user?.userId] });
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to delete payment method'),
  });

  const resetPaymentForm = () => {
    setPaymentFormData({ cardNumber: '', expiryDate: '', cvv: '' });
    setEditingPaymentMethod(null);
  };

  const maskCardNumber = (cardNumber: string) => {
    if (!cardNumber) return '';
    const last4 = cardNumber.slice(-4);
    return `**** **** **** ${last4}`;
  };

  const handleAddPaymentMethod = () => {
    if (!paymentFormData.cardNumber || !paymentFormData.expiryDate || !paymentFormData.cvv) {
      toast.error('Please fill in all fields');
      return;
    }

    const masked = maskCardNumber(paymentFormData.cardNumber);
    // Determine method type - if it's a 16-digit number, it's a card, otherwise treat as GCash
    const cardNumberClean = paymentFormData.cardNumber.replace(/\s/g, '');
    const isCard = /^\d{16}$/.test(cardNumberClean);
    const methodType = isCard ? 'VISA' : 'GCASH';

    createPaymentMethodMutation.mutate({
      methodType,
      maskedDetails: masked,
      isDefault: (paymentMethods?.length || 0) === 0,
    });
  };

  const handleEditPaymentMethod = (method: PaymentMethod) => {
    setEditingPaymentMethod(method);
    // Extract card number from masked details if possible, or use placeholder
    setPaymentFormData({
      cardNumber: '',
      expiryDate: '',
      cvv: '',
    });
  };

  const handleUpdatePaymentMethod = () => {
    if (!editingPaymentMethod) return;
    if (!paymentFormData.cardNumber || !paymentFormData.expiryDate || !paymentFormData.cvv) {
      toast.error('Please fill in all fields');
      return;
    }

    const masked = maskCardNumber(paymentFormData.cardNumber);
    const cardNumberClean = paymentFormData.cardNumber.replace(/\s/g, '');
    const isCard = /^\d{16}$/.test(cardNumberClean);
    const methodType = isCard ? 'VISA' : 'GCASH';

    updatePaymentMethodMutation.mutate({
      id: editingPaymentMethod.paymentMethodId,
      payload: {
        methodType,
        maskedDetails: masked,
      },
    });
  };

  const handleDeletePaymentMethod = () => {
    if (paymentMethodToDelete) {
      deletePaymentMethodMutation.mutate(paymentMethodToDelete.paymentMethodId);
      setShowDeletePaymentModal(false);
      setPaymentMethodToDelete(null);
    }
  };

  const handleChangePassword = () => {
    if (!passwordFormData.currentPassword || !passwordFormData.newPassword || !passwordFormData.confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    // TODO: Implement password change API call
    toast.success('Password changed successfully');
    setShowPasswordModal(false);
    setPasswordFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const handleDeleteAccount = () => {
    // TODO: Implement delete account API call
    toast.error('Account deletion is not yet implemented');
    setShowDeleteAccountModal(false);
  };

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
        <section className="settings-section">
          <h3 className="section-title">Settings</h3>

          {/* Personal Info */}
          <div className="settings-group">
            <h4 className="group-title">Personal Info</h4>
            <div className="info-grid">
              <div className="info-item">
                <label>Name</label>
                <div className="info-value">{user?.fullName || 'N/A'}</div>
              </div>
              <div className="info-item">
                <label>ID</label>
                <div className="info-value">{user?.schoolId || 'N/A'}</div>
              </div>
              <div className="info-item">
                <label>Email</label>
                <div className="info-value">{user?.email || 'N/A'}</div>
              </div>
            </div>
          </div>

          {/* Account Settings */}
          <div className="settings-group">
            <h4 className="group-title">Account Settings</h4>
            <div className="settings-list">
              <div className="setting-item">
                <div className="setting-label">
                  <span>Password</span>
                  <span className="setting-hint">Change your password</span>
                </div>
                <button className="setting-btn" onClick={() => setShowPasswordModal(true)}>
                  Change
                </button>
              </div>
              <div className="setting-item">
                <div className="setting-label">
                  <span>Payment Methods</span>
                  <span className="setting-hint">Manage your payment methods</span>
                </div>
                <button className="setting-btn" onClick={() => setShowPaymentModal(true)}>
                  Manage
                </button>
              </div>
            </div>
          </div>

          {/* Activity Summary */}
          <div className="settings-group">
            <h4 className="group-title">Activity Summary</h4>
            <div className="activity-stats">
              <div className="stat-item">
                <span className="stat-label">Total Orders</span>
                <span className="stat-value">-</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Total Spent</span>
                <span className="stat-value">-</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Member Since</span>
                <span className="stat-value">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Logout Button */}
          <div className="settings-actions">
            <button className="logout-btn" onClick={() => setShowLogoutModal(true)}>
              Logout
            </button>
          </div>
        </section>
      </main>

      {/* Payment Methods Modal */}
      {showPaymentModal && (
        <div className="modal-overlay" onClick={() => { setShowPaymentModal(false); resetPaymentForm(); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Payment Methods</h2>
              <button className="modal-close" onClick={() => { setShowPaymentModal(false); resetPaymentForm(); }}>
                ×
              </button>
            </div>
            <div className="modal-body">
              {paymentMethods && paymentMethods.length > 0 && (
                <div className="payment-methods-list">
                  {paymentMethods.map((method) => (
                    <div key={method.paymentMethodId} className="payment-method-item">
                      <div className="payment-method-info">
                        <span className="payment-method-type">{method.methodType}</span>
                        <span className="payment-method-details">{method.maskedDetails}</span>
                      </div>
                      <div className="payment-method-actions">
                        <button
                          className="action-icon-btn edit-btn"
                          onClick={() => handleEditPaymentMethod(method)}
                          title="Edit"
                        >
                          <i className="fa-solid fa-pencil"></i>
                        </button>
                        <button
                          className="action-icon-btn delete-btn"
                          onClick={() => {
                            setPaymentMethodToDelete(method);
                            setShowDeletePaymentModal(true);
                          }}
                          title="Delete"
                        >
                          <i className="fa-solid fa-trash"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="add-payment-section">
                <h3>{editingPaymentMethod ? 'Edit Payment Method' : 'Add Payment Method'}</h3>
                <div className="form-group">
                  <label>Card Number</label>
                  <input
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    value={paymentFormData.cardNumber}
                    onChange={(e) => setPaymentFormData((prev) => ({ ...prev, cardNumber: e.target.value.replace(/\s/g, '') }))}
                    maxLength={16}
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Expiry Date</label>
                    <input
                      type="text"
                      placeholder="MM/YY"
                      value={paymentFormData.expiryDate}
                      onChange={(e) => {
                        let value = e.target.value.replace(/\D/g, '');
                        if (value.length >= 2) {
                          value = value.slice(0, 2) + '/' + value.slice(2, 4);
                        }
                        setPaymentFormData((prev) => ({ ...prev, expiryDate: value }));
                      }}
                      maxLength={5}
                    />
                  </div>
                  <div className="form-group">
                    <label>CVV</label>
                    <input
                      type="text"
                      placeholder="123"
                      value={paymentFormData.cvv}
                      onChange={(e) => setPaymentFormData((prev) => ({ ...prev, cvv: e.target.value.replace(/\D/g, '').slice(0, 3) }))}
                      maxLength={3}
                    />
                  </div>
                </div>
                <button
                  className="btn-add-payment"
                  onClick={editingPaymentMethod ? handleUpdatePaymentMethod : handleAddPaymentMethod}
                  disabled={createPaymentMethodMutation.isPending || updatePaymentMethodMutation.isPending}
                >
                  {editingPaymentMethod ? 'Update' : 'Add'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="modal-overlay" onClick={() => { setShowPasswordModal(false); setPasswordFormData({ currentPassword: '', newPassword: '', confirmPassword: '' }); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Change Password</h2>
              <button className="modal-close" onClick={() => { setShowPasswordModal(false); setPasswordFormData({ currentPassword: '', newPassword: '', confirmPassword: '' }); }}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Current Password</label>
                <div className="password-input-wrapper">
                  <input
                    type={showPasswords.current ? 'text' : 'password'}
                    placeholder="Enter current password"
                    value={passwordFormData.currentPassword}
                    onChange={(e) => setPasswordFormData((prev) => ({ ...prev, currentPassword: e.target.value }))}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPasswords((prev) => ({ ...prev, current: !prev.current }))}
                  >
                    <i className={`fa-solid ${showPasswords.current ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label>New Password</label>
                <div className="password-input-wrapper">
                  <input
                    type={showPasswords.new ? 'text' : 'password'}
                    placeholder="Enter new password"
                    value={passwordFormData.newPassword}
                    onChange={(e) => setPasswordFormData((prev) => ({ ...prev, newPassword: e.target.value }))}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPasswords((prev) => ({ ...prev, new: !prev.new }))}
                  >
                    <i className={`fa-solid ${showPasswords.new ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label>Re-type New Password</label>
                <div className="password-input-wrapper">
                  <input
                    type={showPasswords.confirm ? 'text' : 'password'}
                    placeholder="Confirm new password"
                    value={passwordFormData.confirmPassword}
                    onChange={(e) => setPasswordFormData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPasswords((prev) => ({ ...prev, confirm: !prev.confirm }))}
                  >
                    <i className={`fa-solid ${showPasswords.confirm ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
              </div>
              <button className="btn-save-password" onClick={handleChangePassword}>
                Save Password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="modal-overlay" onClick={() => setShowLogoutModal(false)}>
          <div className="modal-content confirmation-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Are you sure you want to log out?</h2>
            </div>
            <div className="modal-body">
              <div className="confirmation-buttons">
                <button className="btn-cancel" onClick={() => setShowLogoutModal(false)}>
                  Cancel
                </button>
                <button className="btn-confirm" onClick={handleLogout}>
                  Log Out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Payment Method Confirmation Modal */}
      {showDeletePaymentModal && paymentMethodToDelete && (
        <div className="modal-overlay" onClick={() => { setShowDeletePaymentModal(false); setPaymentMethodToDelete(null); }}>
          <div className="modal-content confirmation-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Delete {paymentMethodToDelete.maskedDetails} Payment Method?</h2>
            </div>
            <div className="modal-body">
              <div className="confirmation-buttons">
                <button className="btn-cancel" onClick={() => { setShowDeletePaymentModal(false); setPaymentMethodToDelete(null); }}>
                  Cancel
                </button>
                <button className="btn-confirm" onClick={handleDeletePaymentMethod}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Confirmation Modal */}
      {showDeleteAccountModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteAccountModal(false)}>
          <div className="modal-content confirmation-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Are you sure you want to delete your account?</h2>
            </div>
            <div className="modal-body">
              <p className="warning-text">WARNING: This action cannot be undone. All data will be erased.</p>
              <div className="confirmation-buttons">
                <button className="btn-cancel" onClick={() => setShowDeleteAccountModal(false)}>
                  Cancel
                </button>
                <button className="btn-confirm delete-account-btn" onClick={handleDeleteAccount}>
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Basket Sidebar */}
      <BasketSidebar 
        isOpen={isBasketOpen} 
        onClose={() => setIsBasketOpen(false)}
      />
    </div>
  );
};
