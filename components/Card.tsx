import React from 'react';

// FIX: Extended CardProps to accept standard div attributes (e.g., onClick) to make the component more flexible and fix usage errors.
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

// FIX: Passed through any additional props (`...props`) to the underlying div element.
const Card: React.FC<CardProps> = ({ children, className = '', ...props }) => {
  const baseClasses = 'bg-gray-800/50 border border-gray-700/50 rounded-xl shadow-2xl p-6 backdrop-blur-sm';

  return <div className={`${baseClasses} ${className}`} {...props}>{children}</div>;
};

export default Card;