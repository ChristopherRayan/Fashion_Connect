import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Heart, ShoppingCart, Palette } from 'lucide-react';
import { useFavorites } from '../../contexts/FavoritesContext';
import { getImageUrl, handleImageError, DEFAULT_PRODUCT_IMAGE } from '../../utils/imageUtils';
import ProductCustomOrder from '../custom-orders/ProductCustomOrder';

export interface Product {
  id: string;
  name: string;
  price: number;
  discountPrice?: number;
  originalPrice?: number;
  discount?: number;
  images: (string | { url: string; colorName?: string; colorLabel?: string; description?: string })[];
  designer: {
    id: string;
    name: string;
    avatar?: string;
  };
  rating: number;
  reviewCount: number;
  category: string;
  isNew?: boolean;
  isFeatured?: boolean;
  inStock: boolean;
  customizable?: boolean;
  isCustomizable?: boolean; // Keep for backward compatibility
}

interface ProductCardProps {
  product: Product;
  className?: string;
  showQuickActions?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  className = '',
  showQuickActions = true
}) => {
  const { toggleFavorite, isFavorite } = useFavorites();
  const [showCustomOrder, setShowCustomOrder] = useState(false);

  // Helper function to check if product is customizable
  const isProductCustomizable = (product: Product): boolean => {
    return product.customizable === true || product.isCustomizable === true;
  };

  const handleCustomOrder = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowCustomOrder(true);
  };
  const discountPercentage = product.discountPrice
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <>
    <div className="w-full">
      <div className={`group relative bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden h-full flex flex-col ${className}`}>
        {/* Product Image - Square aspect ratio for uniformity */}
        <div className="relative w-full aspect-square overflow-hidden bg-gray-100 flex-shrink-0">
          <img
            src={(() => {
              if (!product.images || product.images.length === 0) {
                return DEFAULT_PRODUCT_IMAGE;
              }
              
              const firstImage = product.images[0];
              
              // If it's a ProductImage object, extract the URL directly
              if (typeof firstImage === 'object' && firstImage.url) {
                return firstImage.url;
              }
              
              // If it's a string, use getImageUrl to process it
              if (typeof firstImage === 'string') {
                return getImageUrl(firstImage);
              }
              
              return DEFAULT_PRODUCT_IMAGE;
            })()}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={handleImageError}
          />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {product.isNew && (
              <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                NEW
              </span>
            )}
            {discountPercentage > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                -{discountPercentage}%
              </span>
            )}
            {!product.inStock && !product.isCustomizable && (
              <span className="bg-gray-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                OUT OF STOCK
              </span>
            )}
          </div>

          {/* Favorite Button - Always visible like your reference */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleFavorite(product);
            }}
            className={`absolute top-3 right-3 p-2 rounded-full shadow-md transition-colors duration-200 ${
              isFavorite(product.id)
                ? 'bg-red-500 text-white'
                : 'bg-white/90 hover:bg-white text-gray-600 hover:text-red-500'
            }`}
            aria-label={isFavorite(product.id) ? 'Remove from favorites' : 'Add to favorites'}
            title={isFavorite(product.id) ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart className={`h-4 w-4 transition-colors ${
              isFavorite(product.id) ? 'fill-current' : ''
            }`} />
          </button>
        </div>

        {/* Product Info - Flexible content area */}
        <div className="p-4 flex flex-col flex-grow">
          {/* Category */}
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">
            {product.category}
          </p>

          {/* Product Name - Fixed height with line clamp */}
          <Link to={`/client/product/${product.id}`}>
            <h3 className="font-semibold text-gray-900 mb-2 text-sm leading-tight h-10 line-clamp-2 overflow-hidden hover:text-primary-600 transition-colors duration-200">
              {product.name}
            </h3>
          </Link>

          {/* Designer */}
          <p className="text-xs text-gray-600 mb-2">
            by <Link
              to={`/client/designer/${product.designer.id}`}
              className="font-medium text-primary-600 hover:text-primary-700 transition-colors duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {product.designer.name}
            </Link>
          </p>

          {/* Rating */}
          <div className="flex items-center gap-1 mb-3">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-3 w-3 ${
                    i < Math.floor(product.rating)
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-gray-500">
              {product.rating.toFixed(1)} ({product.reviewCount})
            </span>
          </div>

          {/* Price - Always at bottom, hidden for customizable products */}
          <div className="mt-auto">
            {!isProductCustomizable(product) && (
              <div className="flex items-center gap-2 mb-3">
                {product.discountPrice ? (
                  <>
                    <span className="text-lg font-bold text-red-600">
                      MWK {product.discountPrice.toLocaleString()}
                    </span>
                    <span className="text-sm text-gray-500 line-through">
                      MWK {product.price.toLocaleString()}
                    </span>
                    <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded">
                      {discountPercentage}% OFF
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-lg font-bold text-gray-900">
                      MWK {product.price.toLocaleString()}
                    </span>
                    {product.originalPrice && product.originalPrice > product.price && (
                      <span className="text-sm text-gray-500 line-through">
                        MWK {product.originalPrice.toLocaleString()}
                      </span>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Custom pricing message for customizable products */}
            {isProductCustomizable(product) && (
              <div className="mb-3">
                <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 border border-yellow-600 rounded-lg p-3 shadow-md">
                  <p className="text-sm font-bold text-black">Custom Pricing</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-black opacity-80">
                      Price varies by customization
                    </p>
                    <p className="text-xs font-medium text-black">
                      From MWK {product.price.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {showQuickActions && (
              <div className="space-y-2">
                {/* Show Custom Order Button ONLY for customizable products */}
                {isProductCustomizable(product) ? (
                  <button
                    type="button"
                    onClick={handleCustomOrder}
                    className="w-full py-2.5 px-4 rounded-md font-medium transition-colors duration-200 flex items-center justify-center gap-2 text-sm bg-gradient-to-r from-black to-gray-800 text-yellow-400 hover:from-gray-800 hover:to-black shadow-md hover:shadow-lg"
                  >
                    <Palette className="h-4 w-4" />
                    Custom Order
                  </button>
                ) : (
                  /* Show Add to Cart Button ONLY for non-customizable products */
                  <Link
                    to={`/client/product/${product.id}`}
                    className={`w-full py-2.5 px-4 rounded-md font-medium transition-colors duration-200 flex items-center justify-center gap-2 text-sm shadow-md hover:shadow-lg ${
                      !product.inStock
                        ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                        : 'bg-yellow-500 text-black hover:bg-yellow-600'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <ShoppingCart className="h-4 w-4" />
                    {!product.inStock ? 'Out of Stock' : 'Select Options'}
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>

    {/* Product Custom Order Modal */}
    {showCustomOrder && (
      <ProductCustomOrder
        isOpen={showCustomOrder}
        onClose={() => setShowCustomOrder(false)}
        product={{
          _id: product.id,
          name: product.name,
          images: product.images,
          designer: {
            _id: product.designer.id,
            name: product.designer.name,
            businessAddress: (product.designer as any).businessAddress
          },
          category: product.category,
          price: product.price,
          deliveryTimeOptions: (product as any).deliveryTimeOptions,
          customizable: product.customizable || product.isCustomizable,
          description: (product as any).description,
          tags: (product as any).tags,
          colors: (product as any).colors,
          sizes: (product as any).sizes,
          materials: (product as any).materials,
          inStock: product.inStock,
          rating: product.rating,
          reviewCount: product.reviewCount,
          discountPrice: product.discountPrice,
          stockQuantity: (product as any).stockQuantity,
          featured: (product as any).featured,
          createdAt: (product as any).createdAt,
          updatedAt: (product as any).updatedAt
        }}
      />
    )}
    </>
  );
};

export default ProductCard;
