import React from 'react';

interface ProductSkeletonProps {
  count?: number;
}

const ProductSkeleton: React.FC<ProductSkeletonProps> = ({ count = 8 }) => {
  return (
    <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Image Skeleton */}
          <div className="aspect-square bg-gray-200 skeleton"></div>
          
          {/* Content Skeleton */}
          <div className="p-4 space-y-3">
            {/* Title */}
            <div className="skeleton skeleton-text w-3/4"></div>
            
            {/* Category */}
            <div className="skeleton skeleton-text w-1/2"></div>
            
            {/* Rating */}
            <div className="flex items-center space-x-2">
              <div className="flex space-x-1">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-4 h-4 bg-gray-200 rounded skeleton"></div>
                ))}
              </div>
              <div className="skeleton skeleton-text w-16"></div>
            </div>
            
            {/* Price and Designer */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="skeleton skeleton-text w-20 h-6"></div>
                <div className="skeleton skeleton-text w-24"></div>
              </div>
              <div className="w-8 h-8 bg-gray-200 rounded-full skeleton"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProductSkeleton;
