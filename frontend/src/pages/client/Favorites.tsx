import  { useState, useEffect } from 'react';
import { Heart, ShoppingCart, Star, X, ChevronDown, ChevronUp, Filter, Palette } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useFavorites } from '../../contexts/FavoritesContext';
import { useCart } from '../../contexts/CartContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../../utils/helpers';

interface FavoriteProduct {
  id: string;
  name: string;
  price: number;
  discountPrice?: number;
  image: string;
  designerId: string;
  designerName: string;
  rating: number;
  reviewCount: number;
}

interface FavoriteDesigner {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  reviewCount: number;
  productCount: number;
  specialties: string[];
}

// Mock data for demonstration
const mockFavoriteProducts: FavoriteProduct[] = [
  {
    id: 'p1',
    name: 'Traditional Chitenge Dress',
    price: 25000,
    image: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=500&q=80',
    designerId: 'd1',
    designerName: 'Chikondi Fashion',
    rating: 4.8,
    reviewCount: 24
  },
  {
    id: 'p2',
    name: 'Modern African Print Blazer',
    price: 35000,
    discountPrice: 28000,
    image: 'https://images.unsplash.com/photo-1593030942428-a5451dca4b42?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=500&q=80',
    designerId: 'd2',
    designerName: 'Madalitso Designs',
    rating: 4.5,
    reviewCount: 18
  },
  {
    id: 'p3',
    name: 'Handcrafted Beaded Necklace',
    price: 8000,
    image: 'https://images.unsplash.com/photo-1535632787350-4e68ef0ac584?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=500&q=80',
    designerId: 'd3',
    designerName: 'Ulemu Accessories',
    rating: 4.9,
    reviewCount: 31
  },
  {
    id: 'p4',
    name: 'Custom Tailored Suit',
    price: 75000,
    image: 'https://images.unsplash.com/photo-1592878940526-0214b0f374f6?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=500&q=80',
    designerId: 'd4',
    designerName: 'Blantyre Tailors',
    rating: 4.7,
    reviewCount: 42
  }
];

const mockFavoriteDesigners: FavoriteDesigner[] = [
  {
    id: 'd1',
    name: 'Chikondi Fashion',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200&q=80',
    rating: 4.8,
    reviewCount: 86,
    productCount: 32,
    specialties: ['Traditional Wear', 'Contemporary', 'Bridal']
  },
  {
    id: 'd2',
    name: 'Madalitso Designs',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200&q=80',
    rating: 4.6,
    reviewCount: 47,
    productCount: 24,
    specialties: ['Urban Streetwear', 'Casual', 'Athleisure']
  },
  {
    id: 'd3',
    name: 'Ulemu Accessories',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200&q=80',
    rating: 4.9,
    reviewCount: 122,
    productCount: 65,
    specialties: ['Jewelry', 'Beadwork', 'Handbags']
  }
];

type Tab = 'products' | 'designers';
type SortOption = 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc' | 'rating' | 'newest';

