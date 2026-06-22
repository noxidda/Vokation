import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import './NotificationToast.css';

const NotificationToast = ({ type, title, message, onClose, duration }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (duration) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  if (!isVisible) return null;

  const variants = {
    success: 'toast--success',
    error: 'toast--error',
    info: 'toast--info',
  };

  return (
    <div className={`toast ${variants[type] || variants.info}`}>
      <div className="toast__content">
        {title && <div className="toast__title">{title}</div>}
        <div className="toast__message">{message}</div>
      </div>
      <button className="toast__close" onClick={() => {
        setIsVisible(false);
        onClose();
      }}>
        <X size={14} />
      </button>
    </div>
  );
};

export default NotificationToast;