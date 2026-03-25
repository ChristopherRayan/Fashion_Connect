import React from 'react';
import { Link } from 'react-router-dom';
import FashionIcon from './FashionIcon';

interface LogoProps {
  variant?: 'default' | 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ 
  variant = 'default', 
  size = 'md', 
  showIcon = true,
  className = '' 
}) => {
  // Size configurations
  const sizeConfig = {
    sm: {
      text: 'text-lg',
      icon: 'h-4 w-4',
      spacing: 'ml-1'
    },
    md: {
      text: 'text-2xl',
      icon: 'h-6 w-6',
      spacing: 'ml-2'
    },
    lg: {
      text: 'text-3xl xl:text-4xl',
      icon: 'h-7 w-7 xl:h-8 xl:w-8',
      spacing: 'ml-2 xl:ml-3'
    }
  };

  // Color configurations based on variant
  const colorConfig = {
    default: {
      fashion: 'text-yellow-400',
      connect: 'text-white',
      icon: 'text-yellow-400'
    },
    light: {
      fashion: 'text-yellow-400',
      connect: 'text-gray-800',
      icon: 'text-yellow-400'
    },
    dark: {
      fashion: 'text-yellow-400',
      connect: 'text-white',
      icon: 'text-yellow-400'
    }
  };

  const currentSize = sizeConfig[size];
  const currentColors = colorConfig[variant];

  return (
    <Link
      to="/"
      className={`inline-flex items-center font-bold transition-all duration-200 hover:opacity-90 hover:scale-105 ${className}`}
      style={{
        filter: 'drop-shadow(0 0 8px rgba(234, 179, 8, 0.3))'
      }}
    >
      <span className={`${currentSize.text} font-black tracking-tight`}>
        <span
          className={`${currentColors.fashion} font-black`}
          style={{
            fontWeight: 900,
            textShadow: '0 0 10px rgba(234, 179, 8, 0.5), 0 0 20px rgba(234, 179, 8, 0.3), 2px 2px 4px rgba(0,0,0,0.3)',
            filter: 'drop-shadow(0 0 5px rgba(234, 179, 8, 0.4))'
          }}
        >
          FASHION
        </span>
        <span
          className={`${currentSize.spacing} ${currentColors.connect} font-black`}
          style={{
            fontWeight: 900,
            textShadow: '0 0 8px rgba(255, 255, 255, 0.3), 0 0 15px rgba(255, 255, 255, 0.2), 2px 2px 4px rgba(0,0,0,0.4)',
            filter: 'drop-shadow(0 0 3px rgba(255, 255, 255, 0.2))'
          }}
        >
          CONNECT
        </span>
      </span>
    </Link>
  );
};

export default Logo;
