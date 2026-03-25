import React from 'react';

interface UnreadBadgeProps {
  count: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  maxCount?: number;
}

const UnreadBadge: React.FC<UnreadBadgeProps> = ({ 
  count, 
  size = 'md', 
  className = '',
  maxCount = 99
}) => {
  if (count <= 0) return null;

  const sizeClasses = {
    sm: 'h-4 w-4 text-xs',
    md: 'h-5 w-5 text-xs',
    lg: 'h-6 w-6 text-sm'
  };

  const displayCount = count > maxCount ? `${maxCount}+` : count.toString();

  return (
    <div 
      className={`
        ${sizeClasses[size]}
        bg-red-500 text-white font-bold rounded-full 
        flex items-center justify-center
        animate-pulse
        shadow-lg
        ${className}
      `}
    >
      {displayCount}
    </div>
  );
};

export default UnreadBadge;
