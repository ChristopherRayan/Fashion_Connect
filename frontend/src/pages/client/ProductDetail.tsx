import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, Star, Heart, ShoppingCart, Share, Plus, Minus, Check, MessageCircle, X, Palette } from 'lucide-react';
import { useNotification } from '../../contexts/NotificationContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCart } from '../../contexts/CartContext';
import { useFavorites } from '../../contexts/FavoritesContext';
import { productService, Product, ProductImage } from '../../services/productService';
import { getImageUrl, handleImageError, DEFAULT_PRODUCT_IMAGE } from '../../utils/imageUtils';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import SimilarProducts from '../../components/common/SimilarProducts';
import ContactDesignerModal from '../../components/messaging/ContactDesignerModal';
import ProductCustomOrder from '../../components/custom-orders/ProductCustomOrder';
import SizeGuideModal from '../../components/common/SizeGuideModal';

// Custom styles for image gallery scrollbar
const galleryStyles = `
  .product-gallery-scroll {
    scrollbar-width: thin;
    scrollbar-color: #facc15 #e5e7eb;
  }
  
  .product-gallery-scroll::-webkit-scrollbar {
    height: 6px;
  }
  
  .product-gallery-scroll::-webkit-scrollbar-track {
    background: #e5e7eb;
    border-radius: 3px;
  }
  
  .product-gallery-scroll::-webkit-scrollbar-thumb {
    background: #facc15;
    border-radius: 3px;
  }
  
  .product-gallery-scroll::-webkit-scrollbar-thumb:hover {
    background: #eab308;
  }
  
  @media (max-width: 640px) {
    .product-gallery-scroll {
      padding-bottom: 8px;
    }
  }
`;

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { addToCart, isInCart } = useCart();
  const { addToast } = useNotification();
  const { t } = useLanguage();
  const { toggleFavorite, isFavorite: isProductFavorite } = useFavorites();
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedImage, setSelectedImage] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isImageGalleryOpen, setIsImageGalleryOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showCustomOrder, setShowCustomOrder] = useState(false);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [selectedDeliveryOption, setSelectedDeliveryOption] = useState<string>('standard');
  const [hoveredImageIndex, setHoveredImageIndex] = useState<number | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);
  const [reviewFormData, setReviewFormData] = useState({
    rating: 5,
    title: '',
    comment: ''
  });

  // Helper functions to handle both old and new image formats
  const getImageUrl = (image: string | ProductImage): string => {
    if (typeof image === 'string') {
      return image;
    }
    return image.url;
  };

  const getImageColorName = (image: string | ProductImage): string | null => {
    if (typeof image === 'string') {
      return null;
    }
    return image.colorName || image.colorLabel || null;
  };

  const getProcessedImages = (): (string | ProductImage)[] => {
    if (!product?.images) return [];
    return Array.isArray(product.images) ? product.images : [];
  };

  const getAvailableColors = (): string[] => {
    const processedImages = getProcessedImages();
    const imageColors: string[] = [];
    
    processedImages.forEach(img => {
      const colorName = getImageColorName(img);
      if (colorName && !imageColors.includes(colorName)) {
        imageColors.push(colorName);
      }
    });

    // Fallback to product.colors if no image colors are found
    return imageColors.length > 0 ? imageColors : (product?.colors || []);
  };

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);
        const productData = await productService.getProductById(id);
        setProduct(productData);

        // Set default selections using helper functions
        const processedImages = Array.isArray(productData.images) ? productData.images : [];
        if (processedImages.length > 0) {
          const firstImageUrl = typeof processedImages[0] === 'string' 
            ? processedImages[0] 
            : processedImages[0].url;
          setSelectedImage(firstImageUrl);
        }

        // Set default color and size if available
        if (productData.colors && productData.colors.length > 0) {
          setSelectedColor(productData.colors[0]);
        }
        if (productData.sizes && productData.sizes.length > 0) {
          setSelectedSize(productData.sizes[0]);
        }

        // Set default delivery option if available
        const deliveryOptions = (productData as any).deliveryTimeOptions;
        if (deliveryOptions) {
          if (deliveryOptions.standard?.enabled) {
            setSelectedDeliveryOption('standard');
          } else if (deliveryOptions.express?.enabled) {
            setSelectedDeliveryOption('express');
          } else if (deliveryOptions.premium?.enabled) {
            setSelectedDeliveryOption('premium');
          }
        }

        // Fetch reviews for this product
        fetchReviews(id);

      } catch (error) {
        console.error('Error fetching product:', error);
        setError('Failed to load product details');
        addToast('error', 'Failed to load product details');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, addToast]);

  const handleAddToCart = () => {
    if (!product) return;

    // Check if size is required but not selected
    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      addToast('error', 'Please select a size');
      return;
    }

    // Check if color is required but not selected
    if (product.colors && product.colors.length > 0 && !selectedColor) {
      addToast('error', 'Please select a color');
      return;
    }

    // Check size-specific stock if size is selected
    if (selectedSize) {
      const sizeStockItem = (product as any).sizeStock?.find((item: any) => item.size === selectedSize);
      const availableStock = sizeStockItem?.quantity || 0;

      if (availableStock === 0) {
        addToast('error', `Size ${selectedSize} is out of stock`);
        return;
      }

      if (quantity > availableStock) {
        addToast('error', `Only ${availableStock} items available in size ${selectedSize}`);
        return;
      }
    }

    // Get selected delivery option details
    const deliveryOption = (product as any).deliveryTimeOptions?.[selectedDeliveryOption];
    const deliveryInfo = deliveryOption ? {
      type: selectedDeliveryOption,
      days: deliveryOption.days,
      price: deliveryOption.price,
      description: deliveryOption.description
    } : undefined;

    addToCart(product, quantity, selectedSize, selectedColor, deliveryInfo);
    addToast('success', `${product.name || 'Product'} added to cart!`);
  };

  const handleToggleFavorite = () => {
    if (product) {
      toggleFavorite(product);
    }
  };

  const handleQuantityChange = (value: number) => {
    if (!product) return;

    // Get size-specific stock limit if size is selected
    let maxStock = product.stockQuantity || 1;
    if (selectedSize) {
      const sizeStockItem = (product as any).sizeStock?.find((item: any) => item.size === selectedSize);
      maxStock = sizeStockItem?.quantity || 0;
    }

    const newQuantity = Math.max(1, Math.min(maxStock, quantity + value));
    setQuantity(newQuantity);
  };

  const handleCustomOrder = () => {
    if (!product) return;

    console.log('🎨 Custom order clicked for product:', product.name);

    // Open the product-specific custom order modal
    setShowCustomOrder(true);
  };

  const openImageGallery = (imageIndex: number) => {
    setCurrentImageIndex(imageIndex);
    setIsImageGalleryOpen(true);
  };

  const closeImageGallery = () => {
    setIsImageGalleryOpen(false);
  };

  const fetchReviews = async (productId: string) => {
    try {
      console.log('🔍 Fetching reviews for product:', productId);
      const response = await productService.getProductReviews(productId);
      console.log('📝 Reviews response:', response);

      // Handle different response formats
      if (Array.isArray(response)) {
        setReviews(response);
      } else if (response && response.docs) {
        setReviews(response.docs);
      } else if (response && (response as any).data) {
        setReviews(Array.isArray((response as any).data) ? (response as any).data : []);
      } else {
        setReviews([]);
      }
    } catch (error) {
      console.error('❌ Error fetching reviews:', error);
      setReviews([]);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    // Validate form data
    if (!reviewFormData.title.trim() || !reviewFormData.comment.trim()) {
      addToast('error', 'Please fill in all required fields');
      return;
    }

    try {
      console.log('📝 Submitting review:', reviewFormData);
      const newReview = await productService.createProductReview(product._id, reviewFormData);
      console.log('✅ Review submitted successfully:', newReview);

      addToast('success', 'Review submitted successfully!');
      setShowReviewForm(false);
      setReviewFormData({ rating: 5, title: '', comment: '' });

      // Refresh reviews
      await fetchReviews(product._id);
    } catch (error: any) {
      console.error('❌ Error submitting review:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to submit review';
      addToast('error', errorMessage);
    }
  };

  const renderRatingStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            size={16}
            className={`${
              i < Math.floor(rating) 
                ? 'text-yellow-400 fill-yellow-400' 
                : i < rating 
                  ? 'text-yellow-400 fill-yellow-400 opacity-50' 
                  : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-1 text-sm text-gray-500">({rating.toFixed(1)})</span>
      </div>
    );
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error || !product) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">
          {error || 'Product not found'}
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          The product you're looking for doesn't exist or has been removed.
        </p>
        <div className="mt-6">
          <Link
            to="/client/browse"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
    {/* Inject custom styles for gallery */}
    <style dangerouslySetInnerHTML={{ __html: galleryStyles }} />
    
    <div className="min-h-screen bg-black">
      {/* Full width container */}
      <div className="w-full">
        {/* Breadcrumbs - Full width with padding */}
        <nav className="w-full bg-black border-b border-yellow-400 px-4 py-3" aria-label="Breadcrumb">
          <div className="max-w-7xl mx-auto">
            <ol className="flex items-center space-x-2">
              <li>
                <Link to="/client/dashboard" className="text-sm text-yellow-400 hover:text-yellow-300 transition-colors font-medium">
                  {t('common.home')}
                </Link>
              </li>
              <li className="flex items-center">
                <span className="mx-2 text-gray-400">/</span>
                <Link to="/client/products" className="text-sm text-yellow-400 hover:text-yellow-300 transition-colors font-medium">
                  {t('common.products')}
                </Link>
              </li>
              <li className="flex items-center">
                <span className="mx-2 text-gray-400">/</span>
                <Link to={`/client/products?category=${product.category}`} className="text-sm text-yellow-400 hover:text-yellow-300 transition-colors font-medium">
                  {product.category}
                </Link>
              </li>
              <li className="flex items-center">
                <span className="mx-2 text-gray-400">/</span>
                <span className="text-sm text-white font-semibold">{product.name}</span>
              </li>
            </ol>
          </div>
        </nav>

        {/* Main Content - Made wider by 0.5 with professional styling */}
        <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
          <div className="max-w-7xl mx-auto px-5 py-6">
            <div className="product-detail-container bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 min-h-[500px]">
                {/* Product Images - Gallery Layout */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 flex flex-col">
                  <div className="flex-1 space-y-4">
                    {/* Main Image Display */}
                    <div
                      className="product-main-image aspect-square rounded-xl overflow-hidden bg-white cursor-pointer group relative border border-gray-200 shadow-lg hover:border-yellow-400 hover:shadow-xl transition-all duration-300 max-w-full"
                      onClick={() => {
                        const processedImages = getProcessedImages();
                        const currentIndex = processedImages.findIndex(img => getImageUrl(img) === selectedImage) || 0;
                        openImageGallery(currentIndex);
                      }}
                    >
                      <img
                        src={selectedImage || DEFAULT_PRODUCT_IMAGE}
                        alt={product.name || 'Product'}
                        className="w-full h-full object-center object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={handleImageError}
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                        <div className="text-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <span className="text-sm font-bold bg-black bg-opacity-90 px-4 py-2 rounded-lg shadow-lg">Click to view gallery</span>
                        </div>
                      </div>
                    </div>

                    {/* Thumbnails Section - Horizontal Scrollable Below Main Image */}
                    {(() => {
                      const processedImages = getProcessedImages();
                      return processedImages.length > 1 && (
                        <div className="w-full">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-medium text-gray-700">Product Images</h3>
                            <span className="text-xs text-gray-500">
                              {processedImages.findIndex(img => getImageUrl(img) === selectedImage) + 1} of {processedImages.length}
                            </span>
                          </div>
                        
                        {/* Thumbnails Container - Horizontal Scroll */}
                        <div className="relative">
                          {/* Scroll hint for mobile */}
                          <div className="flex items-center justify-between mb-1 sm:hidden">
                            <div className="text-xs text-gray-500">
                              Swipe to see more images →
                            </div>
                          </div>
                          
                          <div 
                            className="flex space-x-2 sm:space-x-3 overflow-x-auto product-gallery-scroll pb-2 touch-pan-x"
                            style={{ 
                              scrollBehavior: 'smooth',
                              WebkitOverflowScrolling: 'touch'
                            }}
                          >
                            {processedImages.map((image, index) => {
                              const imageUrl = getImageUrl(image);
                              const colorName = getImageColorName(image);
                              
                              return (
                                <button
                                  key={index}
                                  type="button"
                                  className={`flex-shrink-0 product-thumbnail aspect-square w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-lg overflow-hidden cursor-pointer border-2 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 relative ${
                                    selectedImage === imageUrl
                                      ? 'ring-2 ring-yellow-400 border-yellow-400 shadow-lg scale-105 bg-yellow-50'
                                      : 'border-gray-200 hover:border-yellow-300 hover:shadow-lg'
                                  }`}
                                  onClick={() => {
                                    setSelectedImage(imageUrl);
                                    setCurrentImageIndex(index);
                                  }}
                                  onMouseEnter={(e) => {
                                    if (colorName) {
                                      const rect = e.currentTarget.getBoundingClientRect();
                                      setTooltipPosition({
                                        x: rect.left + rect.width / 2,
                                        y: rect.top - 10
                                      });
                                      setHoveredImageIndex(index);
                                    }
                                  }}
                                  onMouseLeave={() => {
                                    setHoveredImageIndex(null);
                                    setTooltipPosition(null);
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                      e.preventDefault();
                                      setSelectedImage(imageUrl);
                                      setCurrentImageIndex(index);
                                    }
                                  }}
                                  aria-label={`View image ${index + 1} of ${processedImages.length}${colorName ? ` - ${colorName}` : ''}`}
                                  title={`Image ${index + 1}${colorName ? ` - ${colorName}` : ''} - Click to view as main image`}
                                >
                                  <img
                                    src={imageUrl}
                                    alt={`${product.name} - Image ${index + 1}${colorName ? ` (${colorName})` : ''}`}
                                    className="w-full h-full object-center object-cover"
                                    onError={handleImageError}
                                  />
                                  {/* Selected indicator */}
                                  {selectedImage === imageUrl && (
                                    <div className="absolute top-1 right-1 w-4 h-4 sm:w-5 sm:h-5 bg-yellow-400 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                                      <Check className="w-2 h-2 sm:w-3 sm:h-3 text-black font-bold" />
                                    </div>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                    })()}

                    {/* Color Tooltip */}
                    {hoveredImageIndex !== null && tooltipPosition && (() => {
                      const processedImages = getProcessedImages();
                      const hoveredImage = processedImages[hoveredImageIndex];
                      const colorName = getImageColorName(hoveredImage);
                      
                      return colorName && (
                        <div
                          className="fixed z-50 px-2 py-1 text-xs font-medium text-white bg-gray-900 rounded shadow-lg pointer-events-none transform -translate-x-1/2 -translate-y-full"
                          style={{
                            left: tooltipPosition.x,
                            top: tooltipPosition.y,
                          }}
                        >
                          {colorName}
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                        </div>
                      );
                    })()}

                    {/* Description moved here */}
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200 shadow-lg mt-4">
                      <h2 className="text-sm font-bold text-black mb-3 uppercase tracking-wide">Description</h2>
                      <p className="text-sm text-gray-700 leading-relaxed">{product.description || 'No description available'}</p>
                    </div>
                  </div>
                </div>

                {/* Product Details - Made wider by 0.4 with professional styling */}
                <div className="bg-white p-6 flex flex-col justify-between min-h-[500px]">
                  <div className="space-y-6">
                    {/* Product Header */}
                    <div className="border-b border-gray-200 pb-4">
                      <h1 className="text-2xl lg:text-3xl font-bold text-black mb-3 leading-tight">
                        {product.name || 'Product Name'}
                      </h1>
                      <div className="flex flex-wrap items-center gap-4 mb-4">
                        <div className="flex items-center">
                          {renderRatingStars(product.rating || 0)}
                          <span className="ml-2 text-sm text-gray-600 font-medium">
                            ({product.reviewCount || 0})
                          </span>
                        </div>
                        <div className="h-4 w-px bg-gray-300 hidden sm:block"></div>
                        <span className="text-sm text-gray-600">
                          Category: <span className="font-semibold text-black">{product.category}</span>
                        </span>
                      </div>
                    </div>

                    {/* Price Section - Enhanced with glowing effect and separation, hidden for customizable products */}
                    {!product.customizable ? (
                      <div className="product-price-section bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-lg p-3 border border-yellow-600 shadow-lg mb-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-start space-x-6">
                            <div>
                              <p className="text-xs text-black font-bold mb-1 uppercase tracking-wide">Price</p>
                              <p className="text-lg lg:text-xl font-black text-black">
                                MWK {(product.price || 0).toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-black font-bold mb-1 uppercase tracking-wide">Design</p>
                              <Link
                                to={`/client/designer/${product.designer?._id}`}
                              className="text-lg lg:text-xl font-black text-black hover:text-gray-800 transition-colors duration-200 cursor-pointer"
                            >
                              {product.designer?.name || 'Designer'}
                            </Link>
                          </div>
                        </div>
                        {/* Stock status - Only show for non-customizable products */}
                        {!product.customizable && (
                          <div className="flex items-center">
                            <span className={`stock-status px-3 py-2 text-sm font-bold rounded-full shadow-lg border-2 border-white ${
                              product.inStock && (product.stockQuantity || 0) > 0
                                ? 'bg-green-500 text-white'
                                : 'bg-red-500 text-white'
                            }`}>
                              {product.inStock && (product.stockQuantity || 0) > 0
                                ? `In Stock (${product.stockQuantity || 0})`
                                : 'Out of Stock'
                              }
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    ) : (
                      /* Custom pricing section for customizable products */
                      <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-lg p-4 border border-yellow-600 shadow-lg mb-4 custom-glow">
                        <div className="text-center">
                          <p className="text-xs text-black font-bold mb-1 uppercase tracking-wide">Custom Product</p>
                          <p className="text-lg font-black text-black mb-2">
                            Price Varies by Customization
                          </p>
                          <div className="flex items-center justify-center gap-4 mb-2">
                            <div>
                              <p className="text-xs text-black font-medium">Base Price From</p>
                              <p className="text-lg font-bold text-black">
                                MWK {(product.price || 0).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <p className="text-xs text-black opacity-80">
                            Final price depends on your customization choices and selected delivery options
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Reviews Section */}
                    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <h2 className="text-sm font-bold text-black uppercase tracking-wide">Reviews</h2>
                        <button
                          type="button"
                          onClick={() => setShowReviewForm(!showReviewForm)}
                          className="text-sm font-medium text-yellow-600 hover:text-yellow-700 transition-colors"
                        >
                          Write Review
                        </button>
                      </div>

                      {/* Review Summary */}
                      <div className="flex items-center space-x-4 mb-4 pb-3 border-b border-gray-100">
                        <div className="flex items-center">
                          {renderRatingStars(product.rating || 0)}
                          <span className="ml-2 text-lg font-bold text-black">
                            {(product.rating || 0).toFixed(1)}
                          </span>
                        </div>
                        <span className="text-sm text-gray-600">
                          ({product.reviewCount || 0} reviews)
                        </span>
                      </div>

                      {/* Review Form */}
                      {showReviewForm && (
                        <form className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200" onSubmit={handleReviewSubmit}>
                          <h3 className="text-sm font-bold text-black mb-3">Write a Review</h3>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Rating</label>
                              <div className="flex items-center space-x-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <button
                                    key={star}
                                    type="button"
                                    onClick={() => setReviewFormData(prev => ({ ...prev, rating: star }))}
                                    className="focus:outline-none"
                                    aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
                                  >
                                    <Star
                                      className={`h-5 w-5 ${
                                        star <= reviewFormData.rating
                                          ? 'text-yellow-400 fill-current'
                                          : 'text-gray-300'
                                      }`}
                                    />
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Review Title</label>
                              <input
                                type="text"
                                value={reviewFormData.title}
                                onChange={(e) => setReviewFormData(prev => ({ ...prev, title: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
                                placeholder="Brief title for your review"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Review</label>
                              <textarea
                                value={reviewFormData.comment}
                                onChange={(e) => setReviewFormData(prev => ({ ...prev, comment: e.target.value }))}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
                                placeholder="Share your experience with this product"
                              />
                            </div>
                            <div className="flex space-x-2">
                              <button
                                type="submit"
                                className="px-4 py-2 bg-yellow-400 text-black rounded-lg font-medium text-sm hover:bg-yellow-500 transition-colors"
                              >
                                Submit Review
                              </button>
                              <button
                                type="button"
                                onClick={() => setShowReviewForm(false)}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-50 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </form>
                      )}

                      {/* Reviews List */}
                      <div className="space-y-3">
                        {reviews.length > 0 ? (
                          reviews.map((review, index) => (
                            <div key={index} className="border-b border-gray-100 pb-3 last:border-b-0">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <div className="flex items-center space-x-2 mb-1">
                                    <span className="font-medium text-sm text-black">{review.userName}</span>
                                    <div className="flex items-center">
                                      {renderRatingStars(review.rating)}
                                    </div>
                                  </div>
                                  <h4 className="font-medium text-sm text-black">{review.title}</h4>
                                </div>
                                <span className="text-xs text-gray-500">{review.date}</span>
                              </div>
                              <p className="text-sm text-gray-700">{review.comment}</p>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500 text-center py-4">
                            No reviews yet. Be the first to review this product!
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Color Selection */}
                    {product.colors && product.colors.length > 0 && (
                      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                        <h2 className="text-sm font-bold text-black mb-3 uppercase tracking-wide">Available Colors</h2>
                        <div className="flex flex-wrap gap-2">
                          {product.colors.map((color, index) => (
                            <button
                              key={index}
                              type="button"
                              className={`relative w-10 h-10 rounded-full border-2 focus:outline-none transition-all duration-200 shadow-sm hover:shadow-md color-button ${
                                selectedColor === color
                                  ? 'ring-2 ring-yellow-400 border-yellow-400 scale-110'
                                  : 'border-gray-300 hover:border-gray-400'
                              }`}
                              style={{ '--color': color } as React.CSSProperties}
                              onClick={() => setSelectedColor(color)}
                              aria-label={color}
                              title={color}
                            >
                              {selectedColor === color && (
                                <span className="absolute inset-0 flex items-center justify-center">
                                  <Check className="h-5 w-5 text-white drop-shadow-lg" />
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Size & Quantity Selection - Only show if product is not customizable */}
                    {!product.customizable && (
                      <div className="space-y-4">
                        {product.sizes && product.sizes.length > 0 && (
                          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                            <div className="flex items-center justify-between mb-3">
                              <h2 className="text-sm font-bold text-black uppercase tracking-wide">Size</h2>
                              <button
                                type="button"
                                onClick={() => setShowSizeGuide(true)}
                                className="text-sm font-medium text-yellow-600 hover:text-yellow-700 underline"
                              >
                                Size Guide
                              </button>
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                              {product.sizes.map((size, index) => {
                                // Get stock quantity for this size
                                const sizeStockItem = (product as any).sizeStock?.find((item: any) => item.size === size);
                                const stockQuantity = sizeStockItem?.quantity || 0;
                                const isOutOfStock = stockQuantity === 0;

                                return (
                                  <button
                                    key={index}
                                    type="button"
                                    disabled={isOutOfStock}
                                    className={`px-3 py-2 border-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md relative ${
                                      isOutOfStock
                                        ? 'border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed'
                                        : selectedSize === size
                                        ? 'bg-black border-black text-yellow-400'
                                        : 'border-gray-300 text-gray-700 hover:border-yellow-400 hover:bg-yellow-50'
                                    }`}
                                    onClick={() => {
                                      if (!isOutOfStock) {
                                        setSelectedSize(size);
                                        // Reset quantity to 1 when size changes to prevent invalid quantities
                                        setQuantity(1);
                                      }
                                    }}
                                  >
                                    <div className="flex flex-col items-center">
                                      <span className={isOutOfStock ? 'line-through' : ''}>{size}</span>
                                      <span className={`text-xs ${isOutOfStock ? 'text-red-500' : 'text-gray-500'}`}>
                                        {isOutOfStock ? '(0)' : `(${stockQuantity})`}
                                      </span>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                              Numbers in parentheses show available stock for each size
                            </p>
                          </div>
                        )}

                        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                          <h2 className="text-sm font-bold text-black uppercase tracking-wide mb-3">Quantity</h2>
                          <div className="flex items-center">
                            <button
                              type="button"
                              disabled={quantity <= 1}
                              onClick={() => handleQuantityChange(-1)}
                              className="p-2 border-2 border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 disabled:opacity-50 hover:border-yellow-400 transition-colors shadow-sm"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="h-4 w-4 text-gray-600" />
                            </button>
                            <input
                              type="number"
                              min="1"
                              aria-label="Product quantity"
                              max={(() => {
                                if (selectedSize) {
                                  const sizeStockItem = (product as any).sizeStock?.find((item: any) => item.size === selectedSize);
                                  return sizeStockItem?.quantity || 0;
                                }
                                return product.stockQuantity || 1;
                              })()}
                              value={quantity}
                              onChange={(e) => {
                                const inputValue = parseInt(e.target.value) || 1;
                                let maxStock = product.stockQuantity || 1;

                                // Get size-specific stock limit if size is selected
                                if (selectedSize) {
                                  const sizeStockItem = (product as any).sizeStock?.find((item: any) => item.size === selectedSize);
                                  maxStock = sizeStockItem?.quantity || 0;
                                }

                                const validQuantity = Math.max(1, Math.min(maxStock, inputValue));
                                setQuantity(validQuantity);
                              }}
                              className="w-16 border-t-2 border-b-2 border-gray-300 text-center focus:outline-none focus:ring-0 focus:border-yellow-400 text-sm font-medium"
                            />
                            <button
                              type="button"
                              disabled={(() => {
                                if (selectedSize) {
                                  const sizeStockItem = (product as any).sizeStock?.find((item: any) => item.size === selectedSize);
                                  return quantity >= (sizeStockItem?.quantity || 0);
                                }
                                return quantity >= (product.stockQuantity || 1);
                              })()}
                              onClick={() => handleQuantityChange(1)}
                              className="p-2 border-2 border-gray-300 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 disabled:opacity-50 hover:border-yellow-400 transition-colors shadow-sm"
                              aria-label="Increase quantity"
                            >
                              <Plus className="h-4 w-4 text-gray-600" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Delivery Options Section - Only show if delivery options exist and product is not customizable */}
                  {!product.customizable && (product as any).deliveryTimeOptions && (
                    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                      <h2 className="text-sm font-bold text-black mb-3 uppercase tracking-wide">Delivery Options</h2>
                      <div className="space-y-3">
                        {/* Standard Delivery */}
                        {(product as any).deliveryTimeOptions.standard?.enabled && (
                          <div 
                            className={`border rounded-lg p-3 cursor-pointer transition-all ${
                              selectedDeliveryOption === 'standard' 
                                ? 'border-yellow-400 bg-yellow-50' 
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => setSelectedDeliveryOption('standard')}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <input
                                  type="radio"
                                  name="deliveryOption"
                                  value="standard"
                                  checked={selectedDeliveryOption === 'standard'}
                                  onChange={(e) => setSelectedDeliveryOption(e.target.value)}
                                  className="h-4 w-4 text-yellow-400 focus:ring-yellow-400 border-gray-300"
                                />
                                <div className="ml-3">
                                  <p className="text-sm font-medium text-gray-900">Standard Delivery</p>
                                  <p className="text-xs text-gray-500">
                                    {(product as any).deliveryTimeOptions.standard.description || 
                                     `Delivered in ${(product as any).deliveryTimeOptions.standard.days} days`}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-bold text-gray-900">
                                  {(product as any).deliveryTimeOptions.standard.price > 0 
                                    ? `MWK ${(product as any).deliveryTimeOptions.standard.price.toLocaleString()}`
                                    : 'FREE'
                                  }
                                </p>
                                <p className="text-xs text-gray-500">
                                  {(product as any).deliveryTimeOptions.standard.days} day{(product as any).deliveryTimeOptions.standard.days !== 1 ? 's' : ''}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Express Delivery */}
                        {(product as any).deliveryTimeOptions.express?.enabled && (
                          <div 
                            className={`border rounded-lg p-3 cursor-pointer transition-all ${
                              selectedDeliveryOption === 'express' 
                                ? 'border-yellow-400 bg-yellow-50' 
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => setSelectedDeliveryOption('express')}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <input
                                  type="radio"
                                  name="deliveryOption"
                                  value="express"
                                  checked={selectedDeliveryOption === 'express'}
                                  onChange={(e) => setSelectedDeliveryOption(e.target.value)}
                                  className="h-4 w-4 text-yellow-400 focus:ring-yellow-400 border-gray-300"
                                />
                                <div className="ml-3">
                                  <p className="text-sm font-medium text-gray-900">Express Delivery</p>
                                  <p className="text-xs text-gray-500">
                                    {(product as any).deliveryTimeOptions.express.description || 
                                     `Delivered in ${(product as any).deliveryTimeOptions.express.days} days`}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-bold text-gray-900">
                                  {(product as any).deliveryTimeOptions.express.price > 0 
                                    ? `MWK ${(product as any).deliveryTimeOptions.express.price.toLocaleString()}`
                                    : 'FREE'
                                  }
                                </p>
                                <p className="text-xs text-gray-500">
                                  {(product as any).deliveryTimeOptions.express.days} day{(product as any).deliveryTimeOptions.express.days !== 1 ? 's' : ''}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Premium Delivery */}
                        {(product as any).deliveryTimeOptions.premium?.enabled && (
                          <div 
                            className={`border rounded-lg p-3 cursor-pointer transition-all ${
                              selectedDeliveryOption === 'premium' 
                                ? 'border-yellow-400 bg-yellow-50' 
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => setSelectedDeliveryOption('premium')}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <input
                                  type="radio"
                                  name="deliveryOption"
                                  value="premium"
                                  checked={selectedDeliveryOption === 'premium'}
                                  onChange={(e) => setSelectedDeliveryOption(e.target.value)}
                                  className="h-4 w-4 text-yellow-400 focus:ring-yellow-400 border-gray-300"
                                />
                                <div className="ml-3">
                                  <p className="text-sm font-medium text-gray-900">Premium Delivery</p>
                                  <p className="text-xs text-gray-500">
                                    {(product as any).deliveryTimeOptions.premium.description || 
                                     `Delivered in ${(product as any).deliveryTimeOptions.premium.days} days`}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-bold text-gray-900">
                                  {(product as any).deliveryTimeOptions.premium.price > 0 
                                    ? `MWK ${(product as any).deliveryTimeOptions.premium.price.toLocaleString()}`
                                    : 'FREE'
                                  }
                                </p>
                                <p className="text-xs text-gray-500">
                                  {(product as any).deliveryTimeOptions.premium.days} day{(product as any).deliveryTimeOptions.premium.days !== 1 ? 's' : ''}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="mt-6 space-y-3">
                    {/* Primary Action Button */}
                    {product.customizable ? (
                      <button
                        type="button"
                        onClick={handleCustomOrder}
                        className="w-full px-6 py-4 rounded-lg font-bold bg-gradient-to-r from-black to-gray-800 text-yellow-400 hover:from-gray-800 hover:to-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400 transition-all duration-200 shadow-lg hover:shadow-xl text-lg custom-order-glow"
                      >
                        <div className="flex items-center justify-center">
                          <Palette className="mr-3 h-5 w-5" />
                          <span>Request Custom Order</span>
                        </div>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleAddToCart}
                        disabled={!product.inStock || (product.stockQuantity || 0) <= 0 ||
                          (product.sizes && product.sizes.length > 0 && !selectedSize) ||
                          (product.colors && product.colors.length > 0 && !selectedColor)}
                        className={`w-full px-6 py-4 rounded-lg font-bold focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl text-lg ${
                          !product.inStock || (product.stockQuantity || 0) <= 0 ||
                          (product.sizes && product.sizes.length > 0 && !selectedSize) ||
                          (product.colors && product.colors.length > 0 && !selectedColor)
                            ? 'bg-gray-400 text-white cursor-not-allowed'
                            : isInCart(product._id)
                            ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-black hover:from-yellow-600 hover:to-yellow-700 focus:ring-yellow-400'
                            : 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-black hover:from-yellow-500 hover:to-yellow-600 focus:ring-yellow-400'
                        }`}
                        data-glow={
                          (!product.inStock || (product.stockQuantity || 0) <= 0 ||
                           (product.sizes && product.sizes.length > 0 && !selectedSize) ||
                           (product.colors && product.colors.length > 0 && !selectedColor)) ? 'false' : 'true'
                        }
                      >
                        <div className="flex items-center justify-center">
                          {!product.inStock || (product.stockQuantity || 0) <= 0 ? (
                            <>
                              <ShoppingCart className="mr-3 h-5 w-5 opacity-50" />
                              <span>Out of Stock</span>
                            </>
                          ) : (product.sizes && product.sizes.length > 0 && !selectedSize) ? (
                            <>
                              <ShoppingCart className="mr-3 h-5 w-5 opacity-50" />
                              <span>Select Size to Add to Cart</span>
                            </>
                          ) : (product.colors && product.colors.length > 0 && !selectedColor) ? (
                            <>
                              <ShoppingCart className="mr-3 h-5 w-5 opacity-50" />
                              <span>Select Color to Add to Cart</span>
                            </>
                          ) : (
                            <>
                              <ShoppingCart className="mr-3 h-5 w-5" />
                              <span>{isInCart(product._id) ? 'Added to Cart' : 'Add to Cart'}</span>
                            </>
                          )}
                        </div>
                      </button>
                    )}



                    {/* Secondary Actions */}
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        type="button"
                        onClick={handleToggleFavorite}
                        className="px-4 py-3 border-2 border-gray-300 rounded-lg font-medium text-gray-700 hover:border-yellow-400 hover:bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400 transition-all duration-200 shadow-sm hover:shadow-md"
                      >
                        <div className="flex items-center justify-center">
                          <Heart className={`mr-2 h-4 w-4 ${product && isProductFavorite(product._id) ? 'fill-red-500 text-red-500' : ''}`} />
                          <span className="text-sm">{product && isProductFavorite(product._id) ? 'Saved' : 'Save'}</span>
                        </div>
                      </button>
                      <button
                        type="button"
                        className="px-4 py-3 border-2 border-gray-300 rounded-lg font-medium text-gray-700 hover:border-yellow-400 hover:bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400 transition-all duration-200 shadow-sm hover:shadow-md"
                      >
                        <div className="flex items-center justify-center">
                          <Share className="mr-2 h-4 w-4" />
                          <span className="text-sm">Share</span>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsContactModalOpen(true)}
                        className="px-4 py-3 border-2 border-gray-300 rounded-lg font-medium text-gray-700 hover:border-yellow-400 hover:bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400 transition-all duration-200 shadow-sm hover:shadow-md"
                      >
                        <div className="flex items-center justify-center">
                          <MessageCircle className="mr-2 h-4 w-4" />
                          <span className="text-sm">Message</span>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Similar Products Section */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6 similar-products-glow">
          <SimilarProducts
            productId={product._id}
            title="You might also like"
            limit={6}
            showSimilarityScore={false}
            className=""
          />
        </div>
      </div>
    </div>

    {/* Contact Designer Modal */}
    {product && (
      <ContactDesignerModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        designer={{
          id: product.designer?._id || '',
          name: product.designer?.name || 'Designer',
          avatar: '',
          rating: 0
        }}
        product={{
          id: product._id || '',
          name: product.name || 'Product',
          image: product.images?.[0] || '',
          price: product.price || 0
        }}
      />
    )}

    {/* Product Custom Order Modal */}
    {product && showCustomOrder && (
      <ProductCustomOrder
        isOpen={showCustomOrder}
        onClose={() => setShowCustomOrder(false)}
        selectedImageFromDetail={selectedImage}
        product={{
          _id: product._id,
          name: product.name,
          images: product.images,
          designer: {
            _id: product.designer?._id || '',
            name: product.designer?.name || 'Designer',
            businessAddress: (product.designer as any)?.businessAddress
          },
          category: product.category,
          price: product.discountPrice || product.price,
          deliveryTimeOptions: (product as any).deliveryTimeOptions,
          customizable: product.customizable,
          description: product.description,
          tags: product.tags,
          colors: product.colors,
          sizes: product.sizes,
          materials: product.materials,
          inStock: product.inStock,
          rating: product.rating,
          reviewCount: product.reviewCount,
          discountPrice: product.discountPrice,
          stockQuantity: product.stockQuantity,
          featured: product.featured,
          createdAt: product.createdAt,
          updatedAt: product.updatedAt
        }}
      />
    )}

    {/* Image Gallery Modal */}
    {isImageGalleryOpen && product?.images && (
      <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center">
        <div className="relative max-w-4xl max-h-full p-4">
          <button
            type="button"
            onClick={closeImageGallery}
            className="absolute top-4 right-4 z-10 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all"
            aria-label="Close image gallery"
          >
            <X className="h-6 w-6" />
          </button>

          <div className="flex items-center justify-center">
            <img
              src={getImageUrl(product.images[currentImageIndex])}
              alt={`${product.name} - Image ${currentImageIndex + 1}`}
              className="max-w-full max-h-[80vh] object-contain"
              onError={handleImageError}
            />
          </div>

          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
            {currentImageIndex + 1} / {product.images.length}
          </div>
        </div>
      </div>
    )}

    {/* Size Guide Modal */}
    <SizeGuideModal
      isOpen={showSizeGuide}
      onClose={() => setShowSizeGuide(false)}
      category={product?.category}
    />
    </>
  );
};

export default ProductDetail;
