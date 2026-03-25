import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShoppingBag } from 'lucide-react';
import { productService, Product as ApiProduct } from '../../services/productService';
import { Product } from './ProductCard';

// Transform API product to ProductCard product
const transformProduct = (apiProduct: ApiProduct): Product => ({
  id: apiProduct._id,
  name: apiProduct.name,
  price: apiProduct.price,
  originalPrice: apiProduct.discountPrice ? apiProduct.price : undefined,
  discount: apiProduct.discountPrice ? Math.round(((apiProduct.price - apiProduct.discountPrice) / apiProduct.price) * 100) : undefined,
  images: apiProduct.images,
  designer: {
    id: apiProduct.designer._id,
    name: apiProduct.designer.name,
    avatar: undefined // API doesn't provide designer avatar in product response
  },
  rating: apiProduct.rating,
  reviewCount: apiProduct.reviewCount,
  category: apiProduct.category,
  isNew: new Date(apiProduct.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // New if created within last 7 days
  isFeatured: apiProduct.featured,
  inStock: apiProduct.inStock
});

export interface Category {
  id: string;
  name: string;
  description: string;
  image: string;
  productCount: number;
  slug: string;
}

interface RotatingCategoryCardProps {
  category: Category;
  className?: string;
}

const RotatingCategoryCard: React.FC<RotatingCategoryCardProps> = ({ 
  category, 
  className = '' 
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [currentProductIndex, setCurrentProductIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch products for this category
  useEffect(() => {
    const fetchCategoryProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch products by category
        const response = await productService.getProductsByCategory(category.name, {
          limit: 6, // Get 6 products for rotation
          sortBy: 'createdAt',
          sortOrder: 'desc'
        });

        if (response.docs && response.docs.length > 0) {
          const transformedProducts = response.docs.map(transformProduct);
          setProducts(transformedProducts);
        } else {
          // If no products found, use fallback
          setProducts([]);
        }
      } catch (err) {
        console.error(`Error fetching products for category ${category.name}:`, err);
        setError('Failed to load products');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryProducts();
  }, [category.name]);

  // Rotation effect - change product every 3 seconds
  useEffect(() => {
    if (products.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentProductIndex((prev) => (prev + 1) % products.length);
    }, 3000);

    return () => clearInterval(timer);
  }, [products.length]);

  const currentProduct = products[currentProductIndex];
  const hasProducts = products.length > 0;

  return (
    <Link 
      to={`/client/browse?category=${encodeURIComponent(category.name)}`}
      className={`group relative block bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden ${className}`}
    >
      {/* Product/Category Image */}
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        {loading ? (
          // Loading state
          <div className="w-full h-full bg-gray-200 animate-pulse flex items-center justify-center">
            <ShoppingBag className="h-12 w-12 text-gray-400" />
          </div>
        ) : hasProducts && currentProduct ? (
          // Show rotating product image
          <>
            <img
              src={(() => {
                const firstImage = currentProduct.images?.[0];
                if (!firstImage) return '/api/placeholder/400/400';
                
                // If it's a ProductImage object, extract the URL
                if (typeof firstImage === 'object' && firstImage.url) {
                  return firstImage.url;
                }
                
                // If it's a string, return it directly
                if (typeof firstImage === 'string') {
                  return firstImage;
                }
                
                return '/api/placeholder/400/400';
              })()}
              alt={currentProduct.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {/* Product info overlay */}
            <div className="absolute top-4 right-4 bg-black/70 text-white px-2 py-1 rounded text-xs font-medium">
              MWK {currentProduct.price.toLocaleString()}
            </div>
            {/* Product indicator dots */}
            {products.length > 1 && (
              <div className="absolute top-4 left-4 flex space-x-1">
                {products.map((_, index) => (
                  <div
                    key={index}
                    className={`h-2 w-2 rounded-full transition-colors duration-300 ${
                      index === currentProductIndex ? 'bg-yellow-400' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          // Fallback to category image if no products
          <>
            <img
              src={category.image || '/api/placeholder/400/400'}
              alt={category.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
              <div className="text-white text-center">
                <ShoppingBag className="h-12 w-12 mx-auto mb-2 opacity-80" />
                <p className="text-sm opacity-90">No products yet</p>
              </div>
            </div>
          </>
        )}
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        
        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <h3 className="text-xl font-bold mb-2 group-hover:text-yellow-400 transition-colors duration-200">
            {category.name}
          </h3>
          
          {/* Show current product name if available */}
          {hasProducts && currentProduct && (
            <p className="text-xs text-yellow-200 mb-1 font-medium opacity-90">
              "{currentProduct.name}" by {currentProduct.designer.name}
            </p>
          )}
          
          <p className="text-sm text-gray-200 mb-3 line-clamp-2">
            {category.description}
          </p>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {hasProducts ? `${products.length} products` : `${category.productCount} products`}
            </span>
            <div className="flex items-center gap-1 text-yellow-400 group-hover:gap-2 transition-all duration-200">
              <span className="text-sm font-medium">Explore</span>
              <ArrowRight className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default RotatingCategoryCard;