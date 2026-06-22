import React from 'react';
import './StatusBadge.css';

const StatusBadge = ({ variant = 'info', children }) => {
  const variants = {
    success: 'badge--success',
    warning: 'badge--warning',
    error: 'badge--error',
    info: 'badge--info',
  };

  return (
    <span className={`badge ${variants[variant] || variants.info}`}>
      {children}
    </span>
  );
};

export default StatusBadge;