import { ReactNode } from 'react';
import './ConfirmDeleteModal.css';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string | ReactNode;
  itemName?: string;
  isLoading?: boolean;
}

export const ConfirmDeleteModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  itemName,
  isLoading = false,
}: ConfirmDeleteModalProps) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="confirm-delete-modal">
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button className="modal-close-btn" onClick={onClose} disabled={isLoading}>
            <i className="fa-solid fa-times"></i>
          </button>
        </div>
        <div className="modal-body">
          <div className="modal-icon">
            <i className="fa-solid fa-triangle-exclamation"></i>
          </div>
          <div className="modal-message">
            {typeof message === 'string' ? <p>{message}</p> : message}
            {itemName && (
              <p className="modal-item-name">
                <strong>{itemName}</strong>
              </p>
            )}
          </div>
          <p className="modal-warning">This action cannot be undone.</p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-cancel" onClick={onClose} disabled={isLoading}>
            Cancel
          </button>
          <button
            className="btn btn-delete"
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <i className="fa-solid fa-spinner fa-spin"></i> Deleting...
              </>
            ) : (
              <>
                <i className="fa-solid fa-trash"></i> Delete
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

