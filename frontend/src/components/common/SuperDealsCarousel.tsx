import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import ProductCard, { Product } from './ProductCard';
import { Link } from 'react-router-dom';

interface SuperDealsCarouselProps {
  products: Product[];
  className?: string;
}

const SuperDealsCarousel: React.FC<SuperDealsCarouselProps> = ({
  products,
  className = ''
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Group products in pairs for display
  const productPairs = [];
  for (let i = 0; i < products.length; i += 2) {
    productPairs.push(products.slice(i, i + 2));
  }

  const totalSlides = productPairs.length;

  // Auto-scroll functionality
  useEffect(() => {
    if (!isAutoPlaying || totalSlides <= 1) return;

    const interval = setInterval(() => {
      nextSlide();
    }, 4000); // Change slide every 4 seconds

    return () => clearInterval(interval);
  }, [isAutoPlaying, totalSlides]);

  const nextSlide = () => {
    if (isTransitioning) return;

    setIsTransitioning(true);
    setCurrentIndex((prevIndex) => {
      const nextIndex = prevIndex >= totalSlides - 1 ? 0 : prevIndex + 1;
      return nextIndex;
    });

    // Reset transition state after animation completes
    setTimeout(() => setIsTransitioning(false), 600);
  };

  const prevSlide = () => {
    if (isTransitioning) return;

    setIsTransitioning(true);
    setCurrentIndex((prevIndex) => {
      const nextIndex = prevIndex <= 0 ? totalSlides - 1 : prevIndex - 1;
      return nextIndex;
    });

    // Reset transition state after animation completes
    setTimeout(() => setIsTransitioning(false), 600);
  };

  const goToSlide = (index: number) => {
    if (isTransitioning || index === currentIndex) return;

    setIsTransitioning(true);
    setCurrentIndex(index);

    // Reset transition state after animation completes
    setTimeout(() => setIsTransitioning(false), 600);
  };

  if (products.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <p className="text-gray-500">No deals available at the moment.</p>
      </div>
    );
  }

  return (
    <div
      className={`relative ${className}`}
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
    >
      {/* Carousel Container with inward sliding animation */}
      <div className="relative h-96 overflow-hidden rounded-xl bg-gradient-to-r from-red-50 to-pink-50">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex gap-6 w-full max-w-4xl px-4">
            {productPairs[currentIndex]?.map((product, index) => (
              <div
                key={`${currentIndex}-${product.id}`}
                className={`w-1/2 transform ${
                  isTransitioning
                    ? index === 0
                      ? 'animate-slide-in-left'
                      : 'animate-slide-in-right'
                    : 'opacity-100 scale-100'
                }`}
                style={{
                  animationDelay: isTransitioning ? `${index * 150}ms` : '0ms'
                }}
              >
                <ProductCard
                  product={product}
                  showQuickActions={false}
                  className="h-full shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white"
                />
              </div>
            ))}
            {/* Fill empty space if only one product in pair */}
            {productPairs[currentIndex]?.length === 1 && (
              <div className="w-1/2 flex items-center justify-center">
                <div className="text-center text-gray-400 bg-white rounded-lg p-8 shadow-lg">
                  <div className="w-24 h-24 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                    <span className="text-3xl">🎁</span>
                  </div>
                  <p className="text-sm font-medium">More deals coming soon!</p>
                  <p className="text-xs text-gray-500 mt-1">Stay tuned for amazing offers</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      {totalSlides > 1 && (
        <>
          <button
            onClick={prevSlide}
            disabled={isTransitioning}
            className={`absolute left-4 top-1/2 -translate-y-1/2 bg-white/95 hover:bg-white p-3 rounded-full shadow-xl transition-all duration-200 z-20 group ${
              isTransitioning ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'
            }`}
            aria-label="Previous deals"
          >
            <ChevronLeft className="h-6 w-6 text-gray-700 group-hover:text-red-600" />
          </button>

          <button
            onClick={nextSlide}
            disabled={isTransitioning}
            className={`absolute right-4 top-1/2 -translate-y-1/2 bg-white/95 hover:bg-white p-3 rounded-full shadow-xl transition-all duration-200 z-20 group ${
              isTransitioning ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'
            }`}
            aria-label="Next deals"
          >
            <ChevronRight className="h-6 w-6 text-gray-700 group-hover:text-red-600" />
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {totalSlides > 1 && (
        <div className="flex justify-center mt-8 gap-3">
          {Array.from({ length: totalSlides }).map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              disabled={isTransitioning}
              className={`transition-all duration-300 rounded-full ${
                index === currentIndex
                  ? 'w-8 h-3 bg-gradient-to-r from-red-500 to-pink-500 shadow-lg'
                  : 'w-3 h-3 bg-gray-300 hover:bg-gray-400 hover:scale-125'
              } ${isTransitioning ? 'opacity-50 cursor-not-allowed' : ''}`}
              aria-label={`Go to deals ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Auto-play indicator and slide counter */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        <div className="bg-black/70 text-white text-xs px-2 py-1 rounded-full">
          {currentIndex + 1} / {totalSlides}
        </div>
        <div className={`w-2 h-2 rounded-full ${isAutoPlaying ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`} />
      </div>
    </div>
  );
};

export default SuperDealsCarousel;