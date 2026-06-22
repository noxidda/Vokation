import React from 'react';
import './EmptyState.css';

const EmptyState = ({ title, description, action, actionLabel, onAction }) => {
  return (
    <div className="empty-state">
      <h3 className="empty-state__title">{title}</h3>
      <p className="empty-state__description">{description}</p>
      {action && (
        <button className="empty-state__action" onClick={onAction}>
          {actionLabel || 'Take Action'}
        </button>
      )}
    </div>
  );
};

export default EmptyState;