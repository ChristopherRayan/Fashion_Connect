import React, { useState, useEffect, useCallback } from 'react';
import { Target, TrendingUp, RefreshCw, ArrowRight, Star } from 'lucide-react';
import { vectorSearchService, SimilarProduct } from '../../services/vectorSearchService';
import { useNotification } from '../../contexts/NotificationContext';
import LoadingSpinner from './LoadingSpinner';
import { Link } from 'react-router-dom';

interface ProductRecommendationsProps {
  title?: string;
  preferences?: {
    categories?: string[];
    tags?: string[];
  };
  limit?: number;
  className?: string;
  showPersonalized?: boolean;
}

const ProductRecommendations: React.FC<ProductRecommendationsProps> = ({
  title = "Recommended for You",
  preferences,
  limit = 6,
  className = "",
  showPersonalized = true
}) => {
  const [recommendations, setRecommendations] = useState<SimilarProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recommendationType, setRecommendationType] = useState<'featured' | 'personalized'>('featured');
  const { addToast } = useNotification();

  const fetchRecommendations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const products = await vectorSearchService.getRecommendations({
        ...preferences,
        limit
      });
      
      setRecommendations(products);
      
      // Determine recommendation type based on whether we have preferences
      if (preferences?.categories?.length || preferences?.tags?.length) {
        setRecommendationType('personalized');
      } else {
        setRecommendationType('featured');
      }
      
      if (products.length === 0) {
        setError('No recommendations available');
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      setError('Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  }, [preferences, limit]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  const handleRefresh = () => {
    fetchRecommendations();
    addToast('info', 'Refreshing recommendations...');
  };

  const getIcon = () => {
    return recommendationType === 'personalized' ? Target : TrendingUp;
  };

  const getTitle = () => {
    if (recommendationType === 'personalized') {
      return title;
    }
    return "Trending Products";
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <TrendingUp className="mr-2 h-5 w-5 text-primary-600" />
            {getTitle()}
          </h3>
        </div>
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error || recommendations.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            {React.createElement(getIcon(), { className: "mr-2 h-5 w-5 text-primary-600" })}
            {getTitle()}
          </h3>
          <button
            onClick={handleRefresh}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
        <div className="text-center py-8">
          {React.createElement(getIcon(), { className: "h-12 w-12 text-gray-300 mx-auto mb-4" })}
          <p className="text-gray-500">
            {error || 'No recommendations available at the moment'}
          </p>
          <button
            onClick={handleRefresh}
            className="mt-2 text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          {React.createElement(getIcon(), { className: "mr-2 h-5 w-5 text-primary-600" })}
          <h3 className="text-lg font-semibold text-gray-900">
            {getTitle()}
          </h3>
          <span className="ml-2 text-sm font-normal text-gray-500">
            ({recommendations.length})
          </span>
          {recommendationType === 'personalized' && (
            <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
              Personalized
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleRefresh}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            title="Refresh recommendations"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <ArrowRight className="h-4 w-4 text-gray-400" />
        </div>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2 mb-6">
        {recommendations.map((product) => (
          <div key={product.id || product._id} className="bg-white rounded-md shadow-sm border border-gray-300 overflow-hidden hover:shadow-lg hover:border-yellow-400 transition-all duration-200">
            {/* Product Image */}
            <div className="relative aspect-square">
              <img
                src={product.images?.[0] || '/api/placeholder/300/300'}
                alt={product.name}
                className="w-full h-full object-cover"
              />

              {/* Discount Badge */}
              {product.discountPrice && (
                <div className="absolute top-1 left-1 bg-yellow-500 text-black text-xs font-bold px-1.5 py-0.5 rounded">
                  -{Math.round(((product.price - product.discountPrice) / product.price) * 100)}%
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="p-2">
              {/* Product Name */}
              <h3 className="text-xs font-medium text-gray-900 line-clamp-2 mb-1">
                <Link to={`/client/product/${product._id || product.id}`} className="hover:text-yellow-600">
                  {product.name}
                </Link>
              </h3>

              {/* Designer */}
              <p className="text-xs text-gray-600 mb-1">
                by <Link
                  to={`/client/designer/${product.designer._id || product.designer.id}`}
                  className="font-medium text-primary-600 hover:text-primary-700"
                >
                  {product.designer.name}
                </Link>
              </p>

              {/* Rating */}
              <div className="flex items-center mt-1">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-2.5 w-2.5 ${
                        i < Math.floor(product.rating || 0)
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
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
                    MWK {(product.discountPrice || product.price).toLocaleString()}
                  </span>
                  {product.discountPrice && (
                    <span className="text-xs text-gray-500 line-through">
                      MWK {product.price.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>

              {/* Add to Cart / Custom Order Button */}
              <button
                onClick={() => product.customizable ? {} : {}}
                disabled={!product.inStock && !product.customizable}
                className={`w-full mt-2 px-2 py-1.5 text-xs font-medium rounded transition-colors ${
                  product.customizable
                    ? 'bg-black hover:bg-gray-800 text-yellow-400'
                    : product.inStock
                      ? 'bg-yellow-500 hover:bg-yellow-600 text-black'
                      : 'bg-gray-400 text-gray-600 cursor-not-allowed'
                }`}
              >
                {product.customizable ? (
                  'Custom Order'
                ) : product.inStock ? (
                  'Add to Cart'
                ) : (
                  'Out of Stock'
                )}
              </button>
            </div>
            
            {/* Recommendation confidence badge for personalized recommendations */}
            {recommendationType === 'personalized' && product.similarity && product.similarity > 0.7 && (
              <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                Great match
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Show more button */}
      {recommendations.length >= limit && (
        <div className="mt-6 text-center">
          <button
            onClick={() => {
              // This could navigate to a full recommendations page
              addToast('info', 'Feature coming soon: View all recommendations');
            }}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
          >
            View more recommendations
            <ArrowRight className="ml-2 h-4 w-4" />
          </button>
        </div>
      )}

      {/* Recommendation explanation */}
      {showPersonalized && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600">
            {recommendationType === 'personalized' 
              ? "These recommendations are based on your preferences and browsing history."
              : "These are currently trending products from our featured designers."
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default ProductRecommendations;
