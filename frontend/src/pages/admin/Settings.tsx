import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import '../../styles/admin.css';
import './Settings.css';
import toast from 'react-hot-toast';

export const AdminSettings = () => {
  const { user } = useAuthStore();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
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

  return (
    <div className="admin-settings-page">
      <div className="admin-card">
        <div className="settings-header">
          <h1 className="settings-title">Admin Settings</h1>
        </div>

        {/* Personal Info */}
        <div className="settings-section">
          <h3 className="section-title">Personal Information</h3>
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
            <div className="info-item">
              <label>Role</label>
              <div className="info-value">{user?.roleName || 'Admin'}</div>
            </div>
          </div>
        </div>

        {/* Account Settings */}
        <div className="settings-section">
          <h3 className="section-title">Account Settings</h3>
          <div className="settings-list">
            <div className="setting-item">
              <div className="setting-label">
                <span>Change Password</span>
                <span className="setting-hint">Update your account password</span>
              </div>
              <button className="setting-btn" onClick={() => setShowPasswordModal(true)}>
                Change Password
              </button>
            </div>
          </div>
        </div>

        {/* System Information */}
        <div className="settings-section">
          <h3 className="section-title">System Information</h3>
          <div className="info-grid">
            <div className="info-item">
              <label>Application Version</label>
              <div className="info-value">1.0.0</div>
            </div>
            <div className="info-item">
              <label>Last Login</label>
              <div className="info-value">
                {user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'N/A'}
              </div>
            </div>
          </div>
        </div>
      </div>

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
    </div>
  );
};

