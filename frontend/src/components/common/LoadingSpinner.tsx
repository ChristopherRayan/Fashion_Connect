import  { CSSProperties } from 'react';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  fullScreen?: boolean;
  text?: string;
}

const LoadingSpinner = ({ size = 'medium', fullScreen = false, text }: LoadingSpinnerProps) => {
  const getSize = (): string => {
    switch (size) {
      case 'small':
        return 'w-4 h-4 border-2';
      case 'large':
        return 'w-12 h-12 border-4';
      case 'medium':
      default:
        return 'w-8 h-8 border-3';
    }
  };

  const loaderStyle: CSSProperties = {
    borderTopColor: '#6366f1',
  };

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-white bg-opacity-75 z-50">
        <div className={`loader ${getSize()}`} style={loaderStyle}></div>
        {text && <p className="mt-4 text-gray-600">{text}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className={`loader ${getSize()}`} style={loaderStyle}></div>
      {text && <p className="mt-4 text-gray-600">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;
 