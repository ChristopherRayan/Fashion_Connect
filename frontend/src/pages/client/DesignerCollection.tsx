import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, MapPin, Globe, Instagram, Facebook, MessageCircle, User, Package, UserPlus, UserCheck, Heart, Search } from 'lucide-react';
import { productService, Product } from '../../services/productService';
import { httpClient, ApiResponse } from '../../services/httpClient';
import { DesignerProfile, designerService } from '../../services/designerService';
import { useNotification } from '../../contexts/NotificationContext';
import { useFollowDesigners } from '../../contexts/FollowDesignersContext';
import { useFavorites } from '../../contexts/FavoritesContext';
import { useCart } from '../../contexts/CartContext';

import LoadingSpinner from '../../components/common/LoadingSpinner';
import DesignerCard from '../../components/common/DesignerCard';
import ProductCustomOrder from '../../components/custom-orders/ProductCustomOrder';
import { getImageUrl } from '../../utils/imageUtils';
import { getFirstProductImageUrl } from '../../utils/productImageUtils';


interface Designer {
  _id: string;
  name: string;
  businessName?: string;
  specialty?: string;
  bio?: string;
  location?: string;
  avatar?: string;
  coverImage?: string;
  rating?: number;
  reviewCount?: number;
  totalProducts?: number;
  joinedDate?: string;
  website?: string;
  social?: {
    instagram?: string;
    facebook?: string;
  };
}



