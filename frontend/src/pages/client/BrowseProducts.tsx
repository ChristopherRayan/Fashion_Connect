import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useOutletContext, Link } from 'react-router-dom';
import { Search, Grid, List, Star, Heart, Menu, Scissors, ArrowRight, Zap } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useFavorites } from '../../contexts/FavoritesContext';
import { useNotification } from '../../contexts/NotificationContext';
import { formatCurrency } from '../../utils/helpers';
import { getImageUrl, DEFAULT_PRODUCT_IMAGE, handleImageError } from '../../utils/imageUtils';
import { getFirstProductImageUrl } from '../../utils/productImageUtils';
import { Product as ServiceProduct, ProductImage } from '../../services/productService';

import LoadingSpinner from '../../components/common/LoadingSpinner';
import ProductCard, { Product as CardProduct } from '../../components/common/ProductCard';
import DesignerCard from '../../components/common/DesignerCard';
import SuperDealsCarousel from '../../components/common/SuperDealsCarousel';
import { productService, Product as ApiProduct } from '../../services/productService';
import { designerService } from '../../services/designerService';
import Pagination from '../../components/common/Pagination';
import ProductCustomOrder from '../../components/custom-orders/ProductCustomOrder';

interface Product {
  _id: string;
  id?: string;
  name: string;
  price: number;
  discountPrice?: number;
  originalPrice?: number;
  discount?: number;
  image?: string;
  images?: (string | ProductImage)[];
  designer: {
    _id: string;
    id?: string;
    name: string;
    businessName?: string;
  };
  category: string;
  subcategory?: string;
  rating?: number;
  averageRating?: number;
  reviewCount?: number;
  customizable?: boolean;
  isCustomizable?: boolean; // Keep for backward compatibility
  inStock: boolean;
  stockQuantity?: number;
}

