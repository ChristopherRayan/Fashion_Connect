import  { useState, useEffect } from 'react';
import { Plus, Edit, Trash, Image, Check, X, Upload, Star, Grid, List, Eye, ArrowUp, ArrowDown, DragDropContext, Droppable, Draggable } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { productService, Product } from '../../services/productService';
import { formatDate, formatCurrency } from '../../utils/helpers';
import { getOptimizedImageUrl, handleImageError } from '../../utils/imageUtils';
import LoadingSpinner from '../../components/common/LoadingSpinner';

// Review interface
interface Review {
  _id: string;
  product: string;
  user: {
    _id: string;
    name: string;
  };
  rating: number;
  title: string;
  comment: string;
  verified: boolean;
  helpfulCount: number;
  designerResponse?: {
    comment: string;
    date: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  image: string;
  featured: boolean;
  createdAt: string;
  order: number;
  category: string;
}

// Mock data for demonstration
const mockPortfolioItems: PortfolioItem[] = [
  {
    id: 'p1',
    title: 'Traditional Wedding Collection',
    description: 'Custom-designed wedding attire featuring traditional Malawian patterns and modern styling.',
    image: 'https://images.unsplash.com/photo-1596358930482-e5c0315f3d8f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600&q=80',
    featured: true,
    createdAt: '2025-05-15T10:30:00Z',
    order: 1,
    category: 'Bridal'
  },
  {
    id: 'p2',
    title: 'Contemporary Urban Wear',
    description: 'Modern street fashion with African design elements for the style-conscious youth.',
    image: 'https://images.unsplash.com/photo-1593030942428-a5451dca4b42?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600&q=80',
    featured: true,
    createdAt: '2025-06-20T08:45:00Z',
    order: 2,
    category: 'Casual'
  },
  {
    id: 'p3',
    title: 'Executive Formal Collection',
    description: 'Professional attire designed for the modern Malawian business environment.',
    image: 'https://images.unsplash.com/photo-1592878940526-0214b0f374f6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600&q=80',
    featured: false,
    createdAt: '2025-07-12T16:20:00Z',
    order: 3,
    category: 'Formal'
  },
  {
    id: 'p4',
    title: 'Chitenge Fashion Series',
    description: 'Innovative designs using traditional Chitenge fabric in contemporary styles.',
    image: 'https://images.unsplash.com/photo-1509319117193-57bab727e09d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600&q=80',
    featured: false,
    createdAt: '2025-08-05T13:10:00Z',
    order: 4,
    category: 'Traditional'
  },
  {
    id: 'p5',
    title: 'Festive Season Collection',
    description: 'Vibrant and celebratory designs perfect for holidays and special occasions.',
    image: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600&q=80',
    featured: false,
    createdAt: '2025-09-18T09:22:00Z',
    order: 5,
    category: 'Festive'
  }
];

const categories = ['All', 'mens', 'women', 'unisex', 'accessories', 'shoes'];

type ViewMode = 'grid' | 'list';

const Portfolio = () => {
  const { user } = useAuth();
  const { addToast } = useNotification();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productReviews, setProductReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await productService.getDesignerProducts({
        page: 1,
        limit: 100, // Get all products for portfolio
        sortBy: 'createdAt',
        sortType: 'desc'
      });
      setProducts(response.docs);
    } catch (error) {
      console.error('Error fetching products:', error);
      addToast('error', 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  // Handle product detail modal
  const handleViewProduct = async (product: Product) => {
    setSelectedProduct(product);
    await fetchProductReviews(product._id);
  };

  const fetchProductReviews = async (productId: string) => {
    try {
      setReviewsLoading(true);
      const response = await productService.getProductReviews(productId);

      // Handle different response formats
      if (Array.isArray(response)) {
        setProductReviews(response);
      } else if (response && response.docs) {
        setProductReviews(response.docs);
      } else if (response && (response as any).data) {
        setProductReviews(Array.isArray((response as any).data) ? (response as any).data : []);
      } else {
        setProductReviews([]);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setProductReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  };

  const closeProductModal = () => {
    setSelectedProduct(null);
    setProductReviews([]);
  };





  const filteredProducts = selectedCategory === 'All'
    ? products
    : products.filter(product => product.category === selectedCategory);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            My Products Portfolio
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            View and manage all your uploaded products
          </p>
        </div>
        <div className="text-sm text-gray-600">
          <span className="font-medium">{filteredProducts.length}</span> products
        </div>
      </div>

      {/* Filters and View Options */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3 py-1 rounded-full text-sm ${
                    selectedCategory === category
                      ? 'bg-primary-100 text-primary-800 font-medium'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
            <div className="flex items-center">
              <span className="mr-2 text-sm text-gray-500">{t('common.view')}:</span>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md ${
                  viewMode === 'grid'
                    ? 'bg-primary-100 text-primary-800'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
                aria-label={t('common.gridView')}
              >
                <Grid className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md ${
                  viewMode === 'list'
                    ? 'bg-primary-100 text-primary-800'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
                aria-label={t('common.listView')}
              >
                <List className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Products */}
        <div className="p-4">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <Image className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {selectedCategory === 'All'
                  ? 'You haven\'t uploaded any products yet. Go to Product Management to add your first product.'
                  : `No products found in the ${selectedCategory} category.`
                }
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredProducts.map((product) => (
                <div key={product._id} className="group relative bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="aspect-square bg-gray-200 group-hover:opacity-75 overflow-hidden">
                    <img
                      src={getOptimizedImageUrl(product.images[0], 300, 300)}
                      alt={product.name}
                      className="w-full h-full object-center object-cover"
                      onError={handleImageError}
                    />
                    {product.featured && (
                      <div className="absolute top-2 right-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                          <Star className="mr-1 h-3 w-3" />
                          Featured
                        </span>
                      </div>
                    )}
                    {!product.inStock && (
                      <div className="absolute top-2 left-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Out of Stock
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-900 truncate">{product.name}</h3>
                        <p className="mt-1 text-sm text-gray-500 line-clamp-2">{product.description}</p>
                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg font-semibold text-gray-900">
                              {formatCurrency(product.discountPrice || product.price)}
                            </span>
                            {product.discountPrice && (
                              <span className="text-sm text-gray-500 line-through">
                                {formatCurrency(product.price)}
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-gray-500 capitalize">{product.category}</span>
                        </div>
                        <div className="mt-2 flex items-center text-xs text-gray-500">
                          <Star className="h-3 w-3 mr-1" />
                          <span>{product.rating.toFixed(1)} ({product.reviewCount} reviews)</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex justify-between items-center">
                      <div className="text-xs text-gray-500">
                        Created: {formatDate(product.createdAt)}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleViewProduct(product)}
                        className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-hidden rounded-md">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProducts.map((product, index) => (
                    <tr key={product._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <img className="h-10 w-10 rounded-md object-cover" src={getOptimizedImageUrl(product.images[0], 40, 40)} alt={product.name} onError={handleImageError} />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{product.name}</div>
                            <div className="text-sm text-gray-500 truncate max-w-xs">{product.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 capitalize">{product.category}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatCurrency(product.discountPrice || product.price)}
                          {product.discountPrice && (
                            <span className="ml-2 text-xs text-gray-500 line-through">
                              {formatCurrency(product.price)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          {product.featured && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                              <Star className="mr-1 h-3 w-3" />
                              Featured
                            </span>
                          )}
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            product.inStock
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {product.inStock ? 'In Stock' : 'Out of Stock'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          type="button"
                          onClick={() => handleViewProduct(product)}
                          className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={closeProductModal}></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              {/* Modal Header */}
              <div className="bg-white px-6 pt-6 pb-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Product Details
                  </h3>
                  <button
                    type="button"
                    onClick={closeProductModal}
                    className="bg-white rounded-md text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    <span className="sr-only">Close</span>
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="bg-white px-6 py-6 max-h-96 overflow-y-auto">
                {/* Product Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {/* Product Image */}
                  <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
                    <img
                      src={getOptimizedImageUrl(selectedProduct.images[0], 400, 400)}
                      alt={selectedProduct.name}
                      className="w-full h-full object-center object-cover"
                      onError={handleImageError}
                    />
                  </div>

                  {/* Product Details */}
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedProduct.name}</h2>
                    <p className="text-gray-600 mb-4">{selectedProduct.description}</p>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-500">Price:</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-lg font-semibold text-gray-900">
                            {formatCurrency(selectedProduct.discountPrice || selectedProduct.price)}
                          </span>
                          {selectedProduct.discountPrice && (
                            <span className="text-sm text-gray-500 line-through">
                              {formatCurrency(selectedProduct.price)}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-500">Category:</span>
                        <span className="text-sm text-gray-900 capitalize">{selectedProduct.category}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-500">Stock:</span>
                        <span className={`text-sm font-medium ${
                          selectedProduct.inStock ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {selectedProduct.inStock ? `In Stock (${selectedProduct.stockQuantity})` : 'Out of Stock'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-500">Rating:</span>
                        <div className="flex items-center space-x-1">
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-4 w-4 ${
                                  star <= selectedProduct.rating
                                    ? 'text-yellow-400 fill-current'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-gray-600">
                            {selectedProduct.rating.toFixed(1)} ({selectedProduct.reviewCount} reviews)
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-500">Created:</span>
                        <span className="text-sm text-gray-900">{formatDate(selectedProduct.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Reviews Section */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Customer Reviews ({productReviews.length})
                  </h3>

                  {reviewsLoading ? (
                    <div className="flex justify-center py-8">
                      <LoadingSpinner />
                    </div>
                  ) : productReviews.length > 0 ? (
                    <div className="space-y-4 max-h-64 overflow-y-auto">
                      {productReviews.map((review) => (
                        <div key={review._id} className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center space-x-3">
                              <div className="h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center">
                                <span className="text-sm font-semibold text-primary-600">
                                  {(review.user?.name || 'A').charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <h4 className="text-sm font-medium text-gray-900">{review.user?.name || 'Anonymous'}</h4>
                                <div className="flex items-center space-x-1">
                                  <div className="flex">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <Star
                                        key={star}
                                        className={`h-3 w-3 ${
                                          star <= review.rating
                                            ? 'text-yellow-400 fill-current'
                                            : 'text-gray-300'
                                        }`}
                                      />
                                    ))}
                                  </div>
                                  <span className="text-xs text-gray-500">
                                    {formatDate(review.createdAt)}
                                  </span>
                                </div>
                              </div>
                            </div>
                            {review.verified && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Verified Purchase
                              </span>
                            )}
                          </div>

                          <div className="ml-11">
                            <h5 className="text-sm font-medium text-gray-900 mb-1">{review.title}</h5>
                            <p className="text-sm text-gray-700">{review.comment}</p>

                            {review.designerResponse && (
                              <div className="mt-3 bg-white rounded p-3 border-l-4 border-primary-500">
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className="text-xs font-medium text-primary-600">Designer Response</span>
                                  <span className="text-xs text-gray-500">
                                    {formatDate(review.designerResponse.date)}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-700">{review.designerResponse.comment}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Star className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No reviews yet</h3>
                      <p className="mt-1 text-sm text-gray-500">This product hasn't received any reviews yet.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Portfolio;
 