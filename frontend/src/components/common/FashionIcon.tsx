import React from 'react';

interface FashionIconProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const FashionIcon: React.FC<FashionIconProps> = ({ className = '', size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <svg
      className={`${sizeClasses[size]} ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Gradient Definitions */}
      <defs>
        <linearGradient id="primaryGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FDE047" />
          <stop offset="100%" stopColor="#EAB308" />
        </linearGradient>
        <linearGradient id="accentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1F2937" />
          <stop offset="100%" stopColor="#374151" />
        </linearGradient>
      </defs>

      {/* Professional Fashion Icon - Modern Geometric Design */}
      <g>
        {/* Outer Ring */}
        <circle
          cx="12"
          cy="12"
          r="10"
          fill="none"
          stroke="url(#primaryGradient)"
          strokeWidth="2"
        />

        {/* Inner Fashion Symbol - Stylized FC */}
        <g transform="translate(12,12)">
          {/* F Shape */}
          <path
            d="M-6 -4 L-6 4 M-6 -4 L-2 -4 M-6 0 L-3 0"
            stroke="url(#accentGradient)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* C Shape */}
          <path
            d="M2 -3 C1 -4, 0 -4, -1 -3 C-1 -2, -1 2, -1 3 C0 4, 1 4, 2 3"
            stroke="url(#accentGradient)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />

          {/* Connecting Element */}
          <circle
            cx="0"
            cy="0"
            r="1"
            fill="url(#primaryGradient)"
            opacity="0.8"
          />
        </g>

        {/* Decorative Corner Elements */}
        <circle cx="12" cy="4" r="1.5" fill="url(#primaryGradient)" opacity="0.6" />
        <circle cx="12" cy="20" r="1.5" fill="url(#primaryGradient)" opacity="0.6" />
        <circle cx="4" cy="12" r="1.5" fill="url(#primaryGradient)" opacity="0.6" />
        <circle cx="20" cy="12" r="1.5" fill="url(#primaryGradient)" opacity="0.6" />

        {/* Inner Highlight Ring */}
        <circle
          cx="12"
          cy="12"
          r="8"
          fill="none"
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="0.5"
        />
      </g>
    </svg>
  );
};

export default FashionIcon;
