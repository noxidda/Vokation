import React from 'react';
import './Modal.css';

const Modal = ({ isOpen, onClose, title, children, confirmText, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="modal__overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2 className="modal__title">{title}</h2>
          <button className="modal__close" onClick={onClose}>×</button>
        </div>
        <div className="modal__body">
          {children}
        </div>
        <div className="modal__footer">
          <button className="modal__btn modal__btn--secondary" onClick={onClose}>
            Cancel
          </button>
          {onConfirm && (
            <button className="modal__btn modal__btn--primary" onClick={onConfirm}>
              {confirmText || 'Confirm'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;