const Favorites = () => {
  const { user } = useAuth();
  const { addToast } = useNotification();
  const { t } = useLanguage();
  const { favorites, loading: favoritesLoading, removeFromFavorites } = useFavorites();
  const { addToCart } = useCart();
  const [activeTab, setActiveTab] = useState<Tab>('products');
  const [favoriteDesigners, setFavoriteDesigners] = useState<FavoriteDesigner[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('name-asc');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    // Load mock designers data (in a real app, this would come from a designers favorites context)
    setTimeout(() => {
      setFavoriteDesigners(mockFavoriteDesigners);
    }, 500);
  }, []);

  const handleRemoveProduct = (productId: string) => {
    removeFromFavorites(productId);
  };

  const handleRemoveDesigner = (designerId: string) => {
    setFavoriteDesigners(prevDesigners => prevDesigners.filter(designer => designer.id !== designerId));
    addToast('success', t('favorites.designerRemoved'));
  };

  const handleAddToCart = (product: any) => {
    addToCart(product, 1); // Add 1 quantity by default
    addToast('success', `${product.name} added to cart!`);
  };

  const sortedProducts = [...favorites].sort((a, b) => {
    switch (sortBy) {
      case 'name-asc':
        return a.name.localeCompare(b.name);
      case 'name-desc':
        return b.name.localeCompare(a.name);
      case 'price-asc':
        return a.price - b.price;
      case 'price-desc':
        return b.price - a.price;
      case 'rating':
        return (b.rating || 0) - (a.rating || 0);
      case 'newest':
        return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
      default:
        return 0;
    }
  });

  const sortedDesigners = [...favoriteDesigners].sort((a, b) => {
    switch (sortBy) {
      case 'name-asc':
        return a.name.localeCompare(b.name);
      case 'name-desc':
        return b.name.localeCompare(a.name);
      case 'rating':
        return b.rating - a.rating;
      default:
        return a.name.localeCompare(b.name);
    }
  });

  if (favoritesLoading) {
    return <LoadingSpinner />;
  }

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
        <span className="ml-1 text-xs text-gray-500">({rating.toFixed(1)})</span>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            {t('favorites.title')}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {t('favorites.description')}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('products')}
            className={`${
              activeTab === 'products'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            {t('favorites.products')}
            <span className="ml-2 py-0.5 px-2 rounded-full text-xs bg-gray-100">
              {favoriteProducts.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('designers')}
            className={`${
              activeTab === 'designers'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            {t('favorites.designers')}
            <span className="ml-2 py-0.5 px-2 rounded-full text-xs bg-gray-100">
              {favoriteDesigners.length}
            </span>
          </button>
        </nav>
      </div>

      {/* Filters and sorting */}
      <div className="bg-white shadow-sm rounded-lg p-4 mb-6">
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className="w-full flex justify-between items-center md:hidden px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <div className="flex items-center">
            <Filter className="mr-2 h-4 w-4" />
            {t('common.filtersAndSorting')}
          </div>
          {showFilters ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>

        <div className={`mt-4 md:mt-0 ${showFilters ? 'block' : 'hidden md:block'}`}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-end">
            <div className="w-full md:w-48">
              <label htmlFor="sort-by" className="block text-sm font-medium text-gray-700 mb-1 md:sr-only">
                {t('common.sortBy')}
              </label>
              <select
                id="sort-by"
                name="sort-by"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
              >
                <option value="name-asc">{t('common.nameAZ')}</option>
                <option value="name-desc">{t('common.nameZA')}</option>
                {activeTab === 'products' && (
                  <>
                    <option value="price-asc">{t('common.priceLowToHigh')}</option>
                    <option value="price-desc">{t('common.priceHighToLow')}</option>
                  </>
                )}
                <option value="rating">{t('common.topRated')}</option>
                {activeTab === 'products' && (
                  <option value="newest">{t('common.newest')}</option>
                )}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'products' ? (
        sortedProducts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <Heart className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">{t('favorites.noProducts')}</h3>
            <p className="mt-1 text-sm text-gray-500">{t('favorites.browseProducts')}</p>
            <div className="mt-6">
              <Link
                to="/client/products"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                {t('favorites.browseCatalog')}
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
            {sortedProducts.map((product) => (
              <div key={product._id} className="bg-white rounded-md shadow-sm border border-gray-300 overflow-hidden hover:shadow-lg hover:border-yellow-400 transition-all duration-200">
                {/* Product Image */}
                <div className="relative aspect-square">
                  <img
                    src={product.images?.[0] || '/placeholder-product.jpg'}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />

                  {/* Discount Badge */}
                  {product.originalPrice && product.originalPrice > product.price && (
                    <div className="absolute top-1 left-1 bg-yellow-500 text-black text-xs font-bold px-1.5 py-0.5 rounded">
                      -{Math.round((1 - product.price / product.originalPrice) * 100)}%
                    </div>
                  )}

                  {/* Remove from Favorites Button */}
                  <button
                    onClick={() => handleRemoveProduct(product._id)}
                    className="absolute top-1 right-1 p-1.5 bg-white/90 backdrop-blur-sm rounded-full hover:bg-red-100 transition-colors"
                    aria-label={t('favorites.removeFromFavorites')}
                  >
                    <X className="h-3 w-3 text-red-500" />
                  </button>

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
                  <h3
                    className="font-medium text-gray-900 text-xs truncate hover:text-black cursor-pointer"
                    title={product.name}
                    onClick={() => window.location.href = `/client/product/${product._id}`}
                  >
                    {product.name}
                  </h3>

                  {/* Designer Name */}
                  <p
                    className="text-xs text-gray-500 hover:text-blue-600 cursor-pointer truncate"
                    onClick={() => window.location.href = `/client/designer/${product.designer?._id}`}
                  >
                    by {product.designer?.name}
                  </p>

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
                        {formatCurrency(product.price)}
                      </span>
                      {product.originalPrice && product.originalPrice > product.price && (
                        <span className="text-xs text-gray-500 line-through">
                          {formatCurrency(product.originalPrice)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="mt-4">
                    <Link
                      to={`/client/product/${product._id}`}
                      className={`w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium transition-colors ${
                        product.customizable
                          ? 'bg-black hover:bg-gray-800 text-yellow-400'
                          : product.inStock
                            ? 'bg-yellow-500 hover:bg-yellow-600 text-black'
                            : 'bg-gray-400 text-gray-600 cursor-not-allowed pointer-events-none'
                      }`}
                    >
                      {product.customizable ? (
                        <>
                          <Palette className="mr-2 h-4 w-4" />
                          Custom Order
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="mr-2 h-4 w-4" />
                          {product.inStock ? 'Select Options' : 'Out of Stock'}
                        </>
                      )}
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        favoriteDesigners.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <Heart className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">{t('favorites.noDesigners')}</h3>
            <p className="mt-1 text-sm text-gray-500">{t('favorites.browseDesigners')}</p>
            <div className="mt-6">
              <Link
                to="/client/products"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                {t('favorites.browseCatalog')}
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {sortedDesigners.map((designer) => (
              <div key={designer.id} className="bg-white shadow-sm rounded-lg overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center">
                      <img
                        src={designer.avatar}
                        alt={designer.name}
                        className="h-16 w-16 rounded-full object-cover"
                      />
                      <div className="ml-4">
                        <h3 className="text-lg font-medium text-gray-900">{designer.name}</h3>
                        <div className="mt-1">
                          {renderRatingStars(designer.rating)}
                          <span className="ml-1 text-xs text-gray-500">
                            ({designer.reviewCount} reviews)
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveDesigner(designer.id)}
                      className="p-1 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      aria-label={t('favorites.removeFromFavorites')}
                    >
                      <X className="h-5 w-5 text-gray-500" />
                    </button>
                  </div>
                  
                  <div className="mt-4 border-t border-gray-200 pt-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">{t('favorites.productsAvailable')}</span>
                      <span className="font-medium">{designer.productCount}</span>
                    </div>
                    <div className="mt-2">
                      <h4 className="text-xs font-medium text-gray-700">{t('favorites.specialties')}</h4>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {designer.specialties.map((specialty, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-800"
                          >
                            {specialty}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <Link
                      to={`/client/designers/${designer.id}`}
                      className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      {t('favorites.viewDesigner')}
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
};

export default Favorites;
 