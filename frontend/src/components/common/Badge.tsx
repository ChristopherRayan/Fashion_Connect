import React from 'react';

interface BadgeProps {
  count: number;
  maxCount?: number;
  className?: string;
  variant?: 'red' | 'blue' | 'green' | 'yellow' | 'gray';
}

const Badge: React.FC<BadgeProps> = ({ 
  count, 
  maxCount = 99, 
  className = '', 
  variant = 'red' 
}) => {
  if (count <= 0) return null;

  const displayCount = count > maxCount ? `${maxCount}+` : count.toString();

  const variantClasses = {
    red: 'bg-red-100 text-red-700',
    blue: 'bg-blue-100 text-blue-700',
    green: 'bg-green-100 text-green-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    gray: 'bg-gray-100 text-gray-700'
  };

  return (
    <span 
      className={`
        inline-flex items-center justify-center
        text-xs font-semibold
        px-2 py-1
        rounded-full
        min-w-[1.25rem] h-5
        ${variantClasses[variant]}
        ${className}
      `}
    >
      {displayCount}
    </span>
  );
};

export default Badge;
