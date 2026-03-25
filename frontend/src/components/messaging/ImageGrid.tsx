import React, { useState } from 'react';
import { X, Download, ZoomIn } from 'lucide-react';

// Helper function to get full image URL
const getImageUrl = (imagePath: string | undefined): string => {
  if (!imagePath) return '';
  if (imagePath.startsWith('http')) return imagePath;
  if (imagePath.startsWith('blob:')) return imagePath; // For optimistic updates
  return `http://localhost:8000${imagePath}`;
};

interface ImageAttachment {
  type: 'image' | 'file';
  url: string;
  name: string;
  size?: number;
}

interface ImageGridProps {
  images: ImageAttachment[];
  timestamp: string;
  isCurrentUser: boolean;
  onImageClick?: (imageUrl: string, index: number) => void;
}

const ImageGrid: React.FC<ImageGridProps> = ({ 
  images, 
  timestamp, 
  isCurrentUser, 
  onImageClick 
}) => {
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());
  const [errorImages, setErrorImages] = useState<Set<number>>(new Set());

  const handleImageLoad = (index: number) => {
    setLoadedImages(prev => new Set([...prev, index]));
  };

  const handleImageError = (index: number) => {
    setErrorImages(prev => new Set([...prev, index]));
  };

  const handleImageClick = (image: ImageAttachment, index: number) => {
    const fullUrl = getImageUrl(image.url);
    if (onImageClick) {
      onImageClick(fullUrl, index);
    } else {
      // Fallback: open in new tab
      window.open(fullUrl, '_blank');
    }
  };

  const getGridLayout = (count: number) => {
    switch (count) {
      case 1:
        return 'grid-cols-1';
      case 2:
        return 'grid-cols-2';
      case 3:
        return 'grid-cols-2';
      case 4:
        return 'grid-cols-2';
      default:
        return 'grid-cols-2';
    }
  };

  const getImageStyle = (index: number, total: number) => {
    if (total === 1) {
      return {
        maxWidth: '280px',
        maxHeight: '350px',
        minWidth: '200px',
        minHeight: '150px'
      };
    }
    
    if (total === 2) {
      return {
        width: '140px',
        height: '140px'
      };
    }
    
    if (total === 3) {
      if (index === 0) {
        return {
          width: '140px',
          height: '290px'
        };
      }
      return {
        width: '140px',
        height: '140px'
      };
    }
    
    if (total === 4) {
      return {
        width: '140px',
        height: '140px'
      };
    }
    
    // For 5+ images
    if (index < 4) {
      return {
        width: '140px',
        height: '140px'
      };
    }
    
    return {
      width: '140px',
      height: '140px'
    };
  };

  const getImageClasses = (index: number, total: number) => {
    let classes = 'relative overflow-hidden rounded-lg cursor-pointer group transition-all duration-200 hover:scale-[1.02]';
    
    if (total === 3 && index === 0) {
      classes += ' row-span-2';
    }
    
    return classes;
  };

  const renderOverlay = (index: number, total: number) => {
    if (total > 4 && index === 3) {
      const remainingCount = total - 4;
      return (
        <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
          <span className="text-white text-2xl font-bold">+{remainingCount}</span>
        </div>
      );
    }
    return null;
  };

  const imagesToShow = images.slice(0, 4);

  return (
    <div className="space-y-1">
      {/* Image Grid */}
      <div className={`grid gap-1 ${getGridLayout(imagesToShow.length)} max-w-sm`}>
        {imagesToShow.map((image, index) => (
          <div
            key={index}
            className={getImageClasses(index, images.length)}
            style={getImageStyle(index, images.length)}
            onClick={() => handleImageClick(image, index)}
          >
            {/* Loading placeholder */}
            {!loadedImages.has(index) && !errorImages.has(index) && (
              <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
            
            {/* Error placeholder */}
            {errorImages.has(index) && (
              <div className="absolute inset-0 bg-gray-100 flex flex-col items-center justify-center text-gray-500">
                <X className="h-8 w-8 mb-2" />
                <span className="text-xs text-center px-2">Image unavailable</span>
              </div>
            )}
            
            {/* Image */}
            {!errorImages.has(index) && (
              <img
                src={getImageUrl(image.url)}
                alt={image.name}
                className="w-full h-full object-cover transition-opacity duration-200"
                style={{
                  opacity: loadedImages.has(index) ? 1 : 0
                }}
                onLoad={() => handleImageLoad(index)}
                onError={() => handleImageError(index)}
                loading="lazy"
              />
            )}
            
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
              <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            </div>
            
            {/* +N overlay for additional images */}
            {renderOverlay(index, images.length)}
          </div>
        ))}
      </div>
      
      {/* Timestamp */}
      <div className={`flex items-center justify-end mt-1 space-x-1 text-xs ${
        isCurrentUser ? 'text-gray-300' : 'text-gray-500'
      }`}>
        <span className="font-medium">
          {new Date(timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </span>
      </div>
    </div>
  );
};

export default ImageGrid;