const BrowseProducts: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { addToFavorites, removeFromFavorites, favorites } = useFavorites();
  const { addToast } = useNotification();
  const { showCategoriesSidebar, setShowCategoriesSidebar } = useOutletContext() as {
    showCategoriesSidebar: boolean;
    setShowCategoriesSidebar: (show: boolean) => void;
  };

  // Helper function to check if product is customizable
  const isProductCustomizable = (product: Product): boolean => {
    return Boolean(product.customizable === true || product.isCustomizable === true);
  };

  // Custom order modal state
  const [showCustomOrder, setShowCustomOrder] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // State management
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('newest');
  const [priceRange] = useState<[number, number]>([0, 1000]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showOnlyDiscounted, setShowOnlyDiscounted] = useState(false);
  const [showOnlyCustomizable, setShowOnlyCustomizable] = useState(false);

  // Landing-page-like sections data
  const [featuredDesigners, setFeaturedDesigners] = useState<Array<{ _id?: string; name: string; businessName?: string; specialty?: string; profileImage?: string; bio?: string; location?: string; rating?: number; reviewCount?: number; }>>([]);
  const [designersLoading, setDesignersLoading] = useState(true);
  const [superDeals, setSuperDeals] = useState<ApiProduct[]>([]);
  const [superDealsLoading, setSuperDealsLoading] = useState(true);

  // Get URL parameters
  const searchParams = new URLSearchParams(location.search);
  const searchQuery = searchParams.get('search') || '';
  const categoryParam = searchParams.get('category') || '';
  const superDealsParam = searchParams.get('superdeals') === 'true';
  const customizableParam = searchParams.get('customizable') === 'true';

  // Check if any filters are active to determine whether to show landing sections
  const isAnyFilterActive = Boolean(
    selectedCategory || 
    searchQuery || 
    showOnlyDiscounted || 
    showOnlyCustomizable
  );

  useEffect(() => {
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    } else {
      // Clear category when no category parameter (e.g., when "All" is clicked)
      setSelectedCategory('');
    }
    if (superDealsParam) {
      setShowOnlyDiscounted(true);
    } else {
      // Clear discount filter when not in super deals mode
      setShowOnlyDiscounted(false);
    }
    if (customizableParam) {
      setShowOnlyCustomizable(true);
    } else {
      // Clear customizable filter when not in customs mode
      setShowOnlyCustomizable(false);
    }
  }, [categoryParam, superDealsParam, customizableParam]);

  // Fetch products
  useEffect(() => {
    fetchProducts();
  }, [currentPage, sortBy, selectedCategory, searchQuery, showOnlyDiscounted, showOnlyCustomizable, priceRange]);

  // Initial load for designers and super deals (landing-style sections)
  useEffect(() => {
    let isMounted = true;

    const loadLandingSections = async () => {
      try {
        setDesignersLoading(true);
        setSuperDealsLoading(true);

        // fetch featured designers with comprehensive error handling
        let designersResp = [];
        console.log('🎨 Starting to fetch designers...');
        
        try {
          console.log('🎨 Attempting getFeaturedDesigners...');
          designersResp = await designerService.getFeaturedDesigners(8);
          console.log('🎨 Featured designers response:', designersResp);
          console.log('🎨 Featured designers type:', typeof designersResp);
          console.log('🎨 Featured designers length:', designersResp?.length);
        } catch (designerError) {
          console.error('❌ Failed to fetch featured designers:', designerError);
          
          // Fallback to getting all designers
          try {
            console.log('🎨 Attempting fallback getDesigners...');
            const allDesignersResp = await designerService.getDesigners({ limit: 8, page: 1 });
            console.log('🎨 All designers response:', allDesignersResp);
            designersResp = allDesignersResp?.docs || [];
            console.log('🎨 Fallback designers response:', designersResp);
            console.log('🎨 Fallback designers length:', designersResp?.length);
          } catch (fallbackError) {
            console.error('❌ Failed to fetch designers fallback:', fallbackError);
            
            // Last resort - try direct API call
            try {
              console.log('🎨 Attempting direct API call...');
              const response = await fetch('http://localhost:8000/api/v1/designers?limit=8&page=1');
              const data = await response.json();
              console.log('🎨 Direct API response:', data);
              designersResp = data?.data?.docs || data?.docs || [];
              console.log('🎨 Direct API designers:', designersResp);
            } catch (directError) {
              console.error('❌ Direct API call failed:', directError);
              // Temporary mock data for testing
              console.log('🎨 Using mock data as last resort...');
              designersResp = [
                {
                  _id: '1',
                  name: 'Test Designer 1',
                  businessName: 'Test Business 1',
                  specialty: 'Fashion Design',
                  profileImage: '/api/placeholder/300/300',
                  rating: 4.5,
                  reviewCount: 12
                },
                {
                  _id: '2', 
                  name: 'Test Designer 2',
                  businessName: 'Test Business 2',
                  specialty: 'Accessories',
                  profileImage: '/api/placeholder/300/300',
                  rating: 4.8,
                  reviewCount: 25
                }
              ];
            }
          }
        }
        
        // fetch discounted products for super deals
        let dealsResp;
        try {
          dealsResp = await productService.getProducts({ hasDiscount: true, limit: 8, page: 1, sortBy: 'popular' });
        } catch (dealsError) {
          console.error('Failed to fetch super deals:', dealsError);
          dealsResp = { docs: [] };
        }

        if (!isMounted) return;

        console.log('🎨 Setting designers:', designersResp?.length || 0);
        console.log('🎨 Setting deals:', dealsResp?.docs?.length || 0);

        // More lenient filtering - accept both _id and id
        const filteredDesigners = (designersResp || []).filter(d => d._id || d.id);
        console.log('🎨 Filtered designers:', filteredDesigners);
        console.log('🎨 Filtered designers length:', filteredDesigners?.length);
        
        // Log individual designer data to see structure
        filteredDesigners.forEach((designer, index) => {
          console.log(`🎨 Designer ${index}:`, {
            _id: designer._id,
            id: designer.id,
            name: designer.name,
            businessName: designer.businessName
          });
        });
        
        setFeaturedDesigners(filteredDesigners);
        console.log('🎨 ✅ Successfully set featuredDesigners state');
        
        setSuperDeals((dealsResp?.docs || []).map(p => ({
          ...p,
          // Ensure optional fields are present for ProductCard compatibility
          featured: p.featured ?? false,
          customizable: p.customizable ?? false,
        })));
        console.log('🎨 ✅ Successfully set superDeals state');
      } catch (e) {
        console.error('❌ Failed to load landing sections:', e);
        addToast('warning', 'Some content may not load properly');
      } finally {
        if (isMounted) {
          console.log('🎨 Setting loading states to false...');
          setDesignersLoading(false);
          setSuperDealsLoading(false);
          console.log('🎨 ✅ Loading states set to false');
        }
      }
    };

    loadLandingSections();
    return () => {
      isMounted = false;
    };
  }, [addToast]);

  // Fetch products for the grid/list
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: 24,
        sortBy: sortBy,
        ...(selectedCategory && { category: selectedCategory }),
        ...(searchQuery && { query: searchQuery }),
        ...(showOnlyDiscounted && { hasDiscount: true }),
        ...(showOnlyCustomizable && { customizable: true }),
      };

      // Use productService to get properly processed products with image URLs
      const response = await productService.getProducts(params);
      
      setProducts(response.docs || []);
      setTotalPages(response.totalPages || 1);
      setTotalProducts(response.totalDocs || 0);
    } catch (error) {
      console.error('Error fetching products:', error);
      addToast('error', 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };



  const handleAddToCart = (product: Product) => {
    if (!product.inStock) {
      addToast('error', 'Product is out of stock');
      return;
    }

    // Check if product requires size or color selection
    const hasSizes = (product as any).sizes && (product as any).sizes.length > 0;
    const hasColors = (product as any).colors && (product as any).colors.length > 0;

    if (hasSizes || hasColors) {
      // Redirect to product detail page for size/color selection
      navigate(`/client/product/${product._id || product.id}`);
      addToast('info', 'Please select size and color options');
      return;
    }

    // Convert local Product to service Product format
    const serviceProduct: ServiceProduct = {
      _id: product._id || product.id || '',
      name: product.name,
      description: '', // Not available in local Product
      price: product.price,
      discountPrice: product.discountPrice,
      images: product.images || [product.image || ''],
      category: product.category,
      subcategory: product.subcategory,
      tags: [],
      colors: [],
      sizes: [],
      materials: [],
      inStock: product.inStock,
      stockQuantity: product.stockQuantity || 1,
      designer: {
        _id: product.designer._id || product.designer.id || '',
        name: product.designer.name || product.designer.businessName || '',
        specialty: ''
      },
      featured: false,
      customizable: isProductCustomizable(product),
      rating: product.averageRating || product.rating || 0,
      reviewCount: product.reviewCount || 0,
      createdAt: '',
      updatedAt: ''
    };

    addToCart(serviceProduct, 1);
    addToast('success', 'Added to cart');
  };

  const handleToggleFavorite = (product: Product) => {
    const productId = product._id || product.id || '';
    const isFavorite = favorites.some(fav => fav._id === productId);
    if (isFavorite) {
      removeFromFavorites(productId);
    } else {
      addToFavorites({
        _id: productId,
        name: product.name,
        price: product.discountPrice || product.price,
        images: product.images || [product.image || ''],
        category: product.category,
        designer: product.designer,
        inStock: product.inStock,
        rating: product.rating || product.averageRating,
        reviewCount: product.reviewCount
      });
    }
  };

  const handleCustomOrder = (product: Product) => {
    console.log('🎨 Custom order clicked for product:', product.name);
    setSelectedProduct(product);
    setShowCustomOrder(true);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Fixed Header with filters - positioned below nav bar */}
      <div className="fixed top-16 left-0 right-0 z-40 bg-white shadow-md border-b border-gray-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-2">
            {/* Results info */}
            <div className="flex items-center justify-between text-xs text-gray-700">
              <div className="flex items-center space-x-3">
                {/* Categories Button */}
                <button
                  onClick={() => setShowCategoriesSidebar(!showCategoriesSidebar)}
                  className="flex items-center space-x-1 px-2 py-1 text-xs font-medium text-gray-700 hover:text-black hover:bg-yellow-100 border border-gray-300 rounded transition-colors duration-200"
                >
                  <Menu className="h-3 w-3" />
                  <span>Categories</span>
                </button>

                <span className="text-xs">
                  Showing {((currentPage - 1) * 24) + 1}-{Math.min(currentPage * 24, totalProducts)} of {totalProducts} products
                  {searchQuery && ` for "${searchQuery}"`}
                  {selectedCategory && ` in ${selectedCategory}`}
                  {showOnlyDiscounted && ` with discounts`}
                </span>
              </div>

              {/* Right side - View mode and sort */}
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1 rounded ${viewMode === 'grid' ? 'bg-yellow-100 text-black' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    <Grid className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1 rounded ${viewMode === 'list' ? 'bg-yellow-100 text-black' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    <List className="h-3 w-3" />
                  </button>
                </div>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-2 py-0.5 border border-gray-400 rounded text-xs focus:outline-none focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500"
                >
                  <option value="newest">Newest</option>
                  <option value="price">Price: Low to High</option>
                  <option value="rating">Highest Rated</option>
                  <option value="popular">Most Popular</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content with sections similar to Landing Page */}
      <div className="pt-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-16">

        {/* Show landing sections only when no filters are active */}
        {!isAnyFilterActive && (
          <>
            {/* Explore Designers Section (same style as Landing) */}
            <section className="bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl mb-4">
                <Scissors className="inline-block mr-3 h-8 w-8 text-yellow-500" />
                Explore Designers
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Meet our talented designers and explore their unique collections
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {(() => {
                console.log('🎨 Render check - designersLoading:', designersLoading);
                console.log('🎨 Render check - featuredDesigners:', featuredDesigners);
                console.log('🎨 Render check - featuredDesigners.length:', featuredDesigners?.length);
                return null;
              })()}
              {designersLoading ? (
                [...Array(8)].map((_, index) => (
                  <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
                    <div className="aspect-square bg-gray-300" />
                    <div className="p-4">
                      <div className="h-3 bg-gray-300 rounded mb-2" />
                      <div className="h-4 bg-gray-300 rounded mb-2" />
                      <div className="h-3 bg-gray-300 rounded mb-3" />
                      <div className="h-8 bg-gray-300 rounded" />
                    </div>
                  </div>
                ))
              ) : featuredDesigners.length === 0 ? (
                <div className="col-span-full text-center py-8">
                  <p className="text-gray-500">No designers available at the moment</p>
                  <p className="text-sm text-gray-400">Check back later for featured designers</p>
                </div>
              ) : (
                featuredDesigners.map((designer) => (
                  <DesignerCard key={designer._id} designer={designer as any} />
                ))
              )}
            </div>
            {!designersLoading && featuredDesigners.length > 0 && (
              <div className="text-center mt-12">
                <Link
                  to="/client/designers"
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-black bg-yellow-400 hover:bg-yellow-500 transition-colors duration-200"
                >
                  View All Designers
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </div>
            )}
          </div>
        </section>

            {/* Super Deals Section */}
            <section className="bg-gradient-to-r from-red-50 to-pink-50 py-16">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl mb-2">
                    <Zap className="inline-block mr-3 h-8 w-8 text-yellow-500" />
                    Super Deals
                  </h2>
                  <p className="text-base text-gray-600 max-w-2xl mx-auto">
                    Limited time offers on premium fashion pieces
                  </p>
                </div>

                {superDealsLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <LoadingSpinner size="large" />
                  </div>
                ) : (
                  <SuperDealsCarousel
                    className="mt-4"
                    products={superDeals.map((p) => ({
                      id: p._id,
                      name: p.name,
                      price: p.price,
                      discountPrice: p.discountPrice,
                      images: p.images?.map(img => 
                        typeof img === 'object' && img.url ? img.url : 
                        typeof img === 'string' ? img : ''
                      ).filter(Boolean) || [],
                      designer: { id: p.designer._id, name: p.designer.name },
                      rating: p.rating,
                      reviewCount: p.reviewCount,
                      category: p.category,
                      isNew: false,
                      isFeatured: p.featured,
                      inStock: p.inStock,
                      customizable: p.customizable,
                    })) as CardProduct[]}
                  />
                )}

                <div className="text-center mt-8">
                  <Link
                    to="/client/browse?superdeals=true"
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 transition-colors duration-200"
                  >
                    View All Deals
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </div>
              </div>
            </section>
          </>
        )}

        {/* Products Section */}
        <section className="bg-white">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-extrabold text-gray-900">Products</h2>
              {(selectedCategory || searchQuery || showOnlyCustomizable || showOnlyDiscounted) && (
                <p className="text-sm text-gray-600">
                  {selectedCategory && <span>Category: <span className="font-medium">{selectedCategory}</span></span>}
                  {(selectedCategory && (searchQuery || showOnlyCustomizable || showOnlyDiscounted)) && <span className="mx-2">•</span>}
                  {searchQuery && <span>Search: <span className="font-medium">"{searchQuery}"</span></span>}
                  {(searchQuery && (showOnlyCustomizable || showOnlyDiscounted)) && <span className="mx-2">•</span>}
                  {showOnlyCustomizable && <span>Filter: <span className="font-medium">Customizable Products</span></span>}
                  {(showOnlyCustomizable && showOnlyDiscounted) && <span className="mx-2">•</span>}
                  {showOnlyDiscounted && <span>Filter: <span className="font-medium">Super Deals</span></span>}
                </p>
              )}
            </div>
            <Link
              to="/client/browse"
              className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium"
            >
              View All
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
          {/* Products Grid */}
          {loading ? (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner size="large" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-3">
              <Search className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-sm font-medium text-gray-900 mb-1">No products found</h3>
            <p className="text-xs text-gray-500">
              {searchQuery
                ? `No products found for "${searchQuery}"`
                : showOnlyCustomizable
                  ? 'No customizable products available at the moment'
                  : showOnlyDiscounted
                    ? 'No super deals available at the moment'
                    : selectedCategory
                      ? `No products found in ${selectedCategory}`
                      : 'No products available'
              }
            </p>
          </div>
        ) : (
          <>
            {/* Product Display */}
            {viewMode === 'grid' ? (
              /* Grid View */
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2 mb-6" role="list">
                {products.map((product) => (
                  <div key={product._id || product.id} className="bg-white rounded-md shadow-sm border border-gray-300 overflow-hidden hover:shadow-lg hover:border-yellow-400 transition-all duration-200">
                    {/* Product Image */}
                    <div className="relative aspect-square">
                      <img
                        src={getFirstProductImageUrl(product.images, DEFAULT_PRODUCT_IMAGE)}
                        alt={product.name}
                        className="w-full h-full object-cover cursor-pointer"
                        onClick={() => navigate(`/client/product/${product._id || product.id}`)}
                        onError={(e) => handleImageError(e)}
                      />

                      {/* Discount Badge */}
                      {product.discountPrice && (
                        <div className="absolute top-1 left-1 bg-yellow-500 text-black text-xs font-bold px-1.5 py-0.5 rounded">
                          -{Math.round(((product.price - product.discountPrice) / product.price) * 100)}%
                        </div>
                      )}

                      {/* Favorite Button */}
                      <button
                        onClick={() => handleToggleFavorite(product)}
                        className="absolute top-1 right-1 p-1.5 bg-white/90 backdrop-blur-sm rounded-full hover:bg-yellow-100 transition-colors"
                      >
                        <Heart
                          className={`h-3 w-3 ${
                            favorites.some(fav => fav._id === (product._id || product.id))
                              ? 'fill-yellow-500 text-yellow-500'
                              : 'text-gray-600'
                          }`}
                        />
                      </button>

                      {/* Out of Stock Overlay - Only for non-customizable products */}
                      {!product.inStock && !isProductCustomizable(product) && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <span className="text-white text-xs font-semibold">Out of Stock</span>
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="p-2">
                      {/* Product Name */}
                      <h3
                        className="font-medium text-gray-900 text-xs truncate hover:text-black cursor-pointer"
                        title={product.name}
                        onClick={() => navigate(`/client/product/${product._id || product.id}`)}
                      >
                        {product.name}
                      </h3>

                      {/* Designer Name */}
                      <p
                        className="text-xs text-gray-500 hover:text-blue-600 cursor-pointer truncate"
                        onClick={() => navigate(`/client/designer/${product.designer?._id || product.designer?.id}`)}
                      >
                        by {product.designer?.name || product.designer?.businessName}
                      </p>

                      {/* Rating */}
                      <div className="flex items-center mt-1">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-2.5 w-2.5 ${
                                i < Math.floor(product.averageRating || product.rating || 0)
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
                            {formatCurrency(product.discountPrice || product.price)}
                          </span>
                          {product.discountPrice && (
                            <span className="text-xs text-gray-500 line-through">
                              {formatCurrency(product.price)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Add to Cart / Custom Order Button */}
                      <button
                        onClick={() => isProductCustomizable(product) ? handleCustomOrder(product) : handleAddToCart(product)}
                        disabled={!product.inStock && !isProductCustomizable(product)}
                        className={`w-full mt-2 px-2 py-1.5 text-xs font-medium rounded transition-colors ${
                          isProductCustomizable(product)
                            ? 'bg-black hover:bg-gray-800 text-yellow-400'
                            : product.inStock
                              ? 'bg-yellow-500 hover:bg-yellow-600 text-black'
                              : 'bg-gray-400 text-gray-600 cursor-not-allowed'
                        }`}
                      >
                        {isProductCustomizable(product) ? (
                          'Custom Order'
                        ) : product.inStock ? (
                          'Add to Cart'
                        ) : (
                          'Out of Stock'
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* List View */
              <div className="space-y-4 mb-6">
                {products.map((product) => (
                  <div key={product._id || product.id} className="bg-white rounded-lg shadow-sm border border-gray-300 overflow-hidden hover:shadow-lg hover:border-yellow-400 transition-all duration-200">
                    <div className="flex">
                      {/* Product Image */}
                      <div className="relative w-48 h-48 flex-shrink-0">
                        <img
                          src={getFirstProductImageUrl(product.images, DEFAULT_PRODUCT_IMAGE)}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => handleImageError(e)}
                        />

                        {/* Discount Badge */}
                        {product.discountPrice && (
                          <div className="absolute top-2 left-2 bg-yellow-500 text-black text-sm font-bold px-2 py-1 rounded">
                            -{Math.round(((product.price - product.discountPrice) / product.price) * 100)}%
                          </div>
                        )}

                        {/* Favorite Button */}
                        <button
                          onClick={() => handleToggleFavorite(product)}
                          className="absolute top-2 right-2 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-yellow-100 transition-colors"
                        >
                          <Heart
                            className={`h-4 w-4 ${
                              favorites.some(fav => fav._id === (product._id || product.id))
                                ? 'fill-yellow-500 text-yellow-500'
                                : 'text-gray-600'
                            }`}
                          />
                        </button>

                        {/* Out of Stock Overlay - Only for non-customizable products */}
                        {!product.inStock && !isProductCustomizable(product) && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <span className="text-white text-sm font-semibold">Out of Stock</span>
                          </div>
                        )}
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 p-6 flex flex-col justify-between">
                        <div>
                          {/* Product Name */}
                          <h3
                            className="text-lg font-semibold text-gray-900 hover:text-black cursor-pointer mb-2"
                            onClick={() => navigate(`/client/product/${product._id || product.id}`)}
                          >
                            {product.name}
                          </h3>

                          {/* Designer Name */}
                          <p
                            className="text-sm text-gray-600 hover:text-blue-600 cursor-pointer mb-3"
                            onClick={() => navigate(`/client/designer/${product.designer?._id || product.designer?.id}`)}
                          >
                            by {product.designer?.name || product.designer?.businessName}
                          </p>

                          {/* Category */}
                          <p className="text-sm text-gray-500 mb-3 capitalize">
                            {product.category}
                          </p>

                          {/* Rating */}
                          <div className="flex items-center mb-4">
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < Math.floor(product.averageRating || 0)
                                      ? 'text-yellow-400 fill-current'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-sm text-gray-500 ml-2">
                              ({product.reviewCount || 0} reviews)
                            </span>
                          </div>

                          {/* Size Availability - Only for non-customizable products with sizes */}
                          {!isProductCustomizable(product) && (product as any).sizeStock && (product as any).sizeStock.length > 0 && (
                            <div className="mb-4">
                              <p className="text-sm text-gray-600 mb-2">Available Sizes:</p>
                              <div className="flex flex-wrap gap-2">
                                {(product as any).sizeStock.map((sizeItem: any, index: number) => (
                                  <span
                                    key={index}
                                    className={`text-sm px-2 py-1 rounded ${
                                      sizeItem.quantity > 0
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-red-100 text-red-800'
                                    }`}
                                  >
                                    {sizeItem.size} ({sizeItem.quantity})
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Description - removed since not in Product type */}
                        </div>

                        {/* Bottom section with price and actions */}
                        <div className="flex items-center justify-between">
                          {/* Price */}
                          <div className="flex items-center space-x-2">
                            <span className="text-xl font-bold text-gray-900">
                              {formatCurrency(product.discountPrice || product.price)}
                            </span>
                            {product.discountPrice && (
                              <span className="text-sm text-gray-500 line-through">
                                {formatCurrency(product.price)}
                              </span>
                            )}
                          </div>

                          {/* Action Button */}
                          <button
                            onClick={() => navigate(`/client/product/${product._id || product.id}`)}
                            className="px-6 py-2 text-sm font-medium rounded-lg transition-colors bg-yellow-500 hover:bg-yellow-600 text-black"
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-4">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </>
        )}
        </section>
      </div>

      {/* Product Custom Order Modal */}
      {selectedProduct && showCustomOrder && (
        <ProductCustomOrder
          isOpen={showCustomOrder}
          onClose={() => {
            setShowCustomOrder(false);
            setSelectedProduct(null);
          }}
          product={{
            _id: selectedProduct._id || selectedProduct.id || '',
            name: selectedProduct.name,
            images: selectedProduct.images || [selectedProduct.image || ''],
            designer: {
              _id: selectedProduct.designer._id || selectedProduct.designer.id || '',
              name: selectedProduct.designer.name || selectedProduct.designer.businessName || 'Designer'
            },
            category: selectedProduct.category,
            price: selectedProduct.discountPrice || selectedProduct.price
          }}
        />
      )}
    </div>
  );
};

export default BrowseProducts;