import  { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash, Search, Filter, ChevronDown, ChevronUp, ArrowUp, ArrowDown, Package, Eye, Grid, List, Star, X } from 'lucide-react';

import { useNotification } from '../../contexts/NotificationContext';
import { useLanguage } from '../../contexts/LanguageContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ImageUpload from '../../components/common/ImageUpload';
import MeasurementSelector from '../../components/common/MeasurementSelector';
import { productService, Product, Review, ProductImage, MeasurementConfig } from '../../services/productService';
import { handleImageError, getOptimizedImageUrl } from '../../utils/imageUtils';
import { formatDate, formatCurrency } from '../../utils/helpers';



// Product status mapping for display
const getProductStatus = (product: Product): 'active' | 'draft' | 'out_of_stock' => {
  if (product.stockQuantity === 0) return 'out_of_stock';
  if (product.featured) return 'active';
  return 'draft';
};

type SortField = 'name' | 'price' | 'stockQuantity' | 'createdAt' | 'rating' | 'reviewCount';
type SortDirection = 'asc' | 'desc';
type FilterStatus = 'all' | 'active' | 'draft' | 'out_of_stock';
type ViewMode = 'table' | 'grid';

interface ProductFormData {
  _id?: string;
  name: string;
  description: string;
  price: number;
  discountPrice?: number;
  stock: number;
  category: string[];
  tags: string[];
  images: (string | ProductImage)[];
  sizes: string[];
  colors: string[];
  sizeStock: { size: string; quantity: number }[];
  isFeatured: boolean;
  isCustomizable: boolean;
  measurementConfig: MeasurementConfig;
  deliveryTimeOptions: {
    standard: { enabled: boolean; days: number; description: string; price: number };
    express: { enabled: boolean; days: number; description: string; price: number };
    premium: { enabled: boolean; days: number; description: string; price: number };
  };
}

