import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, RefreshCw } from 'lucide-react';
import { vectorSearchService, SimilarProduct } from '../../services/vectorSearchService';
import { useNotification } from '../../contexts/NotificationContext';
import LoadingSpinner from './LoadingSpinner';
import { getFirstProductImageUrl } from '../../utils/productImageUtils';

interface SimilarProductsProps {
  productId: string;
  title?: string;
  limit?: number;
  showSimilarityScore?: boolean;
  className?: string;
}

const SimilarProducts: React.FC<SimilarProductsProps> = ({
  productId,
  title = "Similar Products",
  limit = 4,
  showSimilarityScore = false,
  className = ""
}) => {
  const [similarProducts, setSimilarProducts] = useState<SimilarProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addToast } = useNotification();

  const fetchSimilarProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const products = await vectorSearchService.findSimilarProducts(productId, limit);
      setSimilarProducts(products);
      
      if (products.length === 0) {
        setError('No similar products found');
      }
    } catch (error) {
      console.error('Error fetching similar products:', error);
      setError('Failed to load similar products');
    } finally {
      setLoading(false);
    }
  }, [productId, limit]);

  useEffect(() => {
    if (productId) {
      fetchSimilarProducts();
    }
  }, [productId, fetchSimilarProducts]);

  const handleRefresh = () => {
    fetchSimilarProducts();
    addToast('info', 'Refreshing similar products...');
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 shadow-sm p-4 ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-black flex items-center">
            <Sparkles className="mr-2 h-5 w-5 text-yellow-600" />
            {title}
          </h3>
        </div>
        <div className="flex justify-center py-6">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error || similarProducts.length === 0) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 shadow-sm p-4 ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-black flex items-center">
            <Sparkles className="mr-2 h-5 w-5 text-yellow-600" />
            {title}
          </h3>
          <button
            onClick={handleRefresh}
            className="p-2 text-gray-500 hover:text-yellow-600 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
        <div className="text-center py-6">
          <Sparkles className="h-10 w-10 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 text-sm">
            {error || 'No similar products found at the moment'}
          </p>
          <button
            onClick={handleRefresh}
            className="mt-2 text-yellow-600 hover:text-yellow-700 text-sm font-medium"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full bg-white py-6 px-4 rounded-lg border border-gray-200 shadow-sm ${className}`}>
      <div className="max-w-full">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className="h-6 w-1 bg-yellow-400 rounded-full"></div>
              <h3 className="text-lg font-bold text-black flex items-center">
                <Sparkles className="mr-2 h-5 w-5 text-yellow-600" />
                {title}
                <span className="ml-2 text-xs font-normal text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                  {similarProducts.length}
                </span>
              </h3>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="hidden sm:flex items-center text-xs text-gray-600">
              <span className="bg-yellow-50 text-yellow-700 px-2 py-1 rounded-full font-medium">
                AI Powered
              </span>
            </div>
            <button
              onClick={handleRefresh}
              className="p-2 text-gray-500 hover:text-yellow-600 transition-all duration-200 rounded-full hover:bg-gray-50"
              title="Refresh recommendations"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Exact same grid layout and product cards as browse products page */}
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
          {similarProducts.map((product) => (
            <div key={product.id || (product as any)._id} className="bg-white rounded-md shadow-sm border border-gray-300 overflow-hidden hover:shadow-lg hover:border-yellow-400 transition-all duration-200">
              {/* Product Image */}
              <div className="relative aspect-square">
                <Link
                  to={`/client/product/${product.id || (product as any)._id}`}
                  className="block w-full h-full"
                  onClick={() => console.log('🖼️ SimilarProducts: Image clicked, navigating to product:', product.id || (product as any)._id)}
                >
                  <img
                    src={getFirstProductImageUrl(product.images, '/placeholder-product.jpg')}
                    alt={product.name}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                  />
                </Link>

                {/* Discount Badge */}
                {product.discountPrice && (
                  <div className="absolute top-1 left-1 bg-yellow-500 text-black text-xs font-bold px-1.5 py-0.5 rounded">
                    -{Math.round(((product.price - product.discountPrice) / product.price) * 100)}%
                  </div>
                )}

                {/* Similarity Score Badge */}
                {showSimilarityScore && product.similarity && (
                  <div className="absolute top-1 right-1 bg-black text-yellow-400 text-xs px-1.5 py-0.5 rounded font-bold">
                    {Math.round(product.similarity * 100)}%
                  </div>
                )}

                {/* Out of Stock Overlay - Only for non-customizable products */}
                {!product.inStock && !product.customizable && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <span className="text-white text-xs font-semibold">Out of Stock</span>
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="p-2">
                {/* Product Name */}
                <Link
                  to={`/client/product/${product.id || (product as any)._id}`}
                  className="font-medium text-gray-900 text-xs truncate hover:text-black cursor-pointer block"
                  title={product.name}
                  onClick={() => console.log('🔗 SimilarProducts: Navigating to product:', product.id || (product as any)._id)}
                >
                  {product.name}
                </Link>

                {/* Designer Name */}
                <Link
                  to={`/client/designer/${product.designer?.id || (product.designer as any)?._id}`}
                  className="text-xs text-gray-500 hover:text-blue-600 cursor-pointer truncate block"
                >
                  by {product.designer?.name}
                </Link>

                {/* Rating */}
                <div className="flex items-center mt-1">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <span
                        key={i}
                        className={`text-xs ${
                          i < Math.floor(product.rating || 0)
                            ? 'text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  <span className="text-xs text-gray-500 ml-1">
                    ({product.reviewCount || 0})
                  </span>
                </div>

                {/* Price */}
                <div className="flex items-center justify-between mt-1">
                  <div className="flex items-center space-x-1">
                    <span className="font-semibold text-gray-900 text-xs">
                      MWK {(product.discountPrice || product.price || 0).toLocaleString()}
                    </span>
                    {product.discountPrice && (
                      <span className="text-xs text-gray-500 line-through">
                        MWK {(product.price || 0).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Add to Cart / Custom Order Button */}
                <Link
                  to={`/client/product/${product.id || (product as any)._id}`}
                  className={`w-full mt-2 px-2 py-1.5 text-xs font-medium rounded transition-colors flex items-center justify-center ${
                    product.customizable
                      ? 'bg-black hover:bg-gray-800 text-yellow-400'
                      : product.inStock
                        ? 'bg-yellow-500 hover:bg-yellow-600 text-black'
                        : 'bg-gray-400 text-gray-600 cursor-not-allowed pointer-events-none'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('🔗 SimilarProducts: Button clicked, navigating to product:', product.id || (product as any)._id);
                  }}
                >
                  {product.customizable ? (
                    'Custom Order'
                  ) : product.inStock ? (
                    'Select Options'
                  ) : (
                    'Out of Stock'
                  )}
                </Link>
              </div>
            </div>
          ))}
      </div>

        {/* Show more button if there might be more results */}
        {similarProducts.length >= limit && (
          <div className="mt-6 text-center">
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-gray-600 mb-3 text-sm">Discover more products tailored to your preferences</p>
              <button
                onClick={async () => {
                  try {
                    // Fetch more similar products
                    const moreProducts = await vectorSearchService.findSimilarProducts(productId, limit * 2);
                    setSimilarProducts(moreProducts);
                    addToast('success', `Showing ${moreProducts.length} similar products`);
                  } catch (error) {
                    addToast('error', 'Failed to load more similar products');
                  }
                }}
                className="inline-flex items-center px-6 py-2 bg-black text-yellow-400 rounded-lg font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400 transition-all duration-200 shadow-sm hover:shadow-md text-sm yellow-glow-shadow"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                View More Similar Products
                <ArrowRight className="ml-2 h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SimilarProducts;