const DesignerCollection: React.FC = () => {
  const { designerId } = useParams<{ designerId: string }>();
  const navigate = useNavigate();
  const { addToast } = useNotification();
  const { isFollowing, toggleFollow } = useFollowDesigners();
  const { favorites, toggleFavorite } = useFavorites();
  const { addToCart } = useCart();

  const [designer, setDesigner] = useState<Designer | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [otherDesigners, setOtherDesigners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);
  const [otherDesignersLoading, setOtherDesignersLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCustomOrder, setShowCustomOrder] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter products based on search query
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (product.tags && product.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  // Utility functions
  const formatCurrency = (amount: number) => {
    return `MWK ${amount.toLocaleString()}`;
  };

  const isProductCustomizable = (product: Product) => {
    return product.customizable;
  };

  const handleToggleFavorite = (product: Product) => {
    toggleFavorite({
      _id: product._id,
      name: product.name,
      price: product.discountPrice || product.price,
      images: product.images,
      designer: product.designer
    });
  };

  const handleAddToCart = (product: Product) => {
    if (!product.inStock) return;

    addToCart(product, 1);
    addToast('success', `${product.name} added to cart`);
  };

  const handleCustomOrder = (product: Product) => {
    setSelectedProduct(product);
    setShowCustomOrder(true);
  };

  // Handle message designer
  const handleMessageDesigner = () => {
    if (!designer) return;

    console.log('💬 Starting conversation with designer:', designer.name);
    navigate('/client/messages', {
      state: {
        selectedDesignerId: designer._id,
        selectedDesignerName: designer.name
      }
    });
  };

  useEffect(() => {
    const fetchDesignerAndProducts = async () => {
      if (!designerId) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch designer info from API
        try {
          const designerResponse = await httpClient.get<ApiResponse<DesignerProfile>>(`/designers/${designerId}`, false);
          const designerData = designerResponse.data;

          setDesigner({
            _id: designerData.designer._id || designerData.designer.id || designerId,
            name: designerData.designer.name,
            businessName: designerData.designer.businessName,
            specialty: designerData.designer.specialty,
            bio: designerData.designer.bio,
            location: designerData.designer.location,
            avatar: designerData.designer.profileImage,
            rating: designerData.designer.rating || 0,
            reviewCount: designerData.designer.reviewCount || 0,
            totalProducts: designerData.designer.totalProducts || designerData.products?.length || 0,
            joinedDate: designerData.designer.createdAt
          });
        } catch (designerError) {
          console.error('Error fetching designer info:', designerError);
          // Fallback to basic designer info if API fails
          setDesigner({
            _id: designerId,
            name: 'Designer',
            totalProducts: 0
          });
        }

        // Fetch products by designer
        setProductsLoading(true);
        const response = await productService.getProducts({
          designer: designerId,
          limit: 50,
          page: 1
        });

        setProducts(response.docs || []);

        // Fetch other designers (excluding current designer)
        setOtherDesignersLoading(true);
        try {
          const designersResponse = await designerService.getDesigners({
            page: 1,
            limit: 8,
            sortBy: 'rating',
            sortType: 'desc'
          });

          // Filter out the current designer
          const filteredDesigners = designersResponse.docs.filter(d => d._id !== designerId);
          setOtherDesigners(filteredDesigners.slice(0, 6)); // Limit to 6 designers
        } catch (designerError) {
          console.error('Error fetching other designers:', designerError);
        } finally {
          setOtherDesignersLoading(false);
        }
      } catch (error) {
        console.error('Error fetching designer collection:', error);
        setError('Failed to load designer collection');
        addToast('error', 'Failed to load designer collection');
      } finally {
        setLoading(false);
        setProductsLoading(false);
      }
    };

    fetchDesignerAndProducts();
  }, [designerId, addToast]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !designer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Designer Not Found</h2>
          <p className="text-gray-600 mb-4">The designer you're looking for doesn't exist.</p>
          <Link
            to="/client/browse"
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Browse
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg) scale(1);
            opacity: 0.15;
          }
          25% {
            transform: translateY(-15px) rotate(90deg) scale(1.1);
            opacity: 0.25;
          }
          50% {
            transform: translateY(-8px) rotate(180deg) scale(0.9);
            opacity: 0.2;
          }
          75% {
            transform: translateY(-20px) rotate(270deg) scale(1.05);
            opacity: 0.3;
          }
        }

        .fashion-element {
          filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.1));
        }
      `}</style>
      <div className="min-h-screen bg-gray-50"> {/* Removed pt-12 to eliminate gap */}

      {/* Designer Header */}
      <div className="bg-white shadow-sm relative">
        {/* Rotating Background Images and Fashion Elements */}
        <div className="absolute inset-0 opacity-15 pointer-events-none overflow-hidden">
          {/* Product Images */}
          {products.slice(0, 4).map((product, index) => (
            <div
              key={`product-${product._id}`}
              className="absolute rounded-lg overflow-hidden shadow-lg border-2 border-yellow-200"
              style={{
                width: '85px',
                height: '85px',
                top: `${20 + Math.random() * 40}%`,
                left: `${15 + Math.random() * 60}%`,
                transform: `rotate(${Math.random() * 360}deg)`,
                animation: `float ${5 + Math.random() * 3}s ease-in-out infinite`,
                animationDelay: `${index * 0.8}s`
              }}
            >
              {product.images[0] && (
                <img
                  src={getFirstProductImageUrl(product.images)}
                  alt=""
                  className="w-full h-full object-cover rounded-lg"
                />
              )}
            </div>
          ))}

          {/* Fashion Icons and Elements */}
          {[
            { icon: '✂️', color: 'text-red-400', size: 'text-4xl' },
            { icon: '🧵', color: 'text-blue-400', size: 'text-3xl' },
            { icon: '📏', color: 'text-green-400', size: 'text-3xl' },
            { icon: '🪡', color: 'text-purple-400', size: 'text-3xl' },
            { icon: '👗', color: 'text-pink-400', size: 'text-4xl' },
            { icon: '👔', color: 'text-indigo-400', size: 'text-4xl' },
            { icon: '🎨', color: 'text-orange-400', size: 'text-3xl' },
            { icon: '✨', color: 'text-yellow-400', size: 'text-2xl' }
          ].map((item, index) => (
            <div
              key={`fashion-${index}`}
              className={`absolute fashion-element ${item.color} ${item.size}`}
              style={{
                top: `${15 + Math.random() * 50}%`,
                left: `${10 + Math.random() * 70}%`,
                transform: `rotate(${Math.random() * 360}deg)`,
                animation: `float ${4 + Math.random() * 4}s ease-in-out infinite`,
                animationDelay: `${index * 0.6}s`
              }}
            >
              {item.icon}
            </div>
          ))}
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 bg-white/95">
          {/* Cover Image */}
          {designer.coverImage && (
            <div className="h-48 md:h-64 bg-gray-200 rounded-lg overflow-hidden">
              <img
                src={designer.coverImage}
                alt={`${designer.name} cover`}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Designer Info */}
          <div className="relative">
            {/* Back Button and Designer Info Row */}
            <div className="flex items-start space-x-4">
              {/* Back Button */}
              <Link
                to="/client/browse"
                className="flex-shrink-0 inline-flex items-center justify-center w-10 h-10 bg-gray-100 hover:bg-yellow-100 text-gray-700 hover:text-black rounded-full transition-all duration-200 hover:shadow-md mt-1"
                title="Back to Browse"
              >
                <span className="text-lg font-bold">&lt;</span>
              </Link>

              {/* Avatar - moved further left */}
              <div className="flex-shrink-0 -ml-6">
                <div className="h-36 w-36 md:h-48 md:w-48 rounded-full border-4 border-yellow-400 bg-white shadow-xl overflow-hidden">
                  {designer.avatar ? (
                    <img
                      src={getImageUrl(designer.avatar)}
                      alt={designer.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.log('Image failed to load:', designer.avatar);
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br from-yellow-100 to-yellow-200 ${designer.avatar ? 'hidden' : ''}`}>
                    <User className="h-14 w-14 md:h-22 md:w-22 text-yellow-600" />
                  </div>
                </div>
              </div>

              {/* Designer Details */}
              <div className="flex-1 mt-6 md:mt-2 ml-2">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between lg:space-x-8">
                  <div className="flex-1">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1 leading-tight">
                      {designer.name}
                    </h1>
                    {designer.businessName && (
                      <p className="text-lg text-yellow-600 font-semibold mb-1">
                        {designer.businessName}
                      </p>
                    )}
                    {designer.specialty && (
                      <p className="text-gray-600 text-base mb-2 italic">{designer.specialty}</p>
                    )}



                    {/* Action Buttons */}
                    <div className="flex space-x-2 mb-4">
                      <button
                        onClick={handleMessageDesigner}
                        className="inline-flex items-center px-4 py-2 bg-black text-yellow-400 rounded-md hover:bg-gray-800 transition-colors font-medium shadow-lg hover:shadow-xl text-sm"
                      >
                        <MessageCircle className="mr-1 h-4 w-4" />
                        Message
                      </button>
                      <button
                        onClick={() => toggleFollow(designer)}
                        className={`inline-flex items-center px-4 py-2 border-2 rounded-md transition-colors font-medium shadow-lg hover:shadow-xl text-sm ${
                          isFollowing(designer._id)
                            ? 'bg-yellow-500 text-black border-yellow-500 hover:bg-yellow-600'
                            : 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                        }`}
                      >
                      {isFollowing(designer._id) ? (
                        <>
                          <UserCheck className="mr-2 h-5 w-5" />
                          Following
                        </>
                      ) : (
                        <>
                          <UserPlus className="mr-2 h-5 w-5" />
                          Follow
                        </>
                      )}
                    </button>
                  </div>

                </div>

                {/* Additional Stats */}
                <div className="flex flex-wrap items-center gap-4 mt-6">
                  <div className="flex items-center bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-2 rounded-xl border border-gray-200 shadow-sm">
                    <Package className="h-5 w-5 text-gray-600 mr-2" />
                    <span className="text-sm font-semibold text-gray-900">
                      {designer.totalProducts || products.length} products
                    </span>
                  </div>
                  {designer.location && (
                    <div className="flex items-center bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-2 rounded-xl border border-gray-200 shadow-sm">
                      <MapPin className="h-5 w-5 text-gray-600 mr-2" />
                      <span className="text-sm font-semibold text-gray-900">{designer.location}</span>
                    </div>
                  )}

                  {/* Reviews Section */}
                  <div className="flex items-center bg-gradient-to-r from-yellow-50 to-yellow-100 px-4 py-2 rounded-xl border border-yellow-200 shadow-sm">
                    <Star className="h-5 w-5 text-yellow-500 fill-current mr-2" />
                    <span className="text-sm font-semibold text-gray-900">
                      {designer.rating && designer.rating > 0 ? designer.rating.toFixed(1) : 'New'} rating
                    </span>
                    <span className="text-gray-600 ml-2 text-sm">
                      ({designer.reviewCount || 0} reviews)
                    </span>
                  </div>
                </div>

                {/* Links */}
                <div className="flex items-center space-x-4 mt-4">
                  {designer.website && (
                    <a
                      href={designer.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-sm text-primary-600 hover:text-primary-700"
                    >
                      <Globe className="mr-1 h-4 w-4" />
                      Website
                    </a>
                  )}
                  {designer.social?.instagram && (
                    <a
                      href={`https://instagram.com/${designer.social.instagram}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-sm text-primary-600 hover:text-primary-700"
                    >
                      <Instagram className="mr-1 h-4 w-4" />
                      Instagram
                    </a>
                  )}
                  {designer.social?.facebook && (
                    <a
                      href={`https://facebook.com/${designer.social.facebook}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-sm text-primary-600 hover:text-primary-700"
                    >
                      <Facebook className="mr-1 h-4 w-4" />
                      Facebook
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Products by {designer.name}
          </h2>
          <span className="text-sm text-gray-600">
            {filteredProducts.length} of {products.length} product{products.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm"
            />
          </div>
        </div>

        {productsLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
            {filteredProducts.map((product) => (
              <div key={product._id} className="bg-white rounded-md shadow-sm border border-gray-300 overflow-hidden hover:shadow-lg hover:border-yellow-400 transition-all duration-200">
                {/* Product Image */}
                <div className="relative aspect-square">
                  <img
                    src={getFirstProductImageUrl(product.images, '/placeholder-product.jpg')}
                    alt={product.name}
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => navigate(`/client/product/${product._id}`)}
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
                        favorites.some(fav => fav._id === product._id)
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
                    onClick={() => navigate(`/client/product/${product._id}`)}
                  >
                    {product.name}
                  </h3>

                  {/* Designer Name */}
                  <p
                    className="text-xs text-gray-500 hover:text-blue-600 cursor-pointer truncate"
                    onClick={() => navigate(`/client/designer/${product.designer?._id}`)}
                  >
                    by {product.designer?.name}
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
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery ? 'No products found' : 'No products yet'}
            </h3>
            <p className="text-gray-600">
              {searchQuery
                ? `No products match "${searchQuery}". Try a different search term.`
                : `${designer.name} hasn't uploaded any products yet.`
              }
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="mt-4 px-4 py-2 bg-yellow-500 text-black rounded-md hover:bg-yellow-600 transition-colors"
              >
                Clear Search
              </button>
            )}
          </div>
        )}

        {/* Explore Other Designers Section */}
        {otherDesigners.length > 0 && (
          <div className="mt-20 pt-12 border-t border-gray-200">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Explore Other Designers
                </h2>
                <p className="text-gray-600">
                  Discover more talented designers on FashionConnect
                </p>
              </div>
              <Link
                to="/client/designers"
                className="inline-flex items-center px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-medium rounded-lg transition-colors duration-200"
              >
                View All
                <ArrowLeft className="ml-2 h-4 w-4 rotate-180" />
              </Link>
            </div>

            {otherDesignersLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {[...Array(6)].map((_, index) => (
                  <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
                    <div className="aspect-square bg-gray-300" />
                    <div className="p-3">
                      <div className="h-3 bg-gray-300 rounded mb-2" />
                      <div className="h-4 bg-gray-300 rounded mb-2" />
                      <div className="h-3 bg-gray-300 rounded mb-3" />
                      <div className="h-8 bg-gray-300 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {otherDesigners.map((designer) => (
                  <DesignerCard key={designer._id} designer={designer} />
                ))}
              </div>
            )}
          </div>
        )}


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
            _id: selectedProduct._id,
            name: selectedProduct.name,
            images: selectedProduct.images,
            designer: {
              _id: selectedProduct.designer._id,
              name: selectedProduct.designer.name
            },
            category: selectedProduct.category,
            price: selectedProduct.discountPrice || selectedProduct.price
          }}
        />
      )}
      </div>
      </div>
    </>
  );
};

export default DesignerCollection;