const ProductManagement = () => {
  const { addToast } = useNotification();
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductFormData | null>(null);
  const [categories, setCategories] = useState<string[]>([]);

  // View mode and portfolio functionality
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productReviews, setProductReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  // Pagination
  const [currentPage] = useState(1);

  // Check if we should auto-open the modal for new product creation
  useEffect(() => {
    if (location.pathname.includes('/products/new')) {
      // Open the new product modal
      setEditingProduct({
        name: '',
        description: '',
        price: 0,
        discountPrice: undefined,
        stock: 0,
        category: [],
        tags: [],
        images: [],
        sizes: [],
        colors: [],
        sizeStock: [],
        isFeatured: false,
        isCustomizable: false,
        measurementConfig: {
          enabled: false,
          guideImage: undefined,
          requiredMeasurements: []
        },
        deliveryTimeOptions: {
          standard: { enabled: true, days: 14, description: 'Standard custom order delivery', price: 0 },
          express: { enabled: true, days: 7, description: 'Express custom order delivery', price: 2000 },
          premium: { enabled: true, days: 3, description: 'Premium rush custom order delivery', price: 5000 }
        }
      });
      setIsModalOpen(true);
      // Navigate back to the products route without the '/new' to clean up the URL
      navigate('/designer/products', { replace: true });
    }
  }, [location.pathname, navigate]);

  // Load categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categoriesData = await productService.getCategories();
        setCategories(categoriesData);
      } catch (error) {
        console.error('Failed to load categories:', error);
        setCategories([
          // Main Categories
          "Men",
          "Women", 
          "Adult",
          "Kids",
          // Specific Categories
          "Men's - Top",
          "Men's - Bottom",
          "Women's - Top",
          "Women's - Bottom",
          "Unisex - Top",
          "Unisex - Bottom",
          // Style Categories
          "Formal Wear",
          "Traditional Wear",
          "Suit",
          "Accessories",
          "Footwear"
        ]);
      }
    };

    loadCategories();
  }, []);

  // Load products
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const params = {
          page: currentPage,
          limit: 10,
          query: searchQuery || undefined,
          category: categoryFilter !== 'all' ? categoryFilter : undefined,
          sortBy: sortField,
          sortType: sortDirection
        };

        const response = await productService.getDesignerProducts(params);
        setProducts(response.docs);
      } catch (error) {
        console.error('Failed to load products:', error);
        addToast('error', 'Failed to load products');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [currentPage, searchQuery, categoryFilter, sortField, sortDirection, addToast]);

  const handleDelete = async (productId: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      await productService.deleteProduct(productId);
      setProducts(prevProducts => prevProducts.filter(product => product._id !== productId));
      addToast('success', 'Product deleted successfully');
    } catch (error) {
      console.error('Failed to delete product:', error);
      addToast('error', 'Failed to delete product');
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct({
      _id: product._id,
      name: product.name,
      description: product.description,
      price: product.price,
      discountPrice: product.discountPrice,
      stock: product.stockQuantity || 0,
      category: Array.isArray(product.category) ? product.category : [product.category],
      tags: product.tags,
      images: product.images,
      sizes: product.sizes || [],
      colors: product.colors || [],
      sizeStock: (product as any).sizeStock || [],
      isFeatured: product.featured || false,
      isCustomizable: product.customizable || false,
      measurementConfig: product.measurementConfig || {
        enabled: false,
        guideImage: undefined,
        requiredMeasurements: []
      },
      deliveryTimeOptions: (product as any).deliveryTimeOptions || {
        standard: { enabled: true, days: 14, description: 'Standard delivery', price: 0 },
        express: { enabled: true, days: 7, description: 'Express delivery', price: 0 },
        premium: { enabled: true, days: 3, description: 'Premium delivery', price: 0 }
      }
    });
    setIsModalOpen(true);
  };

  // Portfolio functionality
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

  const handleCreateNew = () => {
    setEditingProduct({
      name: '',
      description: '',
      price: 0,
      discountPrice: undefined,
      stock: 0,
      category: [],
      tags: [],
      images: [],
      sizes: [],
      colors: [],
      sizeStock: [],
      isFeatured: false,
      isCustomizable: false,
      measurementConfig: {
        enabled: false,
        guideImage: undefined,
        requiredMeasurements: []
      },
      deliveryTimeOptions: {
        standard: { enabled: true, days: 14, description: 'Standard custom order delivery', price: 0 },
        express: { enabled: true, days: 7, description: 'Express custom order delivery', price: 2000 },
        premium: { enabled: true, days: 3, description: 'Premium rush custom order delivery', price: 5000 }
      }
    });
    setIsModalOpen(true);
  };

  const handleSortChange = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getUniqueCategories = () => {
    const uniqueCategories = new Set(products.map(product => product.category));
    return Array.from(uniqueCategories);
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ChevronDown className="ml-1 h-4 w-4 text-gray-400" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="ml-1 h-4 w-4 text-primary-500" />
    ) : (
      <ArrowDown className="ml-1 h-4 w-4 text-primary-500" />
    );
  };

  const getFilteredProducts = () => {
    return products.filter(product => {
      const status = getProductStatus(product);

      // Apply status filter
      if (statusFilter !== 'all' && status !== statusFilter) {
        return false;
      }

      // Apply category filter
      if (categoryFilter !== 'all' && product.category !== categoryFilter) {
        return false;
      }

      // Apply search query
      if (searchQuery.trim() !== '' && !product.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      return true;
    });
  };

  const getSortedProducts = () => {
    // Since we're using server-side sorting, just return filtered products
    return getFilteredProducts();
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    // Validate form
    if (!editingProduct.name.trim()) {
      addToast('error', 'Product name is required');
      return;
    }

    if (editingProduct.price <= 0) {
      addToast('error', 'Price must be greater than 0');
      return;
    }

    if (editingProduct.discountPrice && editingProduct.discountPrice >= editingProduct.price) {
      addToast('error', 'Discount price must be less than original price');
      return;
    }

    if (!editingProduct.isCustomizable && editingProduct.stock < 0) {
      addToast('error', 'Stock quantity cannot be negative');
      return;
    }

    if (!editingProduct.description.trim()) {
      addToast('error', 'Product description is required');
      return;
    }

    if (editingProduct.category.length === 0) {
      addToast('error', 'At least one category is required');
      return;
    }

    if (editingProduct.images.length === 0 || editingProduct.images.every(img => {
      // Check if img is a string or an object
      if (typeof img === 'string') {
        return !img.trim();
      } else if (img && typeof img === 'object' && 'url' in img) {
        // It's a ProductImage object
        return !img.url.trim();
      }
      return true; // Consider empty or invalid images as needing to be filtered out
    })) {
      addToast('error', 'At least one product image is required');
      return;
    }

    try {
      setLoading(true);

      const productData = {
        name: editingProduct.name,
        description: editingProduct.description,
        price: editingProduct.price,
        discountPrice: editingProduct.discountPrice,
        images: editingProduct.images.filter(img => {
          if (typeof img === 'string') {
            return img.trim();
          } else if (img && typeof img === 'object' && 'url' in img) {
            return img.url.trim();
          }
          return false;
        }).map(img => {
          // Preserve image objects with color metadata; keep strings as-is
          if (typeof img === 'string') {
            return img;
          } else if (img && typeof img === 'object' && 'url' in img) {
            // Only keep fields we support on backend
            const { url, colorName, colorLabel, description } = img as ProductImage;
            return { url, colorName, colorLabel, description };
          }
          return '';
        }),
        category: editingProduct.category.length > 0 ? editingProduct.category.join(', ') : 'Unclassified',
        tags: editingProduct.tags,
        // Always send colors so they are saved and visible to buyers
        colors: editingProduct.colors,
        // Keep sizes and sizeStock as entered; backend can decide how to use for customizable products
        sizes: editingProduct.sizes,
        sizeStock: editingProduct.sizeStock,
        stockQuantity: editingProduct.isCustomizable ? undefined : editingProduct.stock,
        featured: editingProduct.isFeatured,
        customizable: editingProduct.isCustomizable,
        measurementConfig: editingProduct.measurementConfig,
        deliveryTimeOptions: editingProduct.deliveryTimeOptions
      };

      if (editingProduct._id) {
        // Update existing product
        const updatedProduct = await productService.updateProduct(editingProduct._id, productData);
        setProducts(prevProducts => prevProducts.map(product =>
          product._id === editingProduct._id ? updatedProduct : product
        ));
        addToast('success', 'Product updated successfully');
      } else {
        // Create new product
        const newProduct = await productService.createProduct(productData);
        setProducts(prevProducts => [newProduct, ...prevProducts]);
        addToast('success', 'Product created successfully');
      }

      setIsModalOpen(false);
      setEditingProduct(null);
    } catch (error) {
      console.error('Failed to save product:', error);
      
      // Extract more detailed error message if available
      let errorMessage = 'Failed to save product';
      
      if (error instanceof Error) {
        // Check if the error message contains information about images
        if (error.message.includes('images')) {
          errorMessage = 'Error with product images. Please make sure all images are valid.';
        } else if (error.message.includes('validation failed')) {
          errorMessage = 'Product validation failed. Please check all required fields.';
        } else if (error.message.length > 0) {
          // Use the error message if it's not empty
          errorMessage = `Error: ${error.message.split('\n')[0]}`;
        }
      }
      
      addToast('error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  const getStatusBadge = (product: Product) => {
    const status = getProductStatus(product);
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Active
          </span>
        );
      case 'draft':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Draft
          </span>
        );
      case 'out_of_stock':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            Out of Stock
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 bg-gray-50 min-h-screen">
      <div className="bg-gray-900 shadow-lg rounded-lg p-6 border-2 border-yellow-400">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-yellow-400">
              Product Management & Portfolio
            </h1>
            <p className="mt-1 text-sm text-gray-300">
              Manage your products and view your portfolio
            </p>
          </div>
        <div className="flex items-center space-x-4">
          {/* View Mode Toggle */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-300">View:</span>
            <div className="flex rounded-md shadow-sm">
              <button
                type="button"
                title="Table view"
                onClick={() => setViewMode('table')}
                className={`px-3 py-2 text-sm font-medium rounded-l-md border-2 transition-colors ${
                  viewMode === 'table'
                    ? 'bg-yellow-400 text-gray-900 border-yellow-400'
                    : 'bg-gray-800 text-white border-gray-600 hover:bg-gray-700'
                }`}
              >
                <List className="h-4 w-4" />
              </button>
              <button
                type="button"
                title="Grid view"
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 text-sm font-medium rounded-r-md border-t-2 border-r-2 border-b-2 transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-yellow-400 text-gray-900 border-yellow-400'
                    : 'bg-gray-800 text-white border-gray-600 hover:bg-gray-700'
                }`}
              >
                <Grid className="h-4 w-4" />
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCreateNew}
            className="inline-flex items-center px-4 py-2 border-2 border-yellow-400 rounded-md shadow-sm text-sm font-medium text-gray-900 bg-yellow-400 hover:bg-yellow-300 hover:border-yellow-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors"
          >
            <Plus className="mr-2 h-4 w-4" />
            {t('product.createNew')}
          </button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-gray-900 shadow-lg rounded-lg overflow-hidden border-2 border-yellow-400">
        <div className="p-4">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-yellow-400" />
              </div>
              <input
                type="search"
                placeholder={t('product.searchProducts')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border-2 border-gray-600 rounded-md leading-5 bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:placeholder-gray-300 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 sm:text-sm"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden inline-flex items-center px-4 py-3 border-2 border-gray-600 shadow-sm text-sm font-medium rounded-md text-white bg-gray-800 hover:bg-gray-700 hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
            >
              <Filter className="mr-2 h-4 w-4" />
              {t('common.filters')}
              {showFilters ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
            </button>
          </div>

          <div className={`mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 ${showFilters ? 'block' : 'hidden md:grid'}`}>
            <div>
              <label htmlFor="status-filter" className="block text-sm font-medium text-gray-300 mb-2">
                {t('product.status')}
              </label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as FilterStatus)}
                className="block w-full pl-3 pr-10 py-3 text-base border-2 border-gray-600 bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 sm:text-sm rounded-md"
              >
                <option value="all">{t('common.all')}</option>
                <option value="active">{t('product.active')}</option>
                <option value="draft">{t('product.draft')}</option>
                <option value="out_of_stock">{t('product.outOfStock')}</option>
              </select>
            </div>
            <div>
              <label htmlFor="category-filter" className="block text-sm font-medium text-gray-300 mb-2">
                {t('product.category')}
              </label>
              <select
                id="category-filter"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="block w-full pl-3 pr-10 py-3 text-base border-2 border-gray-600 bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 sm:text-sm rounded-md"
              >
                <option value="all">{t('common.all')}</option>
                {getUniqueCategories().map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Products Display */}
        {viewMode === 'table' ? (
          <div className="bg-gray-900 shadow-lg rounded-lg overflow-hidden border-2 border-yellow-400">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-yellow-400">
                <thead className="bg-gray-800">
                  <tr>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-yellow-400 uppercase tracking-wider">
                      <button
                        type="button"
                        onClick={() => handleSortChange('name')}
                        className="group inline-flex items-center focus:outline-none hover:text-yellow-300 transition-colors"
                      >
                        {t('product.product')}
                        {getSortIcon('name')}
                      </button>
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-yellow-400 uppercase tracking-wider">
                      <button
                        type="button"
                        onClick={() => handleSortChange('price')}
                        className="group inline-flex items-center focus:outline-none hover:text-yellow-300 transition-colors"
                      >
                        {t('product.price')}
                        {getSortIcon('price')}
                      </button>
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-yellow-400 uppercase tracking-wider">
                      <button
                        type="button"
                        onClick={() => handleSortChange('stockQuantity')}
                        className="group inline-flex items-center focus:outline-none hover:text-yellow-300 transition-colors"
                      >
                        Stock
                        {getSortIcon('stockQuantity')}
                      </button>
                    </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    type="button"
                    onClick={() => handleSortChange('reviewCount')}
                    className="group inline-flex items-center focus:outline-none"
                  >
                    Reviews
                    {getSortIcon('reviewCount')}
                  </button>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    type="button"
                    onClick={() => handleSortChange('rating')}
                    className="group inline-flex items-center focus:outline-none"
                  >
                    Rating
                    {getSortIcon('rating')}
                  </button>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('product.status')}
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('common.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {getSortedProducts().length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center">
                    <Package className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">{t('product.noProductsFound')}</h3>
                    <p className="mt-1 text-sm text-gray-500">{t('product.tryDifferentFilters')}</p>
                  </td>
                </tr>
              ) : (
                getSortedProducts().map((product) => (
                  <tr key={product._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <img
                            className="h-10 w-10 rounded-md object-cover border border-gray-200"
                            src={getOptimizedImageUrl(product.images[0], 40, 40)}
                            alt={product.name}
                            onError={handleImageError}
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                          <div className="text-sm text-gray-500">{product.category}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        {product.discountPrice ? (
                          <>
                            <div className="text-sm font-medium text-red-600">MWK {product.discountPrice.toLocaleString()}</div>
                            <div className="text-xs text-gray-500 line-through">MWK {product.price.toLocaleString()}</div>
                            <div className="text-xs text-red-600 font-medium">
                              {Math.round(((product.price - product.discountPrice) / product.price) * 100)}% OFF
                            </div>
                          </>
                        ) : (
                          <div className="text-sm font-medium text-gray-900">MWK {product.price.toLocaleString()}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{product.stockQuantity || 0}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{product.reviewCount}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm text-gray-900">{product.rating.toFixed(1)}</span>
                        <span className="ml-1 text-yellow-400">★</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(product)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button
                        type="button"
                        onClick={() => handleViewProduct(product)}
                        className="inline-flex items-center p-1 border border-transparent rounded-full shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        aria-label="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEdit(product)}
                        className="inline-flex items-center p-1 border border-transparent rounded-full shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        aria-label="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(product._id)}
                        className="inline-flex items-center p-1 border border-transparent rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        aria-label="Delete"
                      >
                        <Trash className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
            </div>
          </div>
        ) : (
          /* Grid View */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {getSortedProducts().map((product) => (
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
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => handleViewProduct(product)}
                        className="inline-flex items-center px-2 py-1 border border-gray-300 rounded text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEdit(product)}
                        className="inline-flex items-center px-2 py-1 border border-gray-300 rounded text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(product._id)}
                        className="inline-flex items-center px-2 py-1 border border-red-300 rounded text-xs font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        <Trash className="h-3 w-3 mr-1" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination would go here */}
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                {t('common.showing')} <span className="font-medium">{getSortedProducts().length}</span> {t('common.of')}{' '}
                <span className="font-medium">{products.length}</span> {t('product.products')}
              </p>
            </div>
            {/* Pagination controls would go here */}
          </div>
        </div>
      </div>

      {/* Product Form Modal */}
      {isModalOpen && editingProduct && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-900 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-gray-900 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full border-2 border-yellow-400">
              <form onSubmit={handleSubmit}>
                {/* Modal Header */}
                <div className="bg-gray-900 px-6 pt-6 pb-4 border-b-2 border-yellow-400">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl leading-6 font-bold text-yellow-400">
                      {editingProduct._id ? 'Edit Product' : 'Create Product'}
                    </h3>
                    <button
                      type="button"
                      title="Close modal"
                      onClick={() => {
                        setIsModalOpen(false);
                        setEditingProduct(null);
                      }}
                      className="text-gray-400 hover:text-yellow-400 transition-colors"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                </div>

                {/* Modal Content */}
                <div className="bg-gray-900 px-6 py-6 max-h-[70vh] overflow-y-auto">
                  <div className="space-y-6">

                    {/* Step 1: Product Name */}
                    <div className="bg-gray-800 p-4 rounded-lg border border-yellow-400">
                      <h4 className="text-lg font-semibold text-yellow-400 mb-4">1. Product Information</h4>
                      <div>
                        <label htmlFor="product-name" className="block text-sm font-medium text-gray-300 mb-2">
                          Product Name *
                        </label>
                        <input
                          type="text"
                          id="product-name"
                          value={editingProduct.name}
                          onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                          className="w-full border-2 border-gray-600 rounded-md shadow-sm py-3 px-4 bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 text-sm"
                          placeholder="Enter product name"
                          required
                        />
                      </div>
                    </div>

                    {/* Step 2: Product Type */}
                    <div className="bg-gray-800 p-4 rounded-lg border border-yellow-400">
                      <h4 className="text-lg font-semibold text-yellow-400 mb-4">2. Product Type</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors hover:bg-gray-700 ${editingProduct.isCustomizable ? 'border-yellow-400 bg-gray-700' : 'border-gray-600'}">
                          <input
                            type="radio"
                            name="productType"
                            checked={editingProduct.isCustomizable}
                            onChange={() => setEditingProduct({
                              ...editingProduct,
                              isCustomizable: true,
                              sizes: [] // Clear sizes for customizable products
                            })}
                            className="h-4 w-4 text-yellow-400 focus:ring-yellow-400 border-gray-600 bg-gray-700"
                          />
                          <div className="ml-3">
                            <span className="text-sm font-medium text-white">Customizable</span>
                            <p className="text-xs text-gray-400">Made to order with custom measurements</p>
                          </div>
                        </label>
                        <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors hover:bg-gray-700 ${!editingProduct.isCustomizable ? 'border-yellow-400 bg-gray-700' : 'border-gray-600'}">
                          <input
                            type="radio"
                            name="productType"
                            checked={!editingProduct.isCustomizable}
                            onChange={() => setEditingProduct({
                              ...editingProduct,
                              isCustomizable: false
                            })}
                            className="h-4 w-4 text-yellow-400 focus:ring-yellow-400 border-gray-600 bg-gray-700"
                          />
                          <div className="ml-3">
                            <span className="text-sm font-medium text-white">Ready-Made</span>
                            <p className="text-xs text-gray-400">Pre-made in standard sizes</p>
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* Step 3: Product Images */}
                    <div className="bg-gray-800 p-4 rounded-lg border border-yellow-400">
                      <h4 className="text-lg font-semibold text-yellow-400 mb-4">3. Product Images *</h4>
                      <div className="bg-gray-700 p-4 rounded-lg">
                        <ImageUpload
                          images={editingProduct.images}
                          onChange={(images) => setEditingProduct({ ...editingProduct, images })}
                          maxImages={20}
                          required={true}
                          supportColorMetadata={true}
                        />
                        <p className="text-xs text-gray-400 mt-2">
                          Upload up to 20 high-quality images. First image will be the main product image.
                          Add color names to help customers choose the right variant.
                        </p>
                      </div>
                    </div>

                    {/* Step 4: Delivery Options for Custom Orders */}
                    {editingProduct.isCustomizable && (
                      <div className="bg-gray-800 p-4 rounded-lg border border-yellow-400">
                        <h4 className="text-lg font-semibold text-yellow-400 mb-4">4. Custom Order Delivery Options</h4>
                        <p className="text-sm text-gray-300 mb-4">
                          Configure delivery timeframes for custom orders. Customers will choose from enabled options.
                        </p>

                        <div className="space-y-4">
                          {/* Standard Delivery */}
                          <div className="border border-gray-600 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <label className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={editingProduct.deliveryTimeOptions.standard.enabled}
                                  onChange={(e) => setEditingProduct({
                                    ...editingProduct,
                                    deliveryTimeOptions: {
                                      ...editingProduct.deliveryTimeOptions,
                                      standard: {
                                        ...editingProduct.deliveryTimeOptions.standard,
                                        enabled: e.target.checked
                                      }
                                    }
                                  })}
                                  className="h-4 w-4 text-yellow-400 focus:ring-yellow-400 border-gray-600 bg-gray-700 rounded"
                                />
                                <span className="ml-2 text-sm font-medium text-white">Standard Delivery</span>
                              </label>
                            </div>
                            {editingProduct.deliveryTimeOptions.standard.enabled && (
                              <div className="grid grid-cols-3 gap-4">
                                <div>
                                  <label className="block text-xs font-medium text-gray-300 mb-1">Days</label>
                                  <input
                                    type="number"
                                    min="1"
                                    max="365"
                                    title="Standard delivery days"
                                    value={editingProduct.deliveryTimeOptions.standard.days}
                                    onChange={(e) => setEditingProduct({
                                      ...editingProduct,
                                      deliveryTimeOptions: {
                                        ...editingProduct.deliveryTimeOptions,
                                        standard: {
                                          ...editingProduct.deliveryTimeOptions.standard,
                                          days: parseInt(e.target.value) || 1
                                        }
                                      }
                                    })}
                                    className="w-full border-2 border-gray-600 rounded-md shadow-sm py-2 px-3 bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 text-sm"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-300 mb-1">Price (MWK)</label>
                                  <input
                                    type="number"
                                    min="0"
                                    step="100"
                                    title="Standard delivery price"
                                    value={editingProduct.deliveryTimeOptions.standard.price || 0}
                                    onChange={(e) => setEditingProduct({
                                      ...editingProduct,
                                      deliveryTimeOptions: {
                                        ...editingProduct.deliveryTimeOptions,
                                        standard: {
                                          ...editingProduct.deliveryTimeOptions.standard,
                                          price: parseInt(e.target.value) || 0
                                        }
                                      }
                                    })}
                                    className="w-full border-2 border-gray-600 rounded-md shadow-sm py-2 px-3 bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 text-sm"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-300 mb-1">Description</label>
                                  <input
                                    type="text"
                                    title="Standard delivery description"
                                    value={editingProduct.deliveryTimeOptions.standard.description}
                                    onChange={(e) => setEditingProduct({
                                      ...editingProduct,
                                      deliveryTimeOptions: {
                                        ...editingProduct.deliveryTimeOptions,
                                        standard: {
                                          ...editingProduct.deliveryTimeOptions.standard,
                                          description: e.target.value
                                        }
                                      }
                                    })}
                                    className="w-full border-2 border-gray-600 rounded-md shadow-sm py-2 px-3 bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 text-sm"
                                  />
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Express Delivery */}
                          <div className="border border-gray-600 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <label className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={editingProduct.deliveryTimeOptions.express.enabled}
                                  onChange={(e) => setEditingProduct({
                                    ...editingProduct,
                                    deliveryTimeOptions: {
                                      ...editingProduct.deliveryTimeOptions,
                                      express: {
                                        ...editingProduct.deliveryTimeOptions.express,
                                        enabled: e.target.checked
                                      }
                                    }
                                  })}
                                  className="h-4 w-4 text-yellow-400 focus:ring-yellow-400 border-gray-600 bg-gray-700 rounded"
                                />
                                <span className="ml-2 text-sm font-medium text-white">Express Delivery</span>
                              </label>
                            </div>
                            {editingProduct.deliveryTimeOptions.express.enabled && (
                              <div className="grid grid-cols-3 gap-4">
                                <div>
                                  <label className="block text-xs font-medium text-gray-300 mb-1">Days</label>
                                  <input
                                    type="number"
                                    min="1"
                                    max="365"
                                    title="Express delivery days"
                                    value={editingProduct.deliveryTimeOptions.express.days}
                                    onChange={(e) => setEditingProduct({
                                      ...editingProduct,
                                      deliveryTimeOptions: {
                                        ...editingProduct.deliveryTimeOptions,
                                        express: {
                                          ...editingProduct.deliveryTimeOptions.express,
                                          days: parseInt(e.target.value) || 1
                                        }
                                      }
                                    })}
                                    className="w-full border-2 border-gray-600 rounded-md shadow-sm py-2 px-3 bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 text-sm"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-300 mb-1">Price (MWK)</label>
                                  <input
                                    type="number"
                                    min="0"
                                    step="100"
                                    title="Express delivery price"
                                    value={editingProduct.deliveryTimeOptions.express.price || 0}
                                    onChange={(e) => setEditingProduct({
                                      ...editingProduct,
                                      deliveryTimeOptions: {
                                        ...editingProduct.deliveryTimeOptions,
                                        express: {
                                          ...editingProduct.deliveryTimeOptions.express,
                                          price: parseInt(e.target.value) || 0
                                        }
                                      }
                                    })}
                                    className="w-full border-2 border-gray-600 rounded-md shadow-sm py-2 px-3 bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 text-sm"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-300 mb-1">Description</label>
                                  <input
                                    type="text"
                                    title="Express delivery description"
                                    value={editingProduct.deliveryTimeOptions.express.description}
                                    onChange={(e) => setEditingProduct({
                                      ...editingProduct,
                                      deliveryTimeOptions: {
                                        ...editingProduct.deliveryTimeOptions,
                                        express: {
                                          ...editingProduct.deliveryTimeOptions.express,
                                          description: e.target.value
                                        }
                                      }
                                    })}
                                    className="w-full border-2 border-gray-600 rounded-md shadow-sm py-2 px-3 bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 text-sm"
                                  />
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Premium Delivery */}
                          <div className="border border-gray-600 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <label className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={editingProduct.deliveryTimeOptions.premium.enabled}
                                  onChange={(e) => setEditingProduct({
                                    ...editingProduct,
                                    deliveryTimeOptions: {
                                      ...editingProduct.deliveryTimeOptions,
                                      premium: {
                                        ...editingProduct.deliveryTimeOptions.premium,
                                        enabled: e.target.checked
                                      }
                                    }
                                  })}
                                  className="h-4 w-4 text-yellow-400 focus:ring-yellow-400 border-gray-600 bg-gray-700 rounded"
                                />
                                <span className="ml-2 text-sm font-medium text-white">Premium Delivery</span>
                              </label>
                            </div>
                            {editingProduct.deliveryTimeOptions.premium.enabled && (
                              <div className="grid grid-cols-3 gap-4">
                                <div>
                                  <label className="block text-xs font-medium text-gray-300 mb-1">Days</label>
                                  <input
                                    type="number"
                                    min="1"
                                    max="365"
                                    title="Premium delivery days"
                                    value={editingProduct.deliveryTimeOptions.premium.days}
                                    onChange={(e) => setEditingProduct({
                                      ...editingProduct,
                                      deliveryTimeOptions: {
                                        ...editingProduct.deliveryTimeOptions,
                                        premium: {
                                          ...editingProduct.deliveryTimeOptions.premium,
                                          days: parseInt(e.target.value) || 1
                                        }
                                      }
                                    })}
                                    className="w-full border-2 border-gray-600 rounded-md shadow-sm py-2 px-3 bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 text-sm"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-300 mb-1">Price (MWK)</label>
                                  <input
                                    type="number"
                                    min="0"
                                    step="100"
                                    title="Premium delivery price"
                                    value={editingProduct.deliveryTimeOptions.premium.price || 0}
                                    onChange={(e) => setEditingProduct({
                                      ...editingProduct,
                                      deliveryTimeOptions: {
                                        ...editingProduct.deliveryTimeOptions,
                                        premium: {
                                          ...editingProduct.deliveryTimeOptions.premium,
                                          price: parseInt(e.target.value) || 0
                                        }
                                      }
                                    })}
                                    className="w-full border-2 border-gray-600 rounded-md shadow-sm py-2 px-3 bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 text-sm"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-300 mb-1">Description</label>
                                  <input
                                    type="text"
                                    title="Premium delivery description"
                                    value={editingProduct.deliveryTimeOptions.premium.description}
                                    onChange={(e) => setEditingProduct({
                                      ...editingProduct,
                                      deliveryTimeOptions: {
                                        ...editingProduct.deliveryTimeOptions,
                                        premium: {
                                          ...editingProduct.deliveryTimeOptions.premium,
                                          description: e.target.value
                                        }
                                      }
                                    })}
                                    className="w-full border-2 border-gray-600 rounded-md shadow-sm py-2 px-3 bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 text-sm"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step 5: Measurement Configuration (only for customizable products) */}
                    {editingProduct.isCustomizable && (
                      <div className="bg-gray-800 p-4 rounded-lg border border-yellow-400">
                        <h4 className="text-lg font-semibold text-yellow-400 mb-4">5. Measurement Configuration</h4>
                        <p className="text-sm text-gray-300 mb-4">
                          Configure which measurements customers need to provide for custom orders.
                        </p>
                        <MeasurementSelector
                          value={editingProduct.measurementConfig}
                          onChange={(config) => setEditingProduct({
                            ...editingProduct,
                            measurementConfig: config
                          })}
                          className="text-white"
                        />
                      </div>
                    )}

                    {/* Step 6: Sizes & Stock (only for ready-made products) */}
                    {!editingProduct.isCustomizable && (
                      <div className="bg-gray-800 p-4 rounded-lg border border-yellow-400">
                        <h4 className="text-lg font-semibold text-yellow-400 mb-4">5. Available Sizes & Stock Quantities *</h4>
                        <div className="grid grid-cols-2 gap-4">
                          {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((size) => {
                            const sizeStockItem = editingProduct.sizeStock.find(item => item.size === size);
                            const isSelected = editingProduct.sizes.includes(size);
                            const quantity = sizeStockItem?.quantity || 0;

                            return (
                              <div key={size} className={`p-3 border-2 rounded-lg transition-colors ${isSelected ? 'border-yellow-400 bg-gray-700' : 'border-gray-600'}`}>
                                <div className="flex items-center justify-between mb-2">
                                  <label className="flex items-center cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          // Add size and initialize stock
                                          const updatedSizeStock = [
                                            ...editingProduct.sizeStock.filter(item => item.size !== size),
                                            { size, quantity: 1 }
                                          ];
                                          const totalStock = updatedSizeStock.reduce((total, item) => total + item.quantity, 0);

                                          setEditingProduct({
                                            ...editingProduct,
                                            sizes: [...editingProduct.sizes, size],
                                            sizeStock: updatedSizeStock,
                                            stock: totalStock
                                          });
                                        } else {
                                          // Remove size and its stock
                                          const updatedSizeStock = editingProduct.sizeStock.filter(item => item.size !== size);
                                          const totalStock = updatedSizeStock.reduce((total, item) => total + item.quantity, 0);

                                          setEditingProduct({
                                            ...editingProduct,
                                            sizes: editingProduct.sizes.filter(s => s !== size),
                                            sizeStock: updatedSizeStock,
                                            stock: totalStock
                                          });
                                        }
                                      }}
                                      className="h-4 w-4 text-yellow-400 focus:ring-yellow-400 border-gray-600 bg-gray-700 rounded"
                                    />
                                    <span className="ml-2 text-sm font-medium text-white">{size}</span>
                                  </label>
                                </div>

                                {isSelected && (
                                  <div>
                                    <label className="block text-xs text-gray-400 mb-1">Stock Quantity</label>
                                    <input
                                      type="number"
                                      min="0"
                                      value={quantity}
                                      onChange={(e) => {
                                        const newQuantity = parseInt(e.target.value) || 0;
                                        const updatedSizeStock = [
                                          ...editingProduct.sizeStock.filter(item => item.size !== size),
                                          { size, quantity: newQuantity }
                                        ];

                                        // Calculate total stock from all sizes
                                        const totalStock = updatedSizeStock.reduce((total, item) => total + item.quantity, 0);

                                        setEditingProduct({
                                          ...editingProduct,
                                          sizeStock: updatedSizeStock,
                                          stock: totalStock // Auto-update total stock
                                        });
                                      }}
                                      className="w-full px-2 py-1 text-sm bg-gray-600 border border-gray-500 rounded text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                      placeholder="0"
                                    />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        <p className="text-xs text-gray-400 mt-2">
                          Select sizes and set stock quantity for each. Sizes with 0 stock will show as "Out of Stock" to buyers.
                        </p>
                      </div>
                    )}

                    {/* Step 5: Available Colors */}
                    {!editingProduct.isCustomizable && (
                      <div className="bg-gray-800 p-4 rounded-lg border border-yellow-400">
                        <h4 className="text-lg font-semibold text-yellow-400 mb-4">6. Available Colors</h4>
                        <div className="space-y-4">
                          {/* Color Input */}
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Add Colors (one per line)
                            </label>
                            <textarea
                              value={editingProduct.colors?.join('\n') || ''}
                              onChange={(e) => {
                                const colors = e.target.value.split('\n').filter(color => color.trim());
                                setEditingProduct({
                                  ...editingProduct,
                                  colors: colors
                                });
                              }}
                              className="w-full border-2 border-gray-600 rounded-md shadow-sm py-3 px-4 bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 text-sm"
                              rows={4}
                              placeholder="Red&#10;Blue&#10;Black&#10;White&#10;Green"
                            />
                            <p className="text-xs text-gray-400 mt-2">
                              Enter each color on a new line. Leave empty if color doesn't matter for this product.
                            </p>
                          </div>

                          {/* Color Preview */}
                          {editingProduct.colors && editingProduct.colors.length > 0 && (
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-2">
                                Color Preview
                              </label>
                              <div className="flex flex-wrap gap-2">
                                {editingProduct.colors.map((color, index) => (
                                  <span
                                    key={index}
                                    className="px-3 py-1 bg-yellow-400 text-black text-sm rounded-full"
                                  >
                                    {color}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Step 6: Pricing */}
                    <div className="bg-gray-800 p-4 rounded-lg border border-yellow-400">
                      <h4 className="text-lg font-semibold text-yellow-400 mb-4">5. Pricing</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="product-price" className="block text-sm font-medium text-gray-300 mb-2">
                            Original Price (MWK) *
                          </label>
                          <input
                            type="number"
                            id="product-price"
                            value={editingProduct.price}
                            onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) || 0 })}
                            className="w-full border-2 border-gray-600 rounded-md shadow-sm py-3 px-4 bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 text-sm"
                            min="0"
                            step="100"
                            placeholder="0"
                            required
                          />
                        </div>

                        <div>
                          <label htmlFor="product-discount-price" className="block text-sm font-medium text-gray-300 mb-2">
                            Discount Price (MWK)
                          </label>
                          <input
                            type="number"
                            id="product-discount-price"
                            value={editingProduct.discountPrice || ''}
                            onChange={(e) => {
                              const value = e.target.value;
                              setEditingProduct({
                                ...editingProduct,
                                discountPrice: value ? parseFloat(value) : undefined
                              });
                            }}
                            className="w-full border-2 border-gray-600 rounded-md shadow-sm py-3 px-4 bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 text-sm"
                            min="0"
                            step="100"
                            max={editingProduct.price}
                            placeholder="Leave empty for no discount"
                          />
                          {editingProduct.discountPrice && editingProduct.discountPrice >= editingProduct.price && (
                            <p className="mt-2 text-sm text-red-400">Discount price must be less than original price</p>
                          )}
                        </div>
                      </div>
                    </div>


                    {/* Step 6: Stock & Categories */}
                    <div className="bg-gray-800 p-4 rounded-lg border border-yellow-400">
                      <h4 className="text-lg font-semibold text-yellow-400 mb-4">{editingProduct.isCustomizable ? '6. Categories' : '7. Stock & Categories'}</h4>
                      <div className={`grid ${editingProduct.isCustomizable ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
                        {!editingProduct.isCustomizable && (
                          <div>
                            <label htmlFor="product-stock" className="block text-sm font-medium text-gray-300 mb-2">
                              Stock Quantity *
                            </label>
                            <input
                              type="number"
                              id="product-stock"
                              value={editingProduct.stock}
                              onChange={(e) => setEditingProduct({ ...editingProduct, stock: parseInt(e.target.value) || 0 })}
                              className="w-full border-2 border-gray-600 rounded-md shadow-sm py-3 px-4 bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 text-sm"
                              min="0"
                              placeholder="0"
                              required
                            />
                          </div>
                        )}

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Product Categories * (Select Multiple)
                          </label>
                          <div className="space-y-3">
                            {/* Main Categories */}
                            <div>
                              <label className="block text-xs font-medium text-gray-400 mb-2">Main Categories</label>
                              <div className="grid grid-cols-4 gap-2">
                                {['Men', 'Women', 'Adult', 'Kids'].map((category) => (
                                  <button
                                    key={category}
                                    type="button"
                                    onClick={() => {
                                      const isSelected = editingProduct.category.includes(category);
                                      if (isSelected) {
                                        setEditingProduct({ 
                                          ...editingProduct, 
                                          category: editingProduct.category.filter(cat => cat !== category)
                                        });
                                      } else {
                                        setEditingProduct({ 
                                          ...editingProduct, 
                                          category: [...editingProduct.category, category]
                                        });
                                      }
                                    }}
                                    className={`px-3 py-2 text-sm rounded-md border-2 transition-colors ${
                                      editingProduct.category.includes(category)
                                        ? 'bg-yellow-400 border-yellow-400 text-gray-900'
                                        : 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600'
                                    }`}
                                  >
                                    {category}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Specific Categories */}
                            <div>
                              <label className="block text-xs font-medium text-gray-400 mb-2">Specific Categories</label>
                              <div className="grid grid-cols-2 gap-2">
                                {["Men's - Top", "Men's - Bottom", "Women's - Top", "Women's - Bottom", "Unisex - Top", "Unisex - Bottom"].map((category) => (
                                  <button
                                    key={category}
                                    type="button"
                                    onClick={() => {
                                      const isSelected = editingProduct.category.includes(category);
                                      if (isSelected) {
                                        setEditingProduct({ 
                                          ...editingProduct, 
                                          category: editingProduct.category.filter(cat => cat !== category)
                                        });
                                      } else {
                                        setEditingProduct({ 
                                          ...editingProduct, 
                                          category: [...editingProduct.category, category]
                                        });
                                      }
                                    }}
                                    className={`px-3 py-2 text-sm rounded-md border-2 transition-colors ${
                                      editingProduct.category.includes(category)
                                        ? 'bg-yellow-400 border-yellow-400 text-gray-900'
                                        : 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600'
                                    }`}
                                  >
                                    {category}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Style Categories */}
                            <div>
                              <label className="block text-xs font-medium text-gray-400 mb-2">Style Categories</label>
                              <div className="grid grid-cols-3 gap-2">
                                {['Formal Wear', 'Traditional Wear', 'Suit', 'Accessories', 'Footwear'].map((category) => (
                                  <button
                                    key={category}
                                    type="button"
                                    onClick={() => {
                                      const isSelected = editingProduct.category.includes(category);
                                      if (isSelected) {
                                        setEditingProduct({ 
                                          ...editingProduct, 
                                          category: editingProduct.category.filter(cat => cat !== category)
                                        });
                                      } else {
                                        setEditingProduct({ 
                                          ...editingProduct, 
                                          category: [...editingProduct.category, category]
                                        });
                                      }
                                    }}
                                    className={`px-3 py-2 text-sm rounded-md border-2 transition-colors ${
                                      editingProduct.category.includes(category)
                                        ? 'bg-yellow-400 border-yellow-400 text-gray-900'
                                        : 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600'
                                    }`}
                                  >
                                    {category}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Selected Categories Display */}
                            <div className="mt-2 p-3 bg-gray-700 rounded-md border border-gray-600">
                              <span className="text-sm text-gray-400">Selected Categories: </span>
                              {editingProduct.category.length > 0 ? (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {editingProduct.category.map((cat, index) => (
                                    <span 
                                      key={index}
                                      className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-400 text-gray-900"
                                    >
                                      {cat}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingProduct({ 
                                            ...editingProduct, 
                                            category: editingProduct.category.filter(c => c !== cat)
                                          });
                                        }}
                                        className="ml-1 text-gray-600 hover:text-gray-800"
                                      >
                                        ×
                                      </button>
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-sm font-medium text-gray-500">None selected</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Step 7: Description */}
                    <div className="bg-gray-800 p-4 rounded-lg border border-yellow-400">
                      <h4 className="text-lg font-semibold text-yellow-400 mb-4">7. Product Description *</h4>
                      <div>
                        <label htmlFor="product-description" className="block text-sm font-medium text-gray-300 mb-2">
                          Description
                        </label>
                        <textarea
                          id="product-description"
                          value={editingProduct.description}
                          onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                          rows={4}
                          className="w-full border-2 border-gray-600 rounded-md shadow-sm py-3 px-4 bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 text-sm"
                          placeholder="Describe your product in detail..."
                          required
                        />
                        <p className="text-xs text-gray-400 mt-2">
                          Provide a detailed description of your product including materials, style, and unique features.
                        </p>
                      </div>
                    </div>

                    {/* Step 8: Shipping Fee */}
                    <div className="bg-gray-800 p-4 rounded-lg border border-yellow-400">
                      <h4 className="text-lg font-semibold text-yellow-400 mb-4">8. Additional Options</h4>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Tags (Optional)
                          </label>
                          <input
                            type="text"
                            value={editingProduct.tags.join(', ')}
                            onChange={(e) => {
                              const tags = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag);
                              setEditingProduct({ ...editingProduct, tags });
                            }}
                            placeholder="casual, formal, traditional, summer"
                            className="w-full border-2 border-gray-600 rounded-md shadow-sm py-3 px-4 bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 text-sm"
                          />
                          <p className="text-xs text-gray-400 mt-1">
                            Add tags separated by commas to help customers find your product
                          </p>
                        </div>

                        <div>
                          <label className="flex items-center p-3 border-2 rounded-lg cursor-pointer transition-colors hover:bg-gray-700 ${editingProduct.isFeatured ? 'border-yellow-400 bg-gray-700' : 'border-gray-600'}">
                            <input
                              type="checkbox"
                              checked={editingProduct.isFeatured}
                              onChange={(e) => setEditingProduct({ ...editingProduct, isFeatured: e.target.checked })}
                              className="h-4 w-4 text-yellow-400 focus:ring-yellow-400 border-gray-600 bg-gray-700 rounded"
                            />
                            <div className="ml-3">
                              <span className="text-sm font-medium text-white">Featured Product</span>
                              <p className="text-xs text-gray-400">Display this product prominently on the homepage</p>
                            </div>
                          </label>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Modal Footer */}
                <div className="bg-gray-900 px-6 py-4 border-t-2 border-yellow-400">
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        setIsModalOpen(false);
                        setEditingProduct(null);
                      }}
                      className="inline-flex items-center px-6 py-3 border-2 border-gray-600 text-sm font-medium rounded-lg text-white bg-gray-800 hover:bg-gray-700 hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                    >
                      {t('common.cancel')}
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex items-center px-6 py-3 border-2 border-yellow-400 text-sm font-medium rounded-lg text-gray-900 bg-yellow-400 hover:bg-yellow-300 hover:border-yellow-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2"></div>
                          {editingProduct._id ? 'Saving...' : 'Creating...'}
                        </>
                      ) : (
                        editingProduct._id ? 'Save Changes' : 'Create Product'
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={closeProductModal}></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full sm:max-h-[90vh]">
              {/* Modal Header */}
              <div className="bg-white px-6 pt-6 pb-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Product Details & Reviews
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
              <div className="product-modal-content bg-white px-6 py-6 overflow-y-auto">
                {/* Product Info */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                  {/* Product Image */}
                  <div className="product-modal-image bg-gray-200 rounded-lg overflow-hidden">
                    <img
                      src={getOptimizedImageUrl(selectedProduct.images[0], 600, 600)}
                      alt={selectedProduct.name}
                      className="w-full h-full object-contain"
                      onError={handleImageError}
                    />
                  </div>

                  {/* Product Details */}
                  <div className="flex flex-col h-full">
                    <div className="flex-1">
                      <h2 className="text-3xl font-bold text-gray-900 mb-4">{selectedProduct.name}</h2>
                      <p className="text-gray-600 mb-6 text-lg leading-relaxed">{selectedProduct.description}</p>

                      <div className="space-y-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-base font-medium text-gray-700">Price:</span>
                            <div className="flex items-center space-x-2">
                              <span className="text-2xl font-bold text-gray-900">
                                {formatCurrency(selectedProduct.discountPrice || selectedProduct.price)}
                              </span>
                              {selectedProduct.discountPrice && (
                                <span className="text-lg text-gray-500 line-through">
                                  {formatCurrency(selectedProduct.price)}
                                </span>
                              )}
                            </div>
                          </div>
                          {selectedProduct.discountPrice && (
                            <div className="text-sm text-green-600 font-medium">
                              Save {formatCurrency(selectedProduct.price - selectedProduct.discountPrice)}
                              ({Math.round(((selectedProduct.price - selectedProduct.discountPrice) / selectedProduct.price) * 100)}% off)
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-blue-50 p-3 rounded-lg">
                            <span className="text-sm font-medium text-blue-700 block">Category</span>
                            <span className="text-base text-blue-900 capitalize">{selectedProduct.category}</span>
                          </div>

                          <div className={`p-3 rounded-lg ${
                            selectedProduct.inStock ? 'bg-green-50' : 'bg-red-50'
                          }`}>
                            <span className={`text-sm font-medium block ${
                              selectedProduct.inStock ? 'text-green-700' : 'text-red-700'
                            }`}>Stock Status</span>
                            <span className={`text-base font-medium ${
                              selectedProduct.inStock ? 'text-green-900' : 'text-red-900'
                            }`}>
                              {selectedProduct.inStock ? `In Stock (${selectedProduct.stockQuantity})` : 'Out of Stock'}
                            </span>
                          </div>
                        </div>

                        <div className="bg-yellow-50 p-4 rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="text-base font-medium text-yellow-700">Customer Rating:</span>
                            <div className="flex items-center space-x-2">
                              <div className="flex">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`h-5 w-5 ${
                                      star <= selectedProduct.rating
                                        ? 'text-yellow-400 fill-current'
                                        : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-base font-semibold text-yellow-900">
                                {selectedProduct.rating.toFixed(1)} ({selectedProduct.reviewCount} reviews)
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="text-sm text-gray-500 pt-2 border-t border-gray-200">
                          <span className="font-medium">Created:</span> {formatDate(selectedProduct.createdAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Reviews Section */}
                <div className="border-t border-gray-200 pt-8 mt-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">
                    Customer Reviews ({productReviews.length})
                  </h3>

                  {reviewsLoading ? (
                    <div className="flex justify-center py-12">
                      <LoadingSpinner />
                    </div>
                  ) : productReviews.length > 0 ? (
                    <div className="space-y-6 max-h-96 overflow-y-auto pr-2">
                      {productReviews.map((review) => (
                        <div key={review._id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                          <div className="flex items-start space-x-4">
                            <div className="h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-lg font-semibold text-primary-600">
                                {(review.user?.name || 'A').charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="text-lg font-medium text-gray-900">{review.user?.name || 'Anonymous'}</h4>
                                <span className="text-sm text-gray-500">
                                  {formatDate(review.createdAt)}
                                </span>
                              </div>
                              <div className="flex items-center mb-3">
                                <div className="flex">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      className={`h-4 w-4 ${
                                        star <= review.rating
                                          ? 'text-yellow-400 fill-current'
                                          : 'text-gray-300'
                                      }`}
                                    />
                                  ))}
                                </div>
                                <span className="ml-2 text-sm font-medium text-gray-700">
                                  {review.rating}/5
                                </span>
                              </div>
                              <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                      <Star className="mx-auto h-16 w-16 text-gray-400" />
                      <h3 className="mt-4 text-lg font-medium text-gray-900">No reviews yet</h3>
                      <p className="mt-2 text-gray-500">This product hasn't received any reviews yet.</p>
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

export default ProductManagement;
 