import React from 'react';

interface SparkleIconProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const SparkleIcon: React.FC<SparkleIconProps> = ({ className = '', size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <svg
      className={`${sizeClasses[size]} ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Main sparkle shape */}
      <path
        d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z"
        fill="#000000"
        stroke="#000000"
        strokeWidth="1"
        strokeLinejoin="round"
      />
      {/* Inner yellow gradient */}
      <defs>
        <radialGradient id="sparkleGradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FDE047" />
          <stop offset="50%" stopColor="#FACC15" />
          <stop offset="100%" stopColor="#EAB308" />
        </radialGradient>
      </defs>
      <path
        d="M12 4L13 8L17 9L13 10L12 14L11 10L7 9L11 8L12 4Z"
        fill="url(#sparkleGradient)"
      />
      {/* Highlight */}
      <path
        d="M12 4L12.5 6.5L15 7L12.5 7.5L12 10L11.5 7.5L9 7L11.5 6.5L12 4Z"
        fill="#FEF08A"
        opacity="0.8"
      />
    </svg>
  );
};

export default SparkleIcon;
