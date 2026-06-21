import React from 'react';
import './Card.css';

const Card = ({ 
  children, 
  title, 
  accent = false, 
  className = '',
  ...props 
}) => {
  return (
    <div 
      className={`card ${accent ? 'card--accent' : ''} ${className}`}
      {...props}
    >
      {title && <div className="card__title">{title}</div>}
      <div className="card__body">{children}</div>
    </div>
  );
};

export default Card;