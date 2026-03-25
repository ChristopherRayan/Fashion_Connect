import React, { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Download, ZoomIn, ZoomOut } from 'lucide-react';

interface ImageAttachment {
  type: 'image' | 'file';
  url: string;
  name: string;
  size?: number;
}

interface ImageLightboxProps {
  images: ImageAttachment[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

const ImageLightbox: React.FC<ImageLightboxProps> = ({
  images,
  initialIndex,
  isOpen,
  onClose
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isZoomed, setIsZoomed] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Reset state when lightbox opens
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setIsZoomed(false);
      setImageLoaded(false);
    }
  }, [isOpen, initialIndex]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!isOpen) return;

    switch (event.key) {
      case 'Escape':
        onClose();
        break;
      case 'ArrowLeft':
        goToPrevious();
        break;
      case 'ArrowRight':
        goToNext();
        break;
      case ' ':
        event.preventDefault();
        toggleZoom();
        break;
    }
  }, [isOpen, currentIndex]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const goToPrevious = () => {
    setCurrentIndex(prev => prev > 0 ? prev - 1 : images.length - 1);
    setImageLoaded(false);
    setIsZoomed(false);
  };

  const goToNext = () => {
    setCurrentIndex(prev => prev < images.length - 1 ? prev + 1 : 0);
    setImageLoaded(false);
    setIsZoomed(false);
  };

  const toggleZoom = () => {
    setIsZoomed(prev => !prev);
  };

  const downloadImage = async () => {
    try {
      const currentImage = images[currentIndex];
      console.log('📥 Attempting to download image:', {
        name: currentImage.name,
        url: currentImage.url,
        urlType: currentImage.url.startsWith('blob:') ? 'blob' : 'http'
      });

      // If it's already a blob URL, we can't fetch it again
      if (currentImage.url.startsWith('blob:')) {
        // For blob URLs, we need to handle differently
        const link = document.createElement('a');
        link.href = currentImage.url;
        link.download = currentImage.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        console.log('✅ Blob URL download initiated');
        return;
      }

      // For regular URLs, fetch and download
      const response = await fetch(currentImage.url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = currentImage.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      console.log('✅ HTTP URL download completed');
    } catch (error) {
      console.error('❌ Failed to download image:', error);
      // Show user-friendly error message
      alert(`Failed to download image: ${error.message}`);
    }
  };

  if (!isOpen) return null;

  const currentImage = images[currentIndex];

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center">
      {/* Background overlay */}
      <div 
        className="absolute inset-0 cursor-pointer"
        onClick={onClose}
      />

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black to-transparent p-4">
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-medium truncate max-w-md">
              {currentImage.name}
            </h3>
            {currentImage.size && (
              <span className="text-sm text-gray-300">
                {(currentImage.size / 1024 / 1024).toFixed(1)} MB
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Image counter */}
            <span className="text-sm text-gray-300">
              {currentIndex + 1} of {images.length}
            </span>
            
            {/* Download button */}
            <button
              onClick={downloadImage}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
              title="Download image"
            >
              <Download className="h-5 w-5" />
            </button>
            
            {/* Zoom toggle */}
            <button
              onClick={toggleZoom}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
              title={isZoomed ? "Zoom out" : "Zoom in"}
            >
              {isZoomed ? <ZoomOut className="h-5 w-5" /> : <ZoomIn className="h-5 w-5" />}
            </button>
            
            {/* Close button */}
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
              title="Close (Esc)"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Navigation arrows */}
      {images.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 p-3 text-white hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
            title="Previous image (←)"
          >
            <ChevronLeft className="h-8 w-8" />
          </button>
          
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 p-3 text-white hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
            title="Next image (→)"
          >
            <ChevronRight className="h-8 w-8" />
          </button>
        </>
      )}

      {/* Main image container */}
      <div className="relative max-w-full max-h-full p-16 flex items-center justify-center">
        {/* Loading spinner */}
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {/* Image */}
        <img
          src={currentImage.url}
          alt={currentImage.name}
          className={`max-w-full max-h-full object-contain transition-all duration-300 cursor-pointer ${
            isZoomed ? 'scale-150' : 'scale-100'
          } ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setImageLoaded(true)}
          onClick={toggleZoom}
          draggable={false}
        />
      </div>

      {/* Bottom thumbnail strip for multiple images */}
      {images.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black to-transparent p-4">
          <div className="flex justify-center space-x-2 overflow-x-auto max-w-full">
            {images.map((image, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentIndex(index);
                  setImageLoaded(false);
                  setIsZoomed(false);
                }}
                className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                  index === currentIndex
                    ? 'border-white scale-110'
                    : 'border-transparent hover:border-gray-400'
                }`}
              >
                <img
                  src={image.url}
                  alt={image.name}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageLightbox;
