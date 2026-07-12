import React from 'react';

const Card = ({
  children,
  className = '',
  onClick,
  hoverable = true,
  ...props
}) => {
  return (
    <div
      onClick={onClick}
      className={`glass-card rounded-[24px] p-6 ${onClick ? 'cursor-pointer' : ''} ${!hoverable ? 'hover:transform-none hover:border-white/6 hover:shadow-none' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